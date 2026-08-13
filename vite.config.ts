import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  test: {
    globals: true,
    environment: "jsdom",
    passWithNoTests: true,
    include: [
      "tests/**/*.test.ts",
      "tests/**/*.test.tsx",
      "src/**/tests/**/*.test.ts",
      "src/**/tests/**/*.test.tsx",
    ],
    setupFiles: ["tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: ["src/lib/**", "src/components/kpi/**", "src/components/workflow/**"],
      exclude: ["src/**/index.ts", "src/lib/supabase.ts", "src/lib/db.ts"],
    },
  },
  server: {
    host: "::",
    port: 8080,
    middlewareMode: false,
    fs: {
      strict: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "icon.svg", "robots.txt"],
      manifest: {
        name: "MilesControl",
        short_name: "MilesControl",
        description: "Gestão de milhas aéreas e pontos",
        start_url: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#0B1020",
        theme_color: "#5B72C4",
        categories: ["finance", "travel", "productivity"],
        icons: [
          { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any monochrome" },
          { src: "/icon-180.png", sizes: "180x180", type: "image/png", purpose: "any" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules/react") || id.includes("node_modules/scheduler"))
            return "vendor";
          if (id.includes("node_modules/react-router")) return "vendor";
          if (id.includes("node_modules/@reduxjs") || id.includes("node_modules/redux"))
            return "vendor";
          if (
            id.includes("node_modules/react-redux") ||
            id.includes("node_modules/use-sync-external-store")
          )
            return "vendor";
          if (id.includes("node_modules/immer") || id.includes("node_modules/reselect"))
            return "vendor";
          if (id.includes("node_modules/@radix-ui")) return "ui";
          if (
            id.includes("node_modules/recharts") ||
            id.includes("node_modules/d3-") ||
            id.includes("node_modules/victory")
          )
            return "charts";
          if (id.includes("node_modules/lucide-react")) return "ui";
          return undefined;
        },
      },
    },
  },
}));
