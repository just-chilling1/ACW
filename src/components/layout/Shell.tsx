"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./bottom-nav";
import { SupportBanner } from "../dashboard/SupportBanner";
import { SpecialistWelcomePopup } from "../ui/specialist-welcome-popup";
import { BrandLogo } from "@/components/ui/brand-logo";

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname === "/onboarding" ||
    pathname.startsWith("/onboarding/") ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/dev/") ||
    pathname.startsWith("/embed/");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("cashtap_sidebar_collapsed");
    if (saved === "1") setSidebarCollapsed(true);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.sidebar = sidebarCollapsed ? "collapsed" : "expanded";
    localStorage.setItem("cashtap_sidebar_collapsed", sidebarCollapsed ? "1" : "0");
  }, [sidebarCollapsed]);

  useEffect(() => {
    const authScrollManaged =
      pathname === "/login" ||
      pathname === "/signup" ||
      pathname === "/forgot-password" ||
      pathname === "/reset-password";

    if (!authScrollManaged) {
      document.body.classList.remove("auth-page");
      document.body.style.overflow = "";
    }
  }, [pathname]);

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-dvh w-full max-w-[100vw] overflow-hidden">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
      />

      <main className="relative min-h-0 min-w-0 w-full flex-1 overflow-x-hidden overflow-y-auto scroll-smooth transition-[padding] duration-300 lg:pl-[var(--sidebar-w)]">
        <div className="sticky top-0 z-30 flex h-14 items-center justify-center border-b border-[var(--border-subtle)] bg-[var(--chrome-bg)] px-4 pt-[env(safe-area-inset-top)] backdrop-blur-xl lg:hidden">
          <BrandLogo variant="wordmark" size="xs" priority />
        </div>

        <div className="mx-auto flex min-h-full w-full min-w-0 max-w-6xl flex-col px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-16 lg:pt-10">
          {children}
          <div className="mt-auto pt-12">
            <SupportBanner />
          </div>
        </div>
      </main>

      <BottomNav />
      <SpecialistWelcomePopup />
    </div>
  );
}
