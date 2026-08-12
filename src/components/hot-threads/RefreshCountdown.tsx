"use client";

import { useEffect, useState } from "react";

interface RefreshCountdownProps {
  expiresAt: string;
}

function formatRemaining(ms: number): string {
  if (ms <= 0) return "Ready now";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  const s = totalSec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function RefreshCountdown({ expiresAt }: RefreshCountdownProps) {
  const [label, setLabel] = useState("…");

  useEffect(() => {
    const tick = () => {
      const remaining = new Date(expiresAt).getTime() - Date.now();
      setLabel(formatRemaining(remaining));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [expiresAt]);

  const ready = label === "Ready now";

  return (
    <p className="text-sm text-text-secondary">
      {ready ? (
        <>New threads ready — refresh to load them.</>
      ) : (
        <>
          New threads in <span className="font-semibold text-text-primary">{label}</span>
        </>
      )}
    </p>
  );
}
