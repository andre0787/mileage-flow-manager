import { describe, expect, it } from "vitest";
import { checkDependencyPolicy } from "../../scripts/lib/project-audit.mjs";

function baseFixture() {
  return {
    name: "mileage-flow-manager",
    dependencies: {
      react: "^19.2.8",
      "react-dom": "^19.2.8",
      "react-router": "^8.3.0",
    },
    devDependencies: {
      "@types/react": "^19.0.0",
      "@types/react-dom": "^19.0.0",
    },
  };
}

describe("checkDependencyPolicy (P1 react-router 8 + React 19)", () => {
  it("aprova combinação segura (react-router >=8.3.0, react >=19, sem react-router-dom)", () => {
    const findings = checkDependencyPolicy(baseFixture());

    expect(findings).toEqual([]);
  });

  it("rejeita react-router < 8.3.0 (GHSA-qwww-vcr4-c8h2)", () => {
    const pkg = baseFixture();
    pkg.dependencies["react-router"] = "^7.18.2";

    const findings = checkDependencyPolicy(pkg);

    expect(findings).toEqual([
      expect.objectContaining({
        packageName: "react-router",
        version: "^7.18.2",
        severity: "critical",
        reason: expect.stringContaining(">=8.3.0"),
      }),
    ]);
  });

  it("rejeita react < 19 (peer obrigatório do router 8)", () => {
    const pkg = baseFixture();
    pkg.dependencies["react"] = "^18.3.1";
    pkg.dependencies["react-dom"] = "^18.3.1";

    const findings = checkDependencyPolicy(pkg);

    expect(findings).toEqual([
      expect.objectContaining({
        packageName: "react",
        version: "^18.3.1",
        severity: "critical",
        reason: expect.stringContaining(">=19"),
      }),
      expect.objectContaining({
        packageName: "react-dom",
        version: "^18.3.1",
        severity: "critical",
      }),
    ]);
  });

  it("rejeita dependência direta de react-router-dom (unificado no core v8)", () => {
    const pkg = baseFixture();
    pkg.dependencies["react-router-dom"] = "^7.18.2";

    const findings = checkDependencyPolicy(pkg);

    expect(findings).toEqual([
      expect.objectContaining({
        packageName: "react-router-dom",
        severity: "warning",
        reason: expect.stringContaining("react-router"),
      }),
    ]);
  });

  it("não quebra com entry sem versão ou pacote irrelevante", () => {
    const pkg = baseFixture();
    pkg.dependencies["@supabase/supabase-js"] = "^2.110.1";

    const findings = checkDependencyPolicy(pkg);

    expect(findings).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ packageName: "@supabase/supabase-js" }),
      ]),
    );
  });
});