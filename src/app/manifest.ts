import type { MetadataRoute } from "next";
import { APP_NAME } from "@/lib/brand";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: APP_NAME,
        short_name: APP_NAME,
        description: "The AI system for finding high-intent ads and writing replies that convert.",
        start_url: "/dashboard",
        display: "standalone",
        background_color: "#0B0B0B",
        theme_color: "#0B0B0B",
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
