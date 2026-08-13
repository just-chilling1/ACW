"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
  Headphones,
  HelpCircle,
  Mail,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { ContactSupportWidget } from "@/components/dashboard/ContactSupportWidget";
import { SUPPORT_EMAIL, SUPPORT_PORTAL_URL } from "@/lib/support";

const FAQS = [
  {
    question: "How do I actually earn money with AI CashWave?",
    answer:
      "The core 4-step system finds real conversations online, then our AI writes replies that include your affiliate link. When someone clicks and buys, you earn a commission. You also get Done-For-You keywords with pre-made replies, 200+ ready-to-post Facebook posts via Instant Income, and 100+ traffic sources through Automated Profits.",
  },
  {
    question: "Do I need any experience or technical skills?",
    answer:
      "None at all. Every feature is designed for complete beginners. The app finds the ads, analyzes demand, writes the replies, and gives you ready-made posts. You just need to copy and paste.",
  },
  {
    question: "What should I do first after logging in?",
    answer:
      "Open Training from the sidebar and watch the two training videos, then the Premium Feature videos. After that, follow the Quick Start Checklist: search for your first topic, check demand, find ads, and create your first replies. You can also jump into Done-For-You or Instant Income for faster results.",
  },
  {
    question: "Where do I paste my affiliate link?",
    answer:
      "In Step 4 (Create Replies), paste it in the box at the top — it gets inserted into every reply. For Done-For-You and Instant Income, paste your link in the designated field on those pages before copying content.",
  },
  {
    question: "How does the 4-step system work?",
    answer:
      "Step 1: Enter a topic. Step 2: Check demand for related keywords. Step 3: Find real ads and conversations on Reddit and YouTube. Step 4: Generate AI replies with your affiliate link, copy them, and post as comments.",
  },
  {
    question: "What is Done-For-You?",
    answer:
      "Done-For-You is the fastest way to start earning. Pick a curated high-demand keyword, enter your affiliate link, and the app finds real posts and generates AI-powered replies with your link already included — no searching required.",
  },
  {
    question: "What is Instant Income?",
    answer:
      "Instant Income gives you 200+ pre-written Facebook posts across popular niches. Choose a niche, paste your affiliate link, copy a post, and share it in Facebook groups. Posts are written as personal success stories to drive engagement.",
  },
  {
    question: "What is Automated Profits?",
    answer:
      "Automated Profits gives you 100+ free traffic sources across 9 niches — forums, directories, Q&A sites, and more. Enter your URL once, follow each source’s instructions, copy the pre-written submission text, and mark sources done as you go. Traffic keeps coming after you submit.",
  },
  {
    question: "How many replies should I post per day?",
    answer:
      "We recommend at least 5 per day. Top earners post 10–20 replies daily. Consistency matters more than bursts — posting every day beats posting a lot once a week.",
  },
  {
    question: "Where can I find training videos?",
    answer:
      "Open Training from the sidebar (or More on mobile). You’ll find Getting Started and Advanced videos, plus Premium Feature walkthroughs for Done-For-You, Automated Profits, and Instant Income. There is also a full FAQ tab in Training.",
  },
  {
    question: "What are Exclusive offers in the sidebar?",
    answer:
      "Exclusive offers appear in the sidebar (and under More on mobile): Earn $400/Day Testing New Apps, Get Paid To Copy & Paste, and Fast Cash Training. Each opens in a new tab and is optional — separate from your membership.",
  },
  {
    question: "Can I use AI CashWave on my phone?",
    answer:
      "Yes. AI CashWave works in any modern web browser on desktop, tablet, or phone. You can search topics, copy replies, and post right from your phone.",
  },
  {
    question: "I’m getting an error or the page won’t load. What should I do?",
    answer:
      "Try these steps: (1) Refresh the page. (2) Clear your browser cache and cookies. (3) Try a different browser. (4) Check your internet connection. If it persists, log out and back in, or message us below.",
  },
  {
    question: "How do refunds work?",
    answer: `Full refund available within 30 days of purchase — no questions asked. Email ${SUPPORT_EMAIL} or open a ticket at ${SUPPORT_PORTAL_URL}. Refunds are typically processed within 5–7 business days.`,
  },
];

