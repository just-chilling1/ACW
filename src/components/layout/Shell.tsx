"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Target } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./bottom-nav";
import { SupportBanner } from "../dashboard/SupportBanner";
import { SpecialistWelcomePopup } from "../ui/specialist-welcome-popup";

export function Shell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAuthPage = pathname === "/login" || pathname === "/signup" || pathname === "/forgot-password" || pathname === "/reset-password" || pathname === "/onboarding" || pathname.startsWith("/onboarding/") || pathname.startsWith("/auth/") || pathname.startsWith("/dev/");
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
        document.body.style.overflow = "";
    }, [pathname]);

    if (isAuthPage) {
        return <>{children}</>;
    }

    return (
        <div className="flex h-dvh overflow-hidden bg-page w-full max-w-[100vw]">
            <Sidebar
                collapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
            />

            <main className="flex-1 min-w-0 min-h-0 w-full overflow-x-hidden overflow-y-auto scroll-smooth relative lg:pl-[var(--sidebar-w)] transition-[padding] duration-300">
                <div className="lg:hidden sticky top-0 z-30 flex items-center justify-center px-4 h-14 pt-[env(safe-area-inset-top)] bg-page/95 backdrop-blur border-b border-border-dim">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 bg-gradient-to-br from-accent to-accent-muted flex items-center justify-center rounded-md shrink-0">
                            <Target size={16} className="text-white" />
                        </div>
                        <span className="brand-font text-[17px] text-text-primary tracking-tight leading-none whitespace-nowrap">
                            CashTap&nbsp;AI
                        </span>
                    </div>
                </div>

                <div className="px-4 sm:px-6 lg:px-8 pt-6 lg:pt-10 pb-24 lg:pb-16 max-w-7xl mx-auto min-h-full flex flex-col w-full min-w-0">
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
