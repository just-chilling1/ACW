"use client";

import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { clsx } from "clsx";

export type PremiumLandingWidth = "narrow" | "wide";

type PremiumLandingShellProps = {
  children: ReactNode;
  className?: string;
  /**
   * narrow = max-w-2xl (rare constrained tools)
   * wide = fill Shell content area with only page margins (default; DFY + all premium landings)
   */
  width?: PremiumLandingWidth;
  /** Disable entrance motion when nested or already animating */
  animate?: boolean;
};

const WIDTH: Record<PremiumLandingWidth, string> = {
  narrow: "max-w-2xl",
  // Shell already provides max-w-6xl + horizontal padding — don't nest another width/padding island
  wide: "max-w-none",
};

export function PremiumLandingShell({
  children,
  className,
  width = "wide",
  animate = true,
}: PremiumLandingShellProps) {
  const classes = clsx(
    // Horizontal padding comes from Shell; keep vertical rhythm + bottom clearance for bottom nav
    "premium-landing mx-auto flex w-full flex-col gap-6 py-0 pb-10 sm:pb-12",
    WIDTH[width],
    className,
  );

  if (!animate) {
    return <div className={classes}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={classes}
    >
      {children}
    </motion.div>
  );
}