export default function SupportPage() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex w-full max-w-6xl flex-col gap-6 py-6"
    >
      <PageHeader
        eyebrow="HELP"
        title="Support Center"
        subtitle="Documentation and assistance for AI CashWave."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <a
          href={SUPPORT_PORTAL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group"
        >
          <div className="card-base flex h-full items-center gap-4 p-5! transition-colors group-hover:border-[var(--accent-border-strong)]">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--accent-border)] bg-[var(--accent-bg-medium)]">
              <Headphones size={22} strokeWidth={1.75} className="text-[var(--gold)]" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="ds-h3 mb-1">Support Portal</h3>
              <p className="text-sm text-text-muted">Open a ticket or check existing requests</p>
            </div>
            <ExternalLink
              size={18}
              strokeWidth={1.75}
              className="shrink-0 text-text-muted transition-colors group-hover:text-[var(--gold)]"
            />
          </div>
        </a>

        <a href={`mailto:${SUPPORT_EMAIL}`} className="group">
          <div className="card-base flex h-full items-center gap-4 p-5! transition-colors group-hover:border-[var(--success-border-strong)]">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--success-border)] bg-[var(--success-bg-faint)]">
              <Mail size={22} strokeWidth={1.75} className="text-[var(--success)]" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="ds-h3 mb-1">Email Support</h3>
              <p className="truncate text-sm text-text-muted">{SUPPORT_EMAIL}</p>
            </div>
            <ExternalLink
              size={18}
              strokeWidth={1.75}
              className="shrink-0 text-text-muted transition-colors group-hover:text-[var(--success)]"
            />
          </div>
        </a>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="card-base overflow-hidden p-0! lg:col-span-3">
          <div className="flex items-start gap-3 border-b border-[var(--border-subtle)] px-5 py-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--accent-border)] bg-[var(--accent-bg-medium)]">
              <HelpCircle size={20} strokeWidth={1.75} className="text-[var(--gold)]" />
            </div>
            <div>
              <h3 className="ds-h3">Frequently Asked Questions</h3>
              <p className="mt-1 text-sm text-text-muted">
                Common questions about AI CashWave. Full walkthroughs are in{" "}
                <Link href="/training" className="font-semibold text-[var(--gold)] hover:underline">
                  Training
                </Link>
                .
              </p>
            </div>
          </div>
          <div className="divide-y divide-[var(--border-subtle)]">
            {FAQS.map((faq, index) => (
              <div key={faq.question}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-[var(--surface-2)]"
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                >
                  <span className="pr-4 text-sm font-medium text-text-primary">{faq.question}</span>
                  {expandedFaq === index ? (
                    <ChevronUp size={18} strokeWidth={1.75} className="shrink-0 text-[var(--gold)]" />
                  ) : (
                    <ChevronDown size={18} strokeWidth={1.75} className="shrink-0 text-text-muted" />
                  )}
                </button>
                <AnimatePresence>
                  {expandedFaq === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-4 text-sm leading-relaxed text-text-secondary">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:sticky lg:top-6 lg:col-span-2 lg:self-start">
          <ContactSupportWidget />
        </div>
      </div>

      <div className="card-base">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--info-border)] bg-[var(--info-bg-faint)]">
            <FileText size={20} strokeWidth={1.75} className="text-[var(--copper)]" />
          </div>
          <div>
            <h3 className="ds-h3">Refund Protocol</h3>
            <p className="text-sm text-text-muted">Satisfaction guarantee terms</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="ds-well">
            <h4 className="mb-2 text-sm font-semibold text-[var(--gold)]">30-Day Guarantee</h4>
            <p className="text-sm text-text-secondary">
              Full refund available within 30 days of purchase. No interrogation required.
            </p>
          </div>
          <div className="ds-well">
            <h4 className="mb-2 text-sm font-semibold text-[var(--gold)]">Request Procedure</h4>
            <p className="text-sm text-text-secondary">
              Email us at {SUPPORT_EMAIL} or open a ticket on the support portal. Include your account email and purchase date.
            </p>
          </div>
          <div className="ds-well">
            <h4 className="mb-2 text-sm font-semibold text-[var(--gold)]">Processing Timeline</h4>
            <p className="text-sm text-text-secondary">
              Refunds processed within 5–7 business days. Confirmation sent upon completion.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
