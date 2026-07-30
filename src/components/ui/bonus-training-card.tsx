"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FREE_TRAINING_URL } from "@/lib/support";
import { Callout } from "@/components/ui/callout";

/** Compact free-training ad between dashboard videos — same copy, promo callout chrome. */
export function BonusTrainingCard() {
  return (
    <Callout
      variant="promo"
      actions={
        <Link
          href={FREE_TRAINING_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary inline-flex w-full max-w-xl text-sm sm:w-auto"
        >
          Yes! Show Me How To Earn $1,000-$5,000 A Day
          <ArrowRight className="h-4 w-4 shrink-0" />
        </Link>
      }
    >
      <p>
        Imagine rolling out of bed, checking your phone, and seeing an extra
        <span className="font-semibold text-text-primary"> $1,000, $3,000, or even $5,000 </span>
        deposited into your account—without grinding away at a 9-to-5 job, begging for overtime,
        or stressing over side hustles that barely pay the bills.
      </p>
      <p>
        This isn&apos;t some wild fantasy—it&apos;s a real, proven system that countless everyday
        people are using to generate consistent, life-changing income on autopilot. No experience?
        No problem. No tech skills? Doesn&apos;t matter. This works for anyone willing to follow a
        simple, step-by-step process.
      </p>
      <p>
        The best part?{" "}
        <span className="font-semibold text-text-primary">It runs 24/7, even while you sleep.</span>
      </p>
      <p className="font-semibold text-text-primary">
        Ready to break free from financial stress and start living life on your terms?
      </p>
      <p>
        Click the button below and discover how you can wake up to an extra
        <span className="font-semibold text-text-primary"> $1,000-$5,000 </span>
        in your bank account every single day!
      </p>
    </Callout>
  );
}
