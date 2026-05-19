import { useEffect, useRef, useState } from 'react';
import {
  mttFromBeta,
  type IntegratedSpinResult,
  type PhaseObservable,
  type PhasePoint,
} from '../../lib/spin-calculation';

interface PhaseSpacePlotProps {
  result: IntegratedSpinResult;
  observable: PhaseObservable;
}

const OBSERVABLE_LABELS: Record<PhaseObservable, string> = {
  Delta: 'Δ',
  Ckk: 'C_kk',
  Crr: 'C_rr',
  Cnn: 'C_nn',
  Crk: 'C_rk',
  B1k: 'B_1k',
  B1r: 'B_1r',
};

function valueFor(point: PhasePoint, observable: PhaseObservable): number {
  return point[observable];
}

function divergingColor(value: number, min: number, max: number): string {
  const span = Math.max(Math.abs(min), Math.abs(max), 1e-8);
  const t = Math.max(-1, Math.min(1, value / span));
  if (t >= 0) {
    const mix = 1 - t;
    const r = Math.round(178 + 77 * t);
    const g = Math.round(222 * mix + 84 * t);
    const b = Math.round(228 * mix + 81 * t);
    return `rgb(${r}, ${g}, ${b})`;
  }
  const a = -t;
  const r = Math.round(219 * (1 - a) + 61 * a);
  const g = Math.round(234 * (1 - a) + 116 * a);
  const b = Math.round(254 * (1 - a) + 170 * a);
  return `rgb(${r}, ${g}, ${b})`;
}

function cellBounds(nodes: number[], min: number, max: number): Array<[number, number]> {
  return nodes.map((node, index) => {
    const low = index === 0 ? min : (nodes[index - 1] + node) / 2;
    const high = index === nodes.length - 1 ? max : (node + nodes[index + 1]) / 2;
    return [low, high];
  });
}

export function PhaseSpacePlot({ result, observable }: PhaseSpacePlotProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hovered, setHovered] = useState<PhasePoint | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const width = 720;
    const height = 420;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const isDark = document.documentElement.classList.contains('dark');
    const bg = isDark ? '#111827' : '#ffffff';
    const fg = isDark ? '#e5e7eb' : '#111827';
    const muted = isDark ? '#9ca3af' : '#4b5563';
    const grid = isDark ? '#374151' : '#e5e7eb';
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    const margin = { left: 64, right: 24, top: 32, bottom: 56 };
    const plotW = width - margin.left - margin.right;
    const plotH = height - margin.top - margin.bottom;
    const values = result.phasePoints.map((point) => valueFor(point, observable));
    const min = Math.min(...values);
    const max = Math.max(...values);
    const betaMin = result.settings.betaMin;
    const betaMax = result.settings.betaMax;
    const mttMin = mttFromBeta(betaMin);
    const mttMax = mttFromBeta(betaMax);
    const zMin = result.settings.zMin;
    const zMax = result.settings.zMax;
    const betaBounds = cellBounds(result.betaNodes, betaMin, betaMax);
    const zBounds = cellBounds(result.zNodes, zMin, zMax);

    for (let ib = 0; ib < result.betaNodes.length; ib += 1) {
      for (let iz = 0; iz < result.zNodes.length; iz += 1) {
        const point = result.phasePoints[ib * result.zNodes.length + iz];
        if (!point) continue;
        const [betaLow, betaHigh] = betaBounds[ib];
        const [zLow, zHigh] = zBounds[iz];
        const x0 = margin.left + ((mttFromBeta(betaLow) - mttMin) / (mttMax - mttMin)) * plotW;
        const x1 = margin.left + ((mttFromBeta(betaHigh) - mttMin) / (mttMax - mttMin)) * plotW;
        const y0 = margin.top + ((zMax - zHigh) / (zMax - zMin)) * plotH;
        const y1 = margin.top + ((zMax - zLow) / (zMax - zMin)) * plotH;
        ctx.fillStyle = divergingColor(valueFor(point, observable), min, max);
        ctx.fillRect(
          Math.floor(x0),
          Math.floor(y0),
          Math.ceil(x1 - x0) + 1,
          Math.ceil(y1 - y0) + 1,
        );
      }
    }

    ctx.strokeStyle = grid;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const x = margin.left + (i / 4) * plotW;
      const y = margin.top + (i / 4) * plotH;
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, margin.top + plotH);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left + plotW, y);
      ctx.stroke();
    }

    ctx.strokeStyle = fg;
    ctx.strokeRect(margin.left, margin.top, plotW, plotH);
    ctx.fillStyle = fg;
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      `${OBSERVABLE_LABELS[observable]} over m(ttbar)-cos(θ*) phase space`,
      width / 2,
      22,
    );
    ctx.fillText('m(ttbar) [TeV]', margin.left + plotW / 2, height - 16);
    ctx.save();
    ctx.translate(18, margin.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('cos(θ*)', 0, 0);
    ctx.restore();

    ctx.fillStyle = muted;
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i <= 4; i++) {
      const mtt = mttMin + (i / 4) * (mttMax - mttMin);
      const z = zMax - (i / 4) * (zMax - zMin);
      ctx.fillText((mtt / 1000).toFixed(2), margin.left + (i / 4) * plotW, height - 36);
      ctx.textAlign = 'right';
      ctx.fillText(z.toFixed(2), margin.left - 10, margin.top + (i / 4) * plotH + 4);
      ctx.textAlign = 'center';
    }
  }, [result, observable]);

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 720;
    const y = ((event.clientY - rect.top) / rect.height) * 420;
    const margin = { left: 64, right: 24, top: 32, bottom: 56 };
    const plotW = 720 - margin.left - margin.right;
    const plotH = 420 - margin.top - margin.bottom;
    const mttMin = mttFromBeta(result.settings.betaMin);
    const mttMax = mttFromBeta(result.settings.betaMax);
    const mtt = mttMin + ((x - margin.left) / plotW) * (mttMax - mttMin);
    const z =
      result.settings.zMax -
      ((y - margin.top) / plotH) * (result.settings.zMax - result.settings.zMin);
    let best: PhasePoint | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const point of result.phasePoints) {
      const distance =
        Math.abs(mttFromBeta(point.beta) - mtt) / Math.max(mttMax - mttMin, 1) +
        Math.abs(point.z - z);
      if (distance < bestDistance) {
        best = point;
        bestDistance = distance;
      }
    }
    setHovered(best);
  };

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        className="w-full rounded border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-gray-700 dark:bg-gray-900"
        role="img"
        tabIndex={0}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHovered(null)}
        aria-label={`${OBSERVABLE_LABELS[observable]} phase-space heatmap`}
      />
      <div className="min-h-6 text-sm text-gray-700 dark:text-gray-300">
        {hovered
          ? `m(ttbar) ${(mttFromBeta(hovered.beta) / 1000).toFixed(3)} TeV, cos(θ*) ${hovered.z.toFixed(3)}, ${
              OBSERVABLE_LABELS[observable]
            } ${valueFor(hovered, observable).toFixed(4)}`
          : `Integrated ${OBSERVABLE_LABELS[observable]} phase-space view`}
      </div>
    </div>
  );
}
