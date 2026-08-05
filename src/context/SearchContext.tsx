"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
    readSession,
    writeSession,
    clearSession,
    migrateLegacySession,
    clearLegacySession,
} from "@/lib/session-storage";
import { cleanHistoryItems, sanitizeTopicKeyword, isValidTopicKeyword } from "@/lib/keyword";

export interface Ad {
    id: string;
    platform: string;
    text: string;
    title?: string;
    url: string;
    engagement: string | number;
}

export interface AnalysisData {
    level: string;
    count: number;
    type?: string;
    classification: string;
    confidence?: number;
    sources?: number;
    liveData?: boolean;
}

interface SearchContextType {
    keyword: string;
    setKeyword: (k: string) => void;
    variations: string[];
    setVariations: (v: string[]) => void;
    activeChip: string;
    setActiveChip: (c: string) => void;
    postsByVariation: Record<string, Ad[]>;
    setPostsByVariation: React.Dispatch<React.SetStateAction<Record<string, Ad[]>>>;
    activityByVariation: Record<string, string>;
    setActivityByVariation: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    analysisByVariation: Record<string, AnalysisData>;
    setAnalysisByVariation: React.Dispatch<React.SetStateAction<Record<string, AnalysisData>>>;
    affiliateLink: string;
    setAffiliateLink: (l: string) => void;
    expandedPostId: string | null;
    setExpandedPostId: (id: string | null) => void;
    repliesByPostId: Record<string, string[]>;
    setRepliesByPostId: (r: Record<string, string[]>) => void;
    selectedAds: Ad[];
    setSelectedAds: (p: Ad[]) => void;
    history: string[];
    addToHistory: (k: string) => void;
    step1Completed: boolean;
    setStep1Completed: (completed: boolean) => void;
    resetSession: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

const EMPTY_STATE = {
    keyword: "",
    variations: [] as string[],
    activeChip: "",
    affiliateLink: "",
    history: [] as string[],
};

export function SearchProvider({ children }: { children: React.ReactNode }) {
    const [userId, setUserId] = useState<string | null>(null);
    const userIdRef = useRef<string | null>(null);
    const [keyword, setKeyword] = useState("");
    const [variations, setVariations] = useState<string[]>([]);
    const [activeChip, setActiveChip] = useState("");
    const [postsByVariation, setPostsByVariation] = useState<Record<string, Ad[]>>({});
    const [activityByVariation, setActivityByVariation] = useState<Record<string, string>>({});
    const [analysisByVariation, setAnalysisByVariation] = useState<Record<string, AnalysisData>>({});
    const [affiliateLink, setAffiliateLink] = useState("");
    const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
    const [repliesByPostId, setRepliesByPostId] = useState<Record<string, string[]>>({});
    const [selectedAds, setSelectedAds] = useState<Ad[]>([]);
    const [history, setHistory] = useState<string[]>([]);
    const [step1Completed, setStep1Completed] = useState(false);

    const clearInMemoryState = useCallback(() => {
        setKeyword(EMPTY_STATE.keyword);
        setVariations(EMPTY_STATE.variations);
        setActiveChip(EMPTY_STATE.activeChip);
        setAffiliateLink(EMPTY_STATE.affiliateLink);
        setHistory(EMPTY_STATE.history);
        setStep1Completed(false);
        setPostsByVariation({});
        setActivityByVariation({});
        setAnalysisByVariation({});
        setExpandedPostId(null);
        setRepliesByPostId({});
        setSelectedAds([]);
    }, []);

    const hydrateFromStorage = useCallback((uid: string) => {
        migrateLegacySession(uid);
        const saved = readSession(uid);
        if (saved.step1Completed) {
            setStep1Completed(true);
            if (saved.keyword) {
                const cleanedKeyword = sanitizeTopicKeyword(saved.keyword);
                setKeyword(isValidTopicKeyword(cleanedKeyword) ? cleanedKeyword : "");
            }
            if (saved.variations) setVariations(saved.variations);
            if (saved.activeChip) setActiveChip(saved.activeChip);
        }
        if (saved.affiliateLink) setAffiliateLink(saved.affiliateLink);
        if (saved.history) setHistory(cleanHistoryItems(saved.history));
    }, []);

    const fetchHistoryFromDb = useCallback(async (uid: string) => {
        try {
            const { data, error } = await supabase
                .from("search_history")
                .select("keyword")
                .eq("user_id", uid)
                .order("created_at", { ascending: false })
                .limit(20);

            if (!error && data) {
                const uniqueKeywords = cleanHistoryItems(data.map((item) => item.keyword));
                setHistory(uniqueKeywords);
                writeSession(uid, { history: uniqueKeywords });
            }
        } catch (e) {
            console.error("Error fetching search history:", e);
        }
    }, []);

    // Auth listener — reload state when the logged-in user changes
    useEffect(() => {
        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const uid = session?.user?.id ?? null;
            userIdRef.current = uid;
            setUserId(uid);

            if (uid) {
                hydrateFromStorage(uid);
                await fetchHistoryFromDb(uid);
            } else {
                clearLegacySession();
            }
        };

        void init();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const newUid = session?.user?.id ?? null;
            if (newUid === userIdRef.current) return;

            userIdRef.current = newUid;
            setUserId(newUid);
            clearInMemoryState();

            if (newUid) {
                hydrateFromStorage(newUid);
                void fetchHistoryFromDb(newUid);
            }
        });

        return () => subscription.unsubscribe();
    }, [clearInMemoryState, hydrateFromStorage, fetchHistoryFromDb]);

    // Drop corrupted topics that may still sit in memory or localStorage
    useEffect(() => {
        if (!userId) return;

        const cleanedHistory = cleanHistoryItems(history);
        const validKeyword = isValidTopicKeyword(sanitizeTopicKeyword(keyword))
            ? sanitizeTopicKeyword(keyword)
            : "";

        if (
            cleanedHistory.length !== history.length ||
            cleanedHistory.some((item, index) => item !== history[index])
        ) {
            setHistory(cleanedHistory);
        }
        if (keyword !== validKeyword) {
            setKeyword(validKeyword);
        }
    }, [userId, history, keyword]);

    // Persist changes to user-scoped localStorage
    useEffect(() => {
        if (!userId) return;

        const cleanedHistory = cleanHistoryItems(history);
        const cleanedKeyword = sanitizeTopicKeyword(keyword);
        const validKeyword = isValidTopicKeyword(cleanedKeyword) ? cleanedKeyword : "";

        writeSession(userId, {
            keyword: validKeyword,
            variations,
            activeChip,
            affiliateLink,
            history: cleanedHistory,
            selectedAds,
            step1Completed,
        });
    }, [userId, keyword, variations, activeChip, affiliateLink, history, selectedAds, step1Completed]);

    const addToHistory = async (k: string) => {
        const cleaned = sanitizeTopicKeyword(k);
        if (!cleaned) return;
        const newHistory = cleanHistoryItems([cleaned, ...history]);
        setHistory(newHistory);
    };

    const resetSession = async () => {
        const uid = userIdRef.current;
        clearInMemoryState();
        if (uid) clearSession(uid);
        clearLegacySession();
        await supabase.auth.signOut();
        window.location.href = "/login";
    };

    return (
        <SearchContext.Provider value={{
            keyword, setKeyword,
            variations, setVariations,
            activeChip, setActiveChip,
            postsByVariation, setPostsByVariation,
            activityByVariation, setActivityByVariation,
            analysisByVariation, setAnalysisByVariation,
            affiliateLink, setAffiliateLink,
            expandedPostId, setExpandedPostId,
            repliesByPostId, setRepliesByPostId,
            selectedAds, setSelectedAds,
            history, addToHistory,
            step1Completed, setStep1Completed,
            resetSession
        }}>
            {children}
        </SearchContext.Provider>
    );
}

export function useSearch() {
    const context = useContext(SearchContext);
    if (context === undefined) {
        throw new Error("useSearch must be used within a SearchProvider");
    }
    return context;
}
