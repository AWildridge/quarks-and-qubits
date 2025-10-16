/**
 * 3D spin vector visualization component
 */

import { useEffect, useRef } from 'react';
import type { SpinAxes } from '../../lib/spin-types';

interface SpinVectorPlotProps {
  axes: SpinAxes;
  width?: number;
  height?: number;
}

export function SpinVectorPlot({ axes, width = 400, height = 400 }: SpinVectorPlotProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High DPI support
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Center point
    const cx = width / 2;
    const cy = height / 2;
    const scale = Math.min(width, height) * 0.3;

    // Draw coordinate system
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    // X axis (horizontal)
    ctx.beginPath();
    ctx.moveTo(cx - scale, cy);
    ctx.lineTo(cx + scale, cy);
    ctx.stroke();

    // Y axis (vertical, inverted in canvas coords)
    ctx.beginPath();
    ctx.moveTo(cx, cy - scale);
    ctx.lineTo(cx, cy + scale);
    ctx.stroke();

    // Z axis (diagonal for perspective)
    ctx.beginPath();
    ctx.moveTo(cx - scale * 0.5, cy + scale * 0.5);
    ctx.lineTo(cx + scale * 0.5, cy - scale * 0.5);
    ctx.stroke();

    ctx.setLineDash([]);

    // Draw axis labels
    ctx.fillStyle = '#666';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('x', cx + scale + 20, cy);
    ctx.fillText('y', cx, cy - scale - 10);
    ctx.fillText('z', cx + scale * 0.5 + 20, cy - scale * 0.5 - 10);

    // Project 3D vectors onto 2D (simple orthographic projection)
    const project = (vec: [number, number, number]): [number, number] => {
      // Simple projection: combine x, y, and z with perspective
      const px = cx + vec[0] * scale;
      const py = cy - vec[1] * scale + vec[2] * scale * 0.3;
      return [px, py];
    };

    // Draw spin vector arrows
    const drawArrow = (vec: [number, number, number], color: string, label: string) => {
      const [x, y] = project(vec);

      // Arrow shaft
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(x, y);
      ctx.stroke();

      // Arrow head
      const angle = Math.atan2(y - cy, x - cx);
      const headLength = 15;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(
        x - headLength * Math.cos(angle - Math.PI / 6),
        y - headLength * Math.sin(angle - Math.PI / 6),
      );
      ctx.lineTo(
        x - headLength * Math.cos(angle + Math.PI / 6),
        y - headLength * Math.sin(angle + Math.PI / 6),
      );
      ctx.closePath();
      ctx.fill();

      // Label
      ctx.fillStyle = color;
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      const labelOffset = 25;
      const labelAngle = angle;
      ctx.fillText(
        label,
        x + labelOffset * Math.cos(labelAngle),
        y + labelOffset * Math.sin(labelAngle),
      );
    };

    // Draw top quark spin (blue)
    drawArrow(axes.top, '#3b82f6', 't');

    // Draw anti-top quark spin (red)
    drawArrow(axes.antiTop, '#ef4444', 't̄');

    // Title
    ctx.fillStyle = '#000';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Spin Axes', width / 2, 25);

    // Legend
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    const legendY = height - 40;

    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(20, legendY, 15, 15);
    ctx.fillStyle = '#000';
    ctx.fillText('Top quark', 40, legendY + 12);

    ctx.fillStyle = '#ef4444';
    ctx.fillRect(150, legendY, 15, 15);
    ctx.fillStyle = '#000';
    ctx.fillText('Anti-top quark', 170, legendY + 12);
  }, [axes, width, height]);

  const formatVector = (vec: [number, number, number]) =>
    `(${vec[0].toFixed(3)}, ${vec[1].toFixed(3)}, ${vec[2].toFixed(3)})`;

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`Spin vector plot. Top quark spin: ${formatVector(axes.top)}. Anti-top quark spin: ${formatVector(axes.antiTop)}`}
        className="border border-gray-300 rounded"
      />
      <div className="mt-2 text-sm text-gray-700 space-y-1">
        <div>
          <span className="font-semibold text-blue-600">Top:</span> {formatVector(axes.top)}
        </div>
        <div>
          <span className="font-semibold text-red-600">Anti-top:</span> {formatVector(axes.antiTop)}
        </div>
      </div>
    </div>
  );
}
