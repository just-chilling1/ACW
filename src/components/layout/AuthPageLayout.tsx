"use client";

import { useEffect } from "react";
import { FloatingSupportButton } from "@/components/support/FloatingSupportButton";

export function AuthPageLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.body.classList.add("auth-page");
    document.body.style.overflow = "hidden";

    return () => {
      document.body.classList.remove("auth-page");
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="auth-page-scroll relative h-dvh overflow-y-auto overscroll-y-contain touch-pan-y">
      <FloatingSupportButton />
      <div className="flex min-h-full w-full flex-col items-center justify-center px-6 py-10 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[max(2.5rem,env(safe-area-inset-top))]">
        {children}
      </div>
    </div>
  );
}
