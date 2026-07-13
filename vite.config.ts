import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  test: {
    globals: true,
    environment: "node",
    passWithNoTests: true,
    include: ["tests/**/*.test.ts"],
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
        theme_color: '#5B72C4',
        icons: [
          { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any monochrome' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/.*/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'supabase-api',
              expiration: { maxEntries: 50, maxAgeSeconds: 300 },
            },
          },
        ],
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
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-select', '@radix-ui/react-tabs'],
          charts: ['recharts'],
        },
      },
    },
  },
}));