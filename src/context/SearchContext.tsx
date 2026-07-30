"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

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

export function SearchProvider({ children }: { children: React.ReactNode }) {
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

    // Load history and last search state on mount
    useEffect(() => {
        const fetchHistoryAndState = async () => {
            try {
                // Restore from localStorage first for faster UI
                const savedKeyword = localStorage.getItem("cashtap_current_keyword");
                const savedVariations = localStorage.getItem("cashtap_current_variations");
                const savedChip = localStorage.getItem("cashtap_current_chip");
                const savedAffiliate = localStorage.getItem("cashtap_current_affiliate");
                if (savedKeyword) setKeyword(savedKeyword);
                if (savedVariations) setVariations(JSON.parse(savedVariations));
                if (savedChip) setActiveChip(savedChip);
                if (savedAffiliate) setAffiliateLink(savedAffiliate);
                // Do not restore selected ads across reloads — analysis/posts are session-only,
                // so restoring ads would unlock later steps out of order.

                // Fetch real history from Supabase
                const { data, error } = await supabase
                    .from("search_history")
                    .select("keyword")
                    .order("created_at", { ascending: false })
                    .limit(20);

                if (!error && data) {
                    const uniqueKeywords: string[] = [];
                    data.forEach(item => {
                        if (!uniqueKeywords.includes(item.keyword) && uniqueKeywords.length < 5) {
                            uniqueKeywords.push(item.keyword);
                        }
                    });
                    setHistory(uniqueKeywords);
                    localStorage.setItem("cashtap_history", JSON.stringify(uniqueKeywords));

                    // If we don't have a keyword in state, use the latest from history
                    if (!savedKeyword && uniqueKeywords[0]) {
                        const lastKeyword = uniqueKeywords[0];
                        setKeyword(lastKeyword);
                        localStorage.setItem("cashtap_current_keyword", lastKeyword);

                        // Also try to fetch variations for this last keyword
                        const { data: vData } = await supabase
                            .from("keyword_variations")
                            .select("variations")
                            .eq("parent_keyword", lastKeyword)
                            .single();

                        if (vData?.variations) {
                            setVariations(vData.variations);
                            setActiveChip(vData.variations[0]);
                            localStorage.setItem("cashtap_current_variations", JSON.stringify(vData.variations));
                            localStorage.setItem("cashtap_current_chip", vData.variations[0]);
                        }
                    }
                } else {
                    const savedHistory = localStorage.getItem("cashtap_history");
                    if (savedHistory) setHistory(JSON.parse(savedHistory));
                }
            } catch (e) {
                console.error("Error restoring state:", e);
                const savedHistory = localStorage.getItem("cashtap_history");
                if (savedHistory) setHistory(JSON.parse(savedHistory));
            }
        };
        fetchHistoryAndState();
    }, []);

    // Persist changes to localStorage
    useEffect(() => {
        if (keyword) localStorage.setItem("cashtap_current_keyword", keyword);
        if (variations.length > 0) localStorage.setItem("cashtap_current_variations", JSON.stringify(variations));
        if (activeChip) localStorage.setItem("cashtap_current_chip", activeChip);
        if (affiliateLink) localStorage.setItem("cashtap_current_affiliate", affiliateLink);
        localStorage.setItem("cashtap_selected_posts", JSON.stringify(selectedAds));
    }, [keyword, variations, activeChip, affiliateLink, selectedAds]);

    const addToHistory = async (k: string) => {
        const newHistory = [k, ...history.filter(h => h !== k)].slice(0, 5);
        setHistory(newHistory);
        localStorage.setItem("cashtap_history", JSON.stringify(newHistory));
    };

    const resetSession = async () => {
        setKeyword("");
        setVariations([]);
        setActiveChip("");
        setPostsByVariation({});
        setActivityByVariation({});
        setAnalysisByVariation({});
        setAffiliateLink("");
        setExpandedPostId(null);
        setRepliesByPostId({});
        setSelectedAds([]);
        setHistory([]);
        localStorage.removeItem("cashtap_history");
        localStorage.removeItem("cashtap_selected_posts");
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
