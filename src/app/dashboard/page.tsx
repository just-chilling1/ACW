"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, BookOpen, Play, Headphones } from "lucide-react";
import { ContactSupportWidget } from "@/components/dashboard/ContactSupportWidget";
import { DashboardTipsWidget } from "@/components/dashboard/DashboardTipsWidget";
import { PremiumUpgradesWidget } from "@/components/dashboard/PremiumUpgradesWidget";
import { BonusTrainingCard } from "@/components/ui/bonus-training-card";
import { DashboardVideoCard } from "@/components/ui/dashboard-video-card";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/ui/page-header";
import { DASHBOARD_TRAINING_VIDEOS } from "@/lib/dashboard-training-videos";
import { SUPPORT_EMAIL } from "@/lib/support";

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
        title="Welcome to CashTap AI"
        subtitle="Watch the videos below in order — then enter a topic and start finding ads to reply to. The Training Academy is there whenever you want a deeper walkthrough."
      />

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-4">
        <div className="flex flex-col gap-8 xl:col-span-3">
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Play className="h-7 w-7 text-[#EAB308]" />
              <h2 className="ds-h2 text-text-primary">Start Here</h2>
            </div>
            {VISIBLE_VIDEOS[0] ? <DashboardVideoCard video={VISIBLE_VIDEOS[0]} /> : null}
          </section>

          <BonusTrainingCard />

          {VISIBLE_VIDEOS[1] ? <DashboardVideoCard video={VISIBLE_VIDEOS[1]} /> : null}

          <BonusTrainingCard />

          {VISIBLE_VIDEOS[2] ? <DashboardVideoCard video={VISIBLE_VIDEOS[2]} /> : null}

          <div className="flex flex-col gap-3">
            <Link
              href="/search"
              className="btn-primary flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl px-8 text-sm font-bold"
            >
              <Search size={20} />
              Get Started Now — Enter Topic
            </Link>
            <Link
              href="/training"
              className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl border border-border-dim/50 bg-surface/40 px-8 text-sm font-bold text-text-primary transition-colors hover:border-accent/40"
            >
              <BookOpen size={20} />
              Know More from the Training Academy
            </Link>
          </div>

          <section className="card-base border-accent/30 p-6">
            <div className="flex flex-col items-center justify-between gap-5 sm:flex-row">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#EAB308] to-[#6366F1] shadow-lg">
                  <Headphones size={28} className="text-white" />
                </div>
                <div>
                  <h3 className="mb-0.5 text-xl font-extrabold text-text-primary">Need Help?</h3>
                  <p className="text-sm text-text-muted">Priority support available 24/7</p>
                </div>
              </div>
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="btn-primary inline-flex min-h-12 items-center justify-center px-8 font-extrabold"
              >
                Contact Support
              </a>
            </div>
          </section>

          <p className="text-center text-xs italic text-text-muted">Individual results vary.</p>
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
