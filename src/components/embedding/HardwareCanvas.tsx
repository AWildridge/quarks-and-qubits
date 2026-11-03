import { useEffect, useMemo, useRef, useState } from 'react';
import { edgeKey, type Edge, type Hardware, type Qubit } from '../../lib/embedding/topology';
import type { Defects } from '../../lib/embedding/solver';

export type EditMode = 'inspect' | 'qubits' | 'couplings';
const COLORS = [
  '#167d91',
  '#bd4c35',
  '#7952a1',
  '#497a29',
  '#b37c13',
  '#2864b4',
  '#b0447c',
  '#3c7d6c',
];
export const chainColor = (id: number, n: number) => COLORS[Math.floor(id / n) % COLORS.length];
type Hit = { node: Qubit } | { edge: Edge } | null;

export default function HardwareCanvas({
  hardware,
  chains,
  defects,
  selected,
  n,
  mode,
  showAll,
  onQubit,
  onCoupling,
  onSelect,
}: {
  hardware: Hardware;
  chains: number[][];
  defects: Defects;
  selected: number;
  n: number;
  mode: EditMode;
  showAll: boolean;
  onQubit: (q: number) => void;
  onCoupling: (edge: Edge) => void;
  onSelect: (logical: number) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1),
    [pan, setPan] = useState({ x: 0, y: 0 });
  const [hover, setHover] = useState<Hit>(null),
    [dark, setDark] = useState(false);
  const drag = useRef<{ x: number; y: number; px: number; py: number; moved: boolean } | null>(
    null,
  );
  const owners = useMemo(
    () => new Map(chains.flatMap((chain, i) => chain.map((q) => [q, i] as const))),
    [chains],
  );
  const disabled = useMemo(() => new Set(defects.qubits), [defects]);
  const brokenEdges = useMemo(
    () => new Set(defects.couplings.map(([a, b]) => edgeKey(a, b))),
    [defects],
  );
  const geometry = useMemo(() => {
    const visible = new Set([...owners.keys(), ...defects.qubits, ...defects.couplings.flat()]);
    const nodes =
      showAll || !visible.size ? hardware.nodes : hardware.nodes.filter((q) => visible.has(q.id));
    const ids = new Set(nodes.map((q) => q.id));
    const edges = hardware.edges.filter(([a, b]) => ids.has(a) && ids.has(b));
    const xs = nodes.map((q) => q.x),
      ys = nodes.map((q) => q.y);
    const x0 = Math.min(...xs),
      y0 = Math.min(...ys),
      x1 = Math.max(...xs),
      y1 = Math.max(...ys);
    const scale = Math.min(864 / Math.max(12, x1 - x0), 564 / Math.max(12, y1 - y0)) * zoom;
    const pos = new Map(
      nodes.map((q) => [
        q.id,
        {
          x: 480 + (q.x - (x0 + x1) / 2) * scale + pan.x,
          y: 330 + (q.y - (y0 + y1) / 2) * scale + pan.y,
        },
      ]),
    );
    return { nodes, edges, pos };
  }, [hardware, owners, defects, showAll, zoom, pan]);

  useEffect(() => {
    const update = () => setDark(document.documentElement.classList.contains('dark'));
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, 960, 660);
    ctx.fillStyle = dark ? '#111f28' : '#fdfcf8';
    ctx.fillRect(0, 0, 960, 660);
    const drawEdge = (edge: Edge, foreground: boolean) => {
      const [a, b] = edge,
        pa = geometry.pos.get(a)!,
        pb = geometry.pos.get(b)!;
      const owner = owners.get(a),
        same = owner !== undefined && owner === owners.get(b);
      const broken = brokenEdges.has(edgeKey(a, b)) || disabled.has(a) || disabled.has(b);
      if (foreground !== (same || broken)) return;
      const emphasis = same && (selected < 0 || owner === selected);
      ctx.strokeStyle = broken
        ? '#dc4d50'
        : same
          ? chainColor(owner!, n)
          : dark
            ? '#526572'
            : '#c4c7bf';
      ctx.globalAlpha = broken ? 0.9 : emphasis ? 1 : same ? 0.28 : selected >= 0 ? 0.12 : 0.45;
      ctx.lineWidth = broken ? 2 : emphasis ? 3 : 1;
      ctx.setLineDash(broken ? [5, 4] : []);
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.stroke();
    };
    for (const edge of geometry.edges) drawEdge(edge, false);
    for (const edge of geometry.edges) drawEdge(edge, true);
    ctx.setLineDash([]);
    for (const q of geometry.nodes) {
      const p = geometry.pos.get(q.id)!,
        owner = owners.get(q.id),
        broken = disabled.has(q.id);
      const active = selected < 0 || owner === selected;
      ctx.globalAlpha = broken || active ? 1 : 0.3;
      ctx.fillStyle = broken
        ? '#dc4d50'
        : owner === undefined
          ? dark
            ? '#82919a'
            : '#a1a59c'
          : chainColor(owner, n);
      const radius = owner === undefined ? 2.2 : owner === selected ? 5 : 3.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, 2 * Math.PI);
      ctx.fill();
      if (broken) {
        ctx.strokeStyle = dark ? '#fff' : '#641018';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.x - 4, p.y - 4);
        ctx.lineTo(p.x + 4, p.y + 4);
        ctx.moveTo(p.x + 4, p.y - 4);
        ctx.lineTo(p.x - 4, p.y + 4);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    if (hover && 'node' in hover) {
      const p = geometry.pos.get(hover.node.id);
      if (p) {
        ctx.strokeStyle = dark ? '#fff' : '#152e35';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 8, 0, 2 * Math.PI);
        ctx.stroke();
      }
    } else if (hover && 'edge' in hover) {
      const a = geometry.pos.get(hover.edge[0]),
        b = geometry.pos.get(hover.edge[1]);
      if (a && b) {
        ctx.strokeStyle = dark ? '#fff' : '#152e35';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }, [geometry, owners, disabled, brokenEdges, selected, n, dark, hover]);

  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - box.left) * 960) / box.width,
      y: ((event.clientY - box.top) * 660) / box.height,
    };
  };
  const hitAt = (p: { x: number; y: number }): Hit => {
    let best = 12,
      hit: Hit = null;
    if (mode !== 'couplings')
      for (const node of geometry.nodes) {
        const q = geometry.pos.get(node.id)!,
          distance = Math.hypot(p.x - q.x, p.y - q.y);
        if (distance < best) {
          best = distance;
          hit = { node };
        }
      }
    else
      for (const edge of geometry.edges) {
        const a = geometry.pos.get(edge[0])!,
          b = geometry.pos.get(edge[1])!;
        const dx = b.x - a.x,
          dy = b.y - a.y;
        const t = Math.max(
          0.06,
          Math.min(0.94, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1)),
        );
        const distance = Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
        if (distance < best) {
          best = distance;
          hit = { edge };
        }
      }
    return hit;
  };
  return (
    <div className="hardware-view">
      <div className="canvas-toolbar">
        <span>Hardware graph</span>
        <div className="zoom-buttons">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(8, z * 1.4))}
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.5, z / 1.4))}
            aria-label="Zoom out"
          >
            −
          </button>
          <button
            type="button"
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
          >
            Fit
          </button>
        </div>
      </div>
      <canvas
        ref={canvas}
        width="960"
        height="660"
        role="img"
        aria-label={`${hardware.family} hardware graph. Colored qubits and solid lines show logical chains. Dashed red lines and crosses show disabled hardware. Use the labeled controls below to edit qubits and couplings by ID.`}
        onPointerDown={(event) => {
          const p = point(event);
          drag.current = { ...p, px: pan.x, py: pan.y, moved: false };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const p = point(event),
            origin = drag.current;
          if (origin && (origin.moved || Math.hypot(p.x - origin.x, p.y - origin.y) > 5)) {
            origin.moved = true;
            setPan({ x: origin.px + p.x - origin.x, y: origin.py + p.y - origin.y });
          } else setHover(hitAt(p));
        }}
        onPointerUp={(event) => {
          if (drag.current && !drag.current.moved) {
            const hit = hitAt(point(event));
            if (hit && 'node' in hit) {
              if (mode === 'qubits') onQubit(hit.node.id);
              else onSelect(owners.get(hit.node.id) ?? -1);
            } else if (hit && 'edge' in hit && mode === 'couplings') onCoupling(hit.edge);
          }
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
        onPointerLeave={() => setHover(null)}
      />
      <p className="canvas-readout">
        {hover && 'node' in hover
          ? `Qubit ${hover.node.id} · coordinates (${hover.node.coordinate.join(', ')})${disabled.has(hover.node.id) ? ' · disabled' : ''}`
          : hover && 'edge' in hover
            ? `Coupling ${hover.edge[0]} ↔ ${hover.edge[1]}${brokenEdges.has(edgeKey(...hover.edge)) ? ' · disabled' : ''}`
            : mode === 'inspect'
              ? 'Select a qubit to inspect its logical chain. Drag to pan.'
              : `Click a ${mode === 'qubits' ? 'qubit' : 'coupling'} to remove or restore it. Drag to pan.`}
      </p>
    </div>
  );
}
