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
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx", "src/**/tests/**/*.test.ts", "src/**/tests/**/*.test.tsx"],
    setupFiles: ["tests/setup.ts"],
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
    mode === 'development' &&
    componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icon.svg', 'robots.txt'],
      manifest: {
        name: 'MilesControl',
        short_name: 'MilesControl',
        description: 'Gestão de milhas aéreas e pontos',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0B1020',
        theme_color: '#5B72C4',
        categories: ['finance', 'travel', 'productivity'],
        icons: [
          { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any monochrome' },
          { src: '/icon-180.png', sizes: '180x180', type: 'image/png', purpose: 'any' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
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
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-select', '@radix-ui/react-tabs'],
          charts: ['recharts'],
        },
      },
    },
  },
}));