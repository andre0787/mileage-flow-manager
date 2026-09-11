import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

const CHUNK_RULES: Array<[chunk: string, patterns: string[]]> = [
  [
    "vendor",
    [
      "node_modules/react",
      "node_modules/scheduler",
      "node_modules/react-router",
      "node_modules/@reduxjs",
      "node_modules/redux",
      "node_modules/react-redux",
      "node_modules/use-sync-external-store",
      "node_modules/immer",
      "node_modules/reselect",
    ],
  ],
  ["charts", ["node_modules/recharts", "node_modules/d3-", "node_modules/victory"]],
  ["ui", ["node_modules/@radix-ui", "node_modules/lucide-react"]],
];

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  test: {
    globals: true,
    environment: "jsdom",
    // Regras git-dependentes (scripts-rules.test.ts) spawnam git + node
    // subprocessos e estouram o default de 5s em CI lento.
    testTimeout: 20000,
    hookTimeout: 20000,
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
      include: [
        "src/lib/**",
        "src/components/kpi/**",
        "src/components/workflow/**",
        "src/components/dashboard/**",
        "src/components/accounts/**",
        "src/components/entry/**",
      ],
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
  // playwright-core é lib Node-only usada só pelo PlaywrightBrowserAdapter
  // (import dinâmico com @vite-ignore, P12.5-05) — nunca vai ao bundle do
  // client nem ao pre-bundle do dev server.
  optimizeDeps: {
    exclude: ["playwright-core"],
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
      // playwright-core nunca entra no bundle do client (P12.5-05)
      external: ["playwright-core"],
      output: {
        manualChunks: (id) => {
          for (const [chunk, patterns] of CHUNK_RULES) {
            if (patterns.some((pattern) => id.includes(pattern))) {
              return chunk;
            }
          }
          return undefined;
        },
      },
    },
  },
}));
