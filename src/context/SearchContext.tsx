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

    const clearInMemoryState = useCallback(() => {
        setKeyword(EMPTY_STATE.keyword);
        setVariations(EMPTY_STATE.variations);
        setActiveChip(EMPTY_STATE.activeChip);
        setAffiliateLink(EMPTY_STATE.affiliateLink);
        setHistory(EMPTY_STATE.history);
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
        if (saved.keyword) setKeyword(saved.keyword);
        if (saved.variations) setVariations(saved.variations);
        if (saved.activeChip) setActiveChip(saved.activeChip);
        if (saved.affiliateLink) setAffiliateLink(saved.affiliateLink);
        if (saved.history) setHistory(saved.history);
    }, []);

    const fetchHistoryFromDb = useCallback(async (uid: string, savedKeyword?: string) => {
        try {
            const { data, error } = await supabase
                .from("search_history")
                .select("keyword")
                .eq("user_id", uid)
                .order("created_at", { ascending: false })
                .limit(20);

            if (!error && data) {
                const uniqueKeywords: string[] = [];
                data.forEach((item) => {
                    if (!uniqueKeywords.includes(item.keyword) && uniqueKeywords.length < 5) {
                        uniqueKeywords.push(item.keyword);
                    }
                });
                setHistory(uniqueKeywords);
                writeSession(uid, { history: uniqueKeywords });

                if (!savedKeyword && uniqueKeywords[0]) {
                    const lastKeyword = uniqueKeywords[0];
                    setKeyword(lastKeyword);
                    writeSession(uid, { keyword: lastKeyword });

                    const { data: vData } = await supabase
                        .from("keyword_variations")
                        .select("variations")
                        .eq("parent_keyword", lastKeyword)
                        .single();

                    if (vData?.variations) {
                        setVariations(vData.variations);
                        setActiveChip(vData.variations[0]);
                        writeSession(uid, {
                            keyword: lastKeyword,
                            variations: vData.variations,
                            activeChip: vData.variations[0],
                        });
                    }
                }
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
                const saved = readSession(uid);
                await fetchHistoryFromDb(uid, saved.keyword);
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
                const saved = readSession(newUid);
                void fetchHistoryFromDb(newUid, saved.keyword);
            }
        });

        return () => subscription.unsubscribe();
    }, [clearInMemoryState, hydrateFromStorage, fetchHistoryFromDb]);

    // Persist changes to user-scoped localStorage
    useEffect(() => {
        if (!userId) return;
        writeSession(userId, {
            keyword,
            variations,
            activeChip,
            affiliateLink,
            history,
            selectedAds,
        });
    }, [userId, keyword, variations, activeChip, affiliateLink, history, selectedAds]);

    const addToHistory = async (k: string) => {
        const newHistory = [k, ...history.filter((h) => h !== k)].slice(0, 5);
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
