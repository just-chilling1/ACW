export type WritingStyle = "personal_story" | "straightforward" | "curious_question";

export const WRITING_STYLES: {
    id: WritingStyle;
    label: string;
    sample: string;
}[] = [
    {
        id: "personal_story",
        label: "Personal Story",
        sample: "I never thought I'd share this, but after years of trying everything, I finally found something that worked for me...",
    },
    {
        id: "straightforward",
        label: "Straight to the Point",
        sample: "If you're looking for a proven solution, this is the one I recommend. Simple, effective, and it actually works.",
    },
    {
        id: "curious_question",
        label: "Curious Question",
        sample: "Has anyone else tried this? I was skeptical at first, but the results surprised me. Worth checking out if you're on the fence.",
    },
];

export type MemberProfile = {
    user_id: string;
    affiliate_link: string;
    niche: string;
    writing_style: WritingStyle;
    setup_completed_at: string | null;
};

export type CampaignKeyword = {
    label: string;
    search: string;
    niche: string;
    description: string;
};

export type CampaignPost = {
    id: string;
    platform: string;
    title?: string;
    text: string;
    url: string;
    engagement: string | number;
    replies: string[];
};

export type CampaignExtras = {
    facebookPost: string;
    quoraAnswer: string;
    pinterestDescription: string;
};

export type CampaignData = {
    keywords: CampaignKeyword[];
    posts: CampaignPost[];
    extras: CampaignExtras;
    niche: string;
    affiliateLink: string;
};

export type RepurposePlatform =
    | "facebook"
    | "reddit"
    | "quora"
    | "whatsapp"
    | "email"
    | "sms";

export const REPURPOSE_PLATFORMS: { id: RepurposePlatform; label: string }[] = [
    { id: "facebook", label: "Facebook" },
    { id: "reddit", label: "Reddit" },
    { id: "quora", label: "Quora" },
    { id: "whatsapp", label: "WhatsApp" },
    { id: "email", label: "Email" },
    { id: "sms", label: "Text Message" },
];

export type SavedContentItem = {
    id: string;
    tool: string;
    content_type: string;
    title: string;
    body: string;
    metadata: Record<string, unknown>;
    status: "saved" | "posted";
    created_at: string;
};

export type TodayTask = {
    id: string;
    tool: string;
    title: string;
    description: string;
    actionLabel: string;
    href: string;
};

export type AutopilotPlanDay = {
    day: number;
    sourceIds: string[];
};
