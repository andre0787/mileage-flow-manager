import { describe, it, expect } from "vitest";
import { PIPELINE, roleToNode } from "@/components/workflow/pipeline-definition";

describe("pipeline-definition (DAG do pipeline real)", () => {
  it("os 8 nodes existem, em ordem", () => {
    expect(PIPELINE.map((n) => n.id)).toEqual([
      "task",
      "classifier",
      "graph",
      "planner",
      "agents",
      "tools",
      "validator",
      "result",
    ]);
  });

  it("todos os nodes têm pelo menos um role mapeado (sem nodes permanentemente vazios)", () => {
    for (const node of PIPELINE) {
      expect(node.roles.length, `node ${node.id} sem roles`).toBeGreaterThan(0);
    }
  });

  it("mapeia os roles emitidos por emit-envelope.mjs para os nodes corretos", () => {
    expect(roleToNode("task")?.id).toBe("task");
    expect(roleToNode("classifier")?.id).toBe("classifier");
    expect(roleToNode("tools")?.id).toBe("tools");
    expect(roleToNode("result")?.id).toBe("result");
  });

  it("mantém o mapeamento dos roles de agente (§19)", () => {
    expect(roleToNode("graph-scout")?.id).toBe("graph");
    expect(roleToNode("architect")?.id).toBe("planner");
    expect(roleToNode("implementer")?.id).toBe("agents");
    expect(roleToNode("reviewer")?.id).toBe("agents");
    expect(roleToNode("final-validator")?.id).toBe("validator");
  });

  it("role desconhecido cai fora do mapa (caller decide o fallback)", () => {
    expect(roleToNode("role-inexistente")).toBeUndefined();
  });
});
