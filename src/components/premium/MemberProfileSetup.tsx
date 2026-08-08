"use client";

import { useState } from "react";
import { Sparkles, Link as LinkIcon, Check } from "lucide-react";
import { clsx } from "clsx";
import { Field } from "@/components/ui/field";
import { InfoHint } from "@/components/ui/InfoHint";
import { WRITING_STYLES, type WritingStyle } from "@/lib/premium-types";

type Props = {
    onComplete: (input: {
        affiliateLink: string;
        niche: string;
        writingStyle: WritingStyle;
    }) => Promise<boolean>;
    saving?: boolean;
    error?: string;
    initial?: {
        affiliateLink?: string;
        niche?: string;
        writingStyle?: WritingStyle;
    };
};

export function MemberProfileSetup({ onComplete, saving, error, initial }: Props) {
    const [affiliateLink, setAffiliateLink] = useState(initial?.affiliateLink ?? "");
    const [niche, setNiche] = useState(initial?.niche ?? "");
    const [writingStyle, setWritingStyle] = useState<WritingStyle>(
        initial?.writingStyle ?? "personal_story"
    );
    const [localError, setLocalError] = useState("");

    const handleSubmit = async () => {
        setLocalError("");
        if (!affiliateLink.trim().startsWith("http")) {
            setLocalError("Please paste your full affiliate link (starts with https://).");
            return;
        }
        if (!niche.trim()) {
            setLocalError("Tell us what you are promoting — e.g. Weight Loss, Make Money Online.");
            return;
        }
        await onComplete({ affiliateLink: affiliateLink.trim(), niche: niche.trim(), writingStyle });
    };

    return (
        <section className="premium-setup-card">
            <div className="flex items-center gap-3 mb-6">
                <div className="premium-icon-well">
                    <Sparkles size={20} />
                </div>
                <div>
                    <h2 className="ds-h3">Quick Setup — Do This Once</h2>
                    <p className="ds-body-sm text-text-secondary">
                        We&apos;ll remember your link and style. Every premium tool auto-fills from here.
                    </p>
                </div>
            </div>

            <div className="flex flex-col gap-5">
                <Field
                    label={
                        <span className="inline-flex items-center gap-2">
                            Your Affiliate Link
                            <InfoHint
                                label="What is an affiliate link?"
                                text="This is your special link from Digistore24 or ClickBank. When someone buys through it, you get paid."
                            />
                        </span>
                    }
                    type="url"
                    placeholder="https://www.digistore24.com/redir/XXXXX/your-id/"
                    value={affiliateLink}
                    onChange={(e) => setAffiliateLink(e.target.value)}
                />

                <Field
                    label={
                        <span className="inline-flex items-center gap-2">
                            What Are You Promoting?
                            <InfoHint
                                label="What is a niche?"
                                text="Just the topic — like Weight Loss, Skincare, or Make Money Online. Pick what matches your product."
                            />
                        </span>
                    }
                    placeholder="e.g. Weight Loss, Make Money Online, Skincare"
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                />

                <div className="flex flex-col gap-3">
                    <span className="ds-label inline-flex items-center gap-2">
                        Your Writing Style
                        <InfoHint
                            label="Why pick a style?"
                            text="This controls how your posts sound — like a personal story, straight advice, or a curious question."
                        />
                    </span>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        {WRITING_STYLES.map((style) => (
                            <button
                                key={style.id}
                                type="button"
                                onClick={() => setWritingStyle(style.id)}
                                className={clsx(
                                    "premium-style-card text-left",
                                    writingStyle === style.id && "is-selected"
                                )}
                            >
                                <span className="font-semibold text-text-primary">{style.label}</span>
                                <p className="mt-2 text-[13px] leading-relaxed text-text-secondary line-clamp-3">
                                    &ldquo;{style.sample}&rdquo;
                                </p>
                                {writingStyle === style.id && (
                                    <Check size={14} className="absolute top-3 right-3 text-[var(--gold)]" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {(localError || error) && (
                    <p className="text-sm text-[var(--danger)]">{localError || error}</p>
                )}

                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={saving}
                    className="btn-primary py-4"
                >
                    <LinkIcon size={18} />
                    <span>{saving ? "Saving..." : "Save & Continue"}</span>
                </button>
            </div>
        </section>
    );
}
