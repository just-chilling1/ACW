import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "CashTap AI",
        short_name: "CashTap AI",
        description: "The AI system for finding high-intent ads and writing replies that convert.",
        start_url: "/dashboard",
        display: "standalone",
        background_color: "#0A0A0B",
        theme_color: "#0A0A0B",
        icons: [
            {
                src: "/icons/icon-192.png",
                sizes: "192x192",
                type: "image/png",
            },
            {
                src: "/icons/icon-512.png",
                sizes: "512x512",
                type: "image/png",
            },
        ],
    };
}
