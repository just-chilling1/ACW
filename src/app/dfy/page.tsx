"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, Eye } from "lucide-react";
import { CampaignLibrary } from "@/components/dfy/campaign-tabs";
import { DfyVideoSection } from "@/components/dfy/dfy-video-section";
import {
  PremiumLandingShell,
  PremiumHero,
  PremiumSection,
  PremiumStateBlock,
} from "@/components/premium";

type CampaignSummary = {
  id: string;
  name: string;
  score: number | null;
  stats: { assetCount?: number; opportunityCount?: number };
  created_at: string;
  updated_at: string;
};

export default function DfyLandingPage() {
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dfy/campaigns")
      .then((r) => r.json())
      .then((d) => setCampaigns(d.campaigns || []))
      .catch(() => setCampaigns([]))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this campaign?")) return;
    await fetch(`/api/dfy/campaigns/${id}`, { method: "DELETE" });
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <PremiumLandingShell width="wide">
      <PremiumHero
        title={
          <>
            Your Marketing Campaign.{" "}
            <span className="text-gradient">Built For You.</span>
          </>
        }
        subtitle="Paste your link → get replies → copy posts → fill your week → done. Four simple steps."
        actions={
          <>
            <Link href="/dfy/new" className="btn-primary">
              <Sparkles size={18} strokeWidth={1.75} />
              Build My Campaign
            </Link>
            <Link href="/dfy/example" className="btn-secondary">
              <Eye size={18} strokeWidth={1.75} />
              See Example Campaign
            </Link>
          </>
        }
      >
        <p className="text-sm text-text-muted">
          One button at a time. Nothing happens until you click.
        </p>
      </PremiumHero>

      <DfyVideoSection />

      <PremiumSection
        title="My Campaigns"
        description="Reopen saved campaigns anytime."
      >
        {loading ? (
          <PremiumStateBlock rows={2} heightClassName="h-28" />
        ) : (
          <CampaignLibrary campaigns={campaigns} onDelete={handleDelete} />
        )}
      </PremiumSection>
    </PremiumLandingShell>
  );
}
