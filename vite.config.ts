import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: "autoUpdate",
      injectRegister: false,

      includeAssets: [
        "apple-touch-icon.png",
        "pwa-192x192.png",
        "pwa-512x512.png",
      ],

      manifest: {
        id: "/",
        name: "REY KASA",
        short_name: "REY KASA",
        description: "Kasa Yönetim Sistemi",

        lang: "tr",
        dir: "ltr",

        start_url: "/?source=pwa",
        scope: "/",

        display: "standalone",
        display_override: [
          "standalone",
          "minimal-ui",
        ],

        orientation: "portrait",

        theme_color: "#eef2f6",
        background_color: "#eef2f6",

        categories: [
          "business",
          "finance",
          "productivity",
        ],

        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },

      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,

        navigateFallback: "/index.html",

        globPatterns: [
          "**/*.{js,css,html,ico,png,svg,woff,woff2}",
        ],
      },
    }),
  ],
});