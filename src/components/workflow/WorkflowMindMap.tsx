import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { MIND } from "@/lib/workflowDemoData";
import { cn } from "@/lib/utils";

/**
 * WorkflowMindMap — mapa mental SVG interativo do workflow MilesControl.
 *
 * Port de docs/workflow-demo/workflow-illustrated.html (buildMind/startDrag/
 * selectMind/autoLayout) para React:
 * - layout por repulsão calculado em useMemo (determinístico, sem medir DOM)
 * - largura do texto estimada (label.length * fontSize * 0.62) — sem
 *   getComputedTextLength (evita layout thrash e SSR/ref vazio)
 * - posição dos nós em state (render React); drag com limiar de 4px
 * - clique (sem arrasto) abre o painel de detalhes
 * - posições persistidas em localStorage (chave mind-pos-v1)
 */

const MIND_W = 1400;
const MIND_H = 1150;
const MIND_CX = 700;
const MIND_CY = 575;
const R1 = 180;
const R2 = 290;
const R3 = 450;
const MIN_DIST = 115;
const STORAGE_KEY = "mind-pos-v1";
const NS = "http://www.w3.org/2000/svg";

interface Pos {
  x: number;
  y: number;
}

interface NodeView {
  id: string;
  label: string;
  level: 1 | 2;
  parentId: string | null;
  branchId: string;
  color: string;
  cx: number;
  cy: number;
  w: number;
  h: number;
}

interface LineView {
  from: string | "root";
  to: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  qx: number;
  qy: number;
}

function estWidth(label: string, level: 1 | 2): number {
  return label.length * (level === 1 ? 17 : 13.5) * 0.62;
}

function computeLayout(): { nodes: NodeView[]; lines: LineView[] } {
  // ramos no anel R1
  const branches = MIND.map((b, i) => {
    const ang = (-90 + (i * 360) / MIND.length) * (Math.PI / 180);
    return {
      ...b,
      _ang: ang,
      x: MIND_CX + R1 * Math.cos(ang),
      y: MIND_CY + R1 * Math.sin(ang),
    };
  });

  // folhas por ramo
  const leaves = branches.flatMap((b) => {
    const nKids = b.kids.length;
    const arc = Math.min(100, Math.max(44, nKids * 20));
    return b.kids.map((k, j) => {
      const t = nKids === 1 ? 0 : (j - (nKids - 1) / 2) / ((nKids - 1) / 2);
      const kAng = b._ang + (t * (arc / 2) * Math.PI) / 180;
      const rad = R2 + (j % 2) * 70 + (j % 3) * 24;
      return {
        id: `${b.id}-${j}`,
        parentId: b.id,
        label: k,
        x: MIND_CX + rad * Math.cos(kAng),
        y: MIND_CY + rad * Math.sin(kAng),
      };
    });
  });

  // repulsão entre folhas
  for (let iter = 0; iter < 90; iter++) {
    let moved = false;
    for (let a = 0; a < leaves.length; a++) {
      for (let b = a + 1; b < leaves.length; b++) {
        const A = leaves[a];
        const B = leaves[b];
        const dx = B.x - A.x;
        const dy = B.y - A.y;
        const d2 = dx * dx + dy * dy;
        if (d2 > 0.0001 && d2 < MIN_DIST * MIN_DIST) {
          const d = Math.sqrt(d2);
          const push = (MIN_DIST - d) / 2;
          const ux = dx / d;
          const uy = dy / d;
          A.x -= ux * push;
          A.y -= uy * push;
          B.x += ux * push;
          B.y += uy * push;
          moved = true;
        }
      }
    }
    if (!moved) break;
  }

  // puxa cada folha para o setor do seu ramo
  leaves.forEach((l) => {
    const parent = branches.find((b) => b.id === l.parentId);
    if (!parent) return;
    const dx = l.x - MIND_CX;
    const dy = l.y - MIND_CY;
    let rad = Math.sqrt(dx * dx + dy * dy);
    rad = Math.min(R3 + 50, Math.max(R2 - 30, rad));
    let ang = Math.atan2(dy, dx);
    const diff = ang - parent._ang;
    const wrapped = Math.atan2(Math.sin(diff), Math.cos(diff));
    ang = parent._ang + wrapped * 0.86;
    l.x = MIND_CX + rad * Math.cos(ang);
    l.y = MIND_CY + rad * Math.sin(ang);
  });

  // linhas centro→ramo
  const lines: LineView[] = branches.map((b) => ({
    from: "root",
    to: b.id,
    fromX: MIND_CX,
    fromY: MIND_CY,
    toX: b.x,
    toY: b.y,
    qx: (MIND_CX + b.x) / 2,
    qy: (MIND_CY + b.y) / 2,
  }));

  // linhas ramo→folha
  leaves.forEach((l) => {
    const parent = branches.find((b) => b.id === l.parentId);
    if (!parent) return;
    const mx = (parent.x + l.x) / 2;
    const my = (parent.y + l.y) / 2;
    lines.push({
      from: parent.id,
      to: l.id,
      fromX: parent.x,
      fromY: parent.y,
      toX: l.x,
      toY: l.y,
      qx: mx + (MIND_CX - mx) * 0.16,
      qy: my + (MIND_CY - my) * 0.16,
    });
  });

  // nós
  const nodes: NodeView[] = [
    ...branches.map((b) => ({
      id: b.id,
      label: b.label,
      level: 1 as const,
      parentId: null,
      branchId: b.id,
      color: b.color,
      cx: b.x,
      cy: b.y,
      w: estWidth(b.label, 1) + 44,
      h: 40,
    })),
    ...leaves.map((l) => {
      const parent = branches.find((b) => b.id === l.parentId)!;
      return {
        id: l.id,
        label: l.label,
        level: 2 as const,
        parentId: parent.id,
        branchId: parent.id,
        color: parent.color,
        cx: l.x,
        cy: l.y,
        w: estWidth(l.label, 2) + 28,
        h: 30,
      };
    }),
  ];

  return { nodes, lines };
}

function linePath(l: LineView, nodesById: Map<string, NodeView>): string {
  let fromX = l.fromX;
  let fromY = l.fromY;
  let toX = l.toX;
  let toY = l.toY;
  const fromNode = l.from === "root" ? null : nodesById.get(l.from);
  const toNode = nodesById.get(l.to);
  if (fromNode) {
    fromX = fromNode.cx;
    fromY = fromNode.cy;
  }
  if (toNode) {
    toX = toNode.cx;
    toY = toNode.cy;
  }
  if (l.from === "root") {
    return `M ${MIND_CX} ${MIND_CY} Q ${(MIND_CX + toX) / 2} ${(MIND_CY + toY) / 2} ${toX} ${toY}`;
  }
  const mx = (fromX + toX) / 2;
  const my = (fromY + toY) / 2;
  const qx = mx + (MIND_CX - mx) * 0.16;
  const qy = my + (MIND_CY - my) * 0.16;
  return `M ${fromX} ${fromY} Q ${qx} ${qy} ${toX} ${toY}`;
}

function savePositions(nodes: NodeView[]) {
  try {
    const obj: Record<string, Pos> = {};
    nodes.forEach((n) => {
      obj[n.id] = { x: Math.round(n.cx), y: Math.round(n.cy) };
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch {
    /* localStorage indisponível — ignora */
  }
}

function loadPositions(): Record<string, Pos> | null {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? (JSON.parse(s) as Record<string, Pos>) : null;
  } catch {
    return null;
  }
}

export function WorkflowMindMap() {
  const layout = useMemo(computeLayout, []);
  const [nodes, setNodes] = useState<NodeView[]>(() => {
    const saved = loadPositions();
    if (!saved) return layout.nodes;
    return layout.nodes.map((n) => {
      const pos = saved[n.id];
      return pos ? { ...n, cx: pos.x, cy: pos.y } : n;
    });
  });
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;

  const [selected, setSelected] = useState<string | null>(null);
  const [active, setActive] = useState<Set<string>>(new Set());
  const dragRef = useRef<{ id: string; offX: number; offY: number; moved: boolean; lastX: number; lastY: number } | null>(null);
  const suppressClickRef = useRef(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const nodesById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  const applySelection = useCallback((id: string | null) => {
    if (!id) {
      setActive(new Set());
      setSelected(null);
      return;
    }
    const target = nodesRef.current.find((n) => n.id === id);
    if (!target) {
      setActive(new Set());
      setSelected(null);
      return;
    }
    const hl = new Set<string>([id]);
    if (target.level === 1) {
      nodesRef.current
        .filter((n) => n.id.startsWith(`${target.id}-`))
        .forEach((n) => hl.add(n.id));
    } else {
      hl.add(target.branchId);
    }
    setActive(hl);
    setSelected(id);
  }, []);

  const resetSelection = useCallback(() => applySelection(null), [applySelection]);

  const autoLayout = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setNodes(layout.nodes);
    resetSelection();
  }, [layout.nodes, resetSelection]);

  const setNodePos = useCallback((id: string, x: number, y: number) => {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, cx: x, cy: y } : n)));
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent, id: string) => {
      if (e.button !== undefined && e.button !== 0) return;
      const svg = svgRef.current;
      if (!svg) return;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      const p = pt.matrixTransform(ctm.inverse());
      const n = nodesRef.current.find((x) => x.id === id);
      if (!n) return;
      dragRef.current = {
        id,
        offX: p.x - n.cx,
        offY: p.y - n.cy,
        moved: false,
        lastX: p.x,
        lastY: p.y,
      };
    },
    [],
  );

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      const drag = dragRef.current;
      const svg = svgRef.current;
      if (!drag || !svg) return;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      const p = pt.matrixTransform(ctm.inverse());
      if (!drag.moved) {
        const dist = Math.hypot(p.x - drag.lastX, p.y - drag.lastY);
        if (dist < 4) return; // limiar: não vira drag num clique simples
        drag.moved = true;
      }
      setNodePos(drag.id, p.x - drag.offX, p.y - drag.offY);
    },
    [setNodePos],
  );

  const onPointerUp = useCallback(() => {
    const drag = dragRef.current;
    if (drag && drag.moved) {
      suppressClickRef.current = true;
      savePositions(nodesRef.current);
    }
    dragRef.current = null;
  }, []);

  useEffect(() => {
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [onPointerMove, onPointerUp]);

  const onClickNode = useCallback(
    (id: string) => {
      if (suppressClickRef.current) {
        suppressClickRef.current = false;
        return;
      }
      applySelection(id);
    },
    [applySelection],
  );

  const selectedBranch = selected
    ? nodesById.get(selected)?.branchId ?? null
    : null;
  const detailBranch = selectedBranch ? MIND.find((b) => b.id === selectedBranch) : null;
  const selectedNode = selected ? nodesById.get(selected) : null;
  const selectedLeafLabel =
    selectedNode && selectedNode.level === 2 ? selectedNode.label : null;

  return (
    <div className="space-y-3">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        O mapa
      </span>
      <h2 className="text-xl md:text-2xl font-bold text-foreground font-display">
        Mapa mental do workflow
      </h2>
      <p className="text-sm text-muted-foreground max-w-3xl">
        Tudo conectado: <b className="text-foreground">clique em um nó</b> (ou na legenda abaixo)
        para ver como ele se liga ao resto do fluxo. As linhas são as conexões reais entre sessão,
        categorias, gates, subagentes, qualidade, entrega e telemetria.
      </p>

      <div className="relative rounded-xl border bg-card overflow-hidden">
        <span className="absolute top-3 left-3 z-10 rounded-lg border bg-background/95 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground shadow-sm pointer-events-none">
          💡 Arraste os nós com o mouse para reorganizar — a posição fica salva no seu navegador.
        </span>
        <div className="absolute top-3 right-3 z-10 flex gap-2">
          <button
            type="button"
            onClick={resetSelection}
            className="rounded-lg border bg-background px-2.5 py-1 text-[11px] font-semibold text-muted-foreground shadow-sm hover:bg-muted"
          >
            🔄 Limpar seleção
          </button>
          <button
            type="button"
            onClick={autoLayout}
            className="rounded-lg border bg-background px-2.5 py-1 text-[11px] font-semibold text-muted-foreground shadow-sm hover:bg-muted"
          >
            🧲 Reposicionar
          </button>
        </div>

        <svg
          ref={svgRef}
          viewBox={`0 0 ${MIND_W} ${MIND_H}`}
          role="img"
          aria-label="Mapa mental do workflow MilesControl"
          className={cn("w-full h-auto bg-card", dragRef.current?.moved && "cursor-grabbing")}
        >
          <rect x={0} y={0} width={MIND_W} height={MIND_H} fill="transparent" />
          {layout.lines.map((l) => (
            <path
              key={`${l.from}->${l.to}`}
              d={linePath(l, nodesById)}
              fill="none"
              stroke={active.size ? (active.has(l.to) || active.has(l.from) ? "#6366f1" : "#cbd5e1") : "#cbd5e1"}
              strokeWidth={active.has(l.to) || active.has(l.from) ? 2.5 : 1.5}
              strokeLinecap="round"
              className="transition-all"
            />
          ))}
          {nodes.map((n) => {
            const isActive = active.has(n.id);
            const isDim = active.size > 0 && !isActive;
            return (
              <g
                key={n.id}
                className={cn("cursor-grab transition-opacity", isDim && "opacity-30")}
                onClick={() => onClickNode(n.id)}
                onPointerDown={(e) => onPointerDown(e, n.id)}
              >
                <rect
                  x={n.cx - n.w / 2}
                  y={n.cy - n.h / 2}
                  width={n.w}
                  height={n.h}
                  rx={n.h / 2}
                  fill={n.level === 1 ? n.color : "#ffffff"}
                  stroke={n.color}
                  strokeWidth={n.level === 1 ? 0 : 2.5}
                  className={cn(
                    "transition-shadow",
                    isActive && "drop-shadow-md",
                  )}
                />
                <text
                  x={n.cx}
                  y={n.cy}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={n.level === 1 ? 17 : 13.5}
                  fontWeight={n.level === 1 ? 800 : 700}
                  fill={n.level === 1 ? "#fff" : "#0f172a"}
                >
                  {n.label}
                </text>
                <title>{n.label}</title>
              </g>
            );
          })}
        </svg>

        <div className="border-t bg-muted/40 p-4 min-h-[96px]">
          {detailBranch ? (
            <>
              <h4 className="text-sm font-bold text-foreground">
                {detailBranch.label}
                {selectedLeafLabel ? ` · ${selectedLeafLabel}` : ""}
              </h4>
              <div className="mt-1 text-[13px] text-muted-foreground">{detailBranch.detail}</div>
              <pre className="mt-2 whitespace-pre-wrap rounded bg-background border p-2 text-xs font-mono text-foreground leading-relaxed">
                {detailBranch.ev}
              </pre>
            </>
          ) : (
            <>
              <h4 className="text-sm font-bold text-foreground">👆 Clique em um nó</h4>
              <div className="mt-1 text-[13px] text-muted-foreground">
                Explore como cada parte do workflow se conecta às demais. O painel mostra o detalhe
                e a evidência de telemetria.
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {MIND.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => applySelection(b.id)}
            className="rounded-full border px-3 py-1 text-xs font-semibold text-white shadow-sm hover:opacity-90"
            style={{ background: b.color }}
          >
            {b.label.replace(/^\S+\s/, "")}
          </button>
        ))}
      </div>
    </div>
  );
}

// exporta o helper para testes unitários (rule-32)
export const __mindTest = {
  NS,
  MIND_W,
  MIND_H,
  MIND_CX,
  MIND_CY,
  estWidth,
  computeLayout,
  linePath,
};
