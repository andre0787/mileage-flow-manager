import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  // Padrões intencionais: shadcn/ui exporta constantes de variantes;
  // contexts exportam hook + provider; arquivos de lógica pura + componente
  // (ex.: buildProcessAlerts + ProcessAlerts) são separados para teste unitário.
  {
    files: [
      "src/components/ui/**",
      "src/contexts/**",
      "src/features/auth/**",
      "src/components/kpi/ProcessAlerts.tsx",
      "src/components/kpi/BusinessPanel.tsx",
      "src/components/workflow/WorkflowMindMap.tsx",
    ],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
);
