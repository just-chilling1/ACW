"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

const CTA_URL = "https://www.breakoutai.net/5k-passive-9";

export default function ScaleTrainingPage() {
  return (
    <div className="flex flex-col gap-10 pb-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col items-center gap-6 text-center"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(234,179,8,0.25)] bg-[rgba(234,179,8,0.08)] px-5 py-2">
          <Sparkles size={14} strokeWidth={1.75} className="text-[var(--gold)]" />
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--gold)]">
            Exclusive Training
          </span>
        </div>

        <h1 className="ds-h1 max-w-3xl text-[clamp(2rem,5vw,3rem)]!">
          Scale Your <span className="text-gradient">CashTap AI</span> To $1,000+ Per Day
        </h1>

        <p className="ds-subtitle max-w-xl text-base md:text-lg">
          Watch this exclusive training to multiply your results and automate your path to
          life-changing income.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex justify-center"
      >
        <a
          href={CTA_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary group px-10 py-5 text-lg"
        >
          <span>Click Here To Access Training</span>
          <ArrowRight size={20} strokeWidth={1.75} className="transition-transform group-hover:translate-x-1" />
        </a>
      </motion.div>
    </div>
  );
}
