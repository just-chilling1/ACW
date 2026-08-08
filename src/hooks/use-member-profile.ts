"use client";

import { useCallback, useEffect, useState } from "react";
import type { MemberProfile, WritingStyle } from "@/lib/premium-types";

type ProfileRow = {
    user_id: string;
    affiliate_link: string;
    niche: string;
    writing_style: WritingStyle;
    setup_completed_at: string | null;
};

function mapProfile(row: ProfileRow | null): MemberProfile | null {
    if (!row) return null;
    return {
        user_id: row.user_id,
        affiliate_link: row.affiliate_link,
        niche: row.niche,
        writing_style: row.writing_style,
        setup_completed_at: row.setup_completed_at,
    };
}

export function useMemberProfile() {
    const [profile, setProfile] = useState<MemberProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const refresh = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const resp = await fetch("/api/premium/profile");
            const data = await resp.json();
            if (!resp.ok) throw new Error(data.error || "Failed to load profile");
            setProfile(mapProfile(data.profile));
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to load profile");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const saveProfile = async (input: {
        affiliateLink: string;
        niche: string;
        writingStyle: WritingStyle;
    }) => {
        setSaving(true);
        setError("");
        try {
            const resp = await fetch("/api/premium/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    affiliateLink: input.affiliateLink,
                    niche: input.niche,
                    writingStyle: input.writingStyle,
                }),
            });
            const data = await resp.json();
            if (!resp.ok) throw new Error(data.error || "Failed to save");
            setProfile(mapProfile(data.profile));
            return true;
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to save");
            return false;
        } finally {
            setSaving(false);
        }
    };

    return {
        profile,
        loading,
        saving,
        error,
        refresh,
        saveProfile,
        isSetupComplete: Boolean(profile?.setup_completed_at && profile.affiliate_link),
    };
}
