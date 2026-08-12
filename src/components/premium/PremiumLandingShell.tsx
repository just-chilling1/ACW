"use client";

import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { clsx } from "clsx";

export type PremiumLandingWidth = "narrow" | "wide";

type PremiumLandingShellProps = {
  children: ReactNode;
  className?: string;
  /** narrow = max-w-2xl (tools); wide = max-w-5xl (DFY library) */
  width?: PremiumLandingWidth;
  /** Disable entrance motion when nested or already animating */
  animate?: boolean;
};

const WIDTH: Record<PremiumLandingWidth, string> = {
  narrow: "max-w-2xl",
  wide: "max-w-5xl",
};

export function PremiumLandingShell({
  children,
  className,
  width = "narrow",
  animate = true,
}: PremiumLandingShellProps) {
  const classes = clsx(
    "premium-landing mx-auto flex w-full flex-col gap-6 px-4 py-6 pb-16 sm:px-6 sm:py-8",
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
