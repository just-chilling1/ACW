"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, BookOpen, Play } from "lucide-react";
import { ContactSupportWidget } from "@/components/dashboard/ContactSupportWidget";
import { DashboardTipsWidget } from "@/components/dashboard/DashboardTipsWidget";
import { PremiumUpgradesWidget } from "@/components/dashboard/PremiumUpgradesWidget";
import { BonusTrainingCard } from "@/components/ui/bonus-training-card";
import { DashboardVideoCard } from "@/components/ui/dashboard-video-card";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/ui/page-header";
import { DASHBOARD_TRAINING_VIDEOS } from "@/lib/dashboard-training-videos";

const VISIBLE_VIDEOS = DASHBOARD_TRAINING_VIDEOS.filter((v) => v.visible !== false);

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash;
    if (
      hash &&
      hash.includes("error=") &&
      (hash.includes("otp_expired") ||
        hash.includes("access_denied") ||
        hash.includes("recovery"))
    ) {
      const hashParams = new URLSearchParams(hash.substring(1));
      const errorDesc =
        hashParams.get("error_description") ||
        "This password reset link has expired or is invalid.";
      router.replace(
        `/reset-password?error=${encodeURIComponent(errorDesc.replace(/\+/g, " "))}`
      );
    }
  }, [router]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex w-full flex-col gap-8"
    >
      <PageHeader
        eyebrow="HOME"
        title={
          <>
            Welcome to{" "}
            <span>
              <span className="text-[var(--gold)]">AI</span> CashWave
            </span>
          </>
        }
        subtitle="Watch the videos below in order — then enter a topic and start finding ads to reply to. The Training Academy is there whenever you want a deeper walkthrough."
      />

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex min-w-0 flex-col gap-8">
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Play className="h-5 w-5 text-[var(--gold)]" strokeWidth={1.75} />
              <h2 className="ds-h2">Start Here</h2>
            </div>
            {VISIBLE_VIDEOS[0] ? (
              <DashboardVideoCard video={VISIBLE_VIDEOS[0]} chip="VIDEO 1" />
            ) : null}
          </section>

          <BonusTrainingCard />

          {VISIBLE_VIDEOS[1] ? (
            <DashboardVideoCard video={VISIBLE_VIDEOS[1]} chip="VIDEO 2" />
          ) : null}

          <BonusTrainingCard />

          {VISIBLE_VIDEOS[2] ? (
            <DashboardVideoCard video={VISIBLE_VIDEOS[2]} chip="VIDEO 3" />
          ) : null}

          <div className="flex flex-col gap-3">
            <Link
              href="/search"
              className="btn-primary flex min-h-[52px] w-full items-center justify-center gap-2 px-8 text-sm"
            >
              <Search size={18} strokeWidth={1.75} />
              Get Started Now — Enter Topic
            </Link>
            <Link
              href="/training"
              className="btn-secondary flex min-h-[52px] w-full items-center justify-center gap-2 px-8 text-sm"
            >
              <BookOpen size={18} strokeWidth={1.75} />
              Know More from the Training Academy
            </Link>
          </div>

        </div>

        <aside className="flex flex-col gap-4">
          <ContactSupportWidget />
          <DashboardTipsWidget />
          <PremiumUpgradesWidget />
        </aside>
      </div>
    </motion.div>
  );
}
