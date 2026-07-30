import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SearchProvider } from "@/context/SearchContext";
import { Shell } from "@/components/layout/Shell";

export const metadata: Metadata = {
  title: "CashTap AI | High-Converting Ad Reply System",
  description: "Find high-intent conversations and generate replies that convert — the AI system built to maximize every click.",
  icons: {
    icon: [
      { url: "/favicon.png?v=2", sizes: "48x48", type: "image/png" },
      { url: "/favicon-32.png?v=2", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png?v=2", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CashTap AI",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0A0A0B",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-sidebar="expanded">
      <body className="app-bg text-white selection:bg-accent/30">
        <SearchProvider>
          <Shell>
            {children}
          </Shell>
        </SearchProvider>
      </body>
    </html>
  );
}
