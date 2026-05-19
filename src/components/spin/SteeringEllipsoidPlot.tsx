import { useEffect, useRef, useState } from 'react';
import type { SteeringEllipsoid, Vec3 } from '../../lib/spin-calculation';

interface SteeringEllipsoidPlotProps {
  ellipsoid: SteeringEllipsoid;
}

function rotate(point: Vec3, yaw: number, pitch: number): Vec3 {
  const [xN, yR, zK] = point;
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  const x = cy * xN - sy * yR;
  const y = sy * xN + cy * yR;
  return [x, cp * zK - sp * y, sp * zK + cp * y];
}

function ellipsoidPoint(ellipsoid: SteeringEllipsoid, theta: number, phi: number): Vec3 {
  const local: Vec3 = [
    ellipsoid.radii[0] * Math.sin(theta) * Math.cos(phi),
    ellipsoid.radii[1] * Math.sin(theta) * Math.sin(phi),
    ellipsoid.radii[2] * Math.cos(theta),
  ];
  return [
    ellipsoid.center[0] +
      ellipsoid.axes[0][0] * local[0] +
      ellipsoid.axes[0][1] * local[1] +
      ellipsoid.axes[0][2] * local[2],
    ellipsoid.center[1] +
      ellipsoid.axes[1][0] * local[0] +
      ellipsoid.axes[1][1] * local[1] +
      ellipsoid.axes[1][2] * local[2],
    ellipsoid.center[2] +
      ellipsoid.axes[2][0] * local[0] +
      ellipsoid.axes[2][1] * local[1] +
      ellipsoid.axes[2][2] * local[2],
  ];
}

function spherePoint(theta: number, phi: number): Vec3 {
  return [Math.sin(theta) * Math.cos(phi), Math.sin(theta) * Math.sin(phi), Math.cos(theta)];
}

function meridianPoint(angle: number, azimuth: number): Vec3 {
  return [
    Math.cos(angle) * Math.cos(azimuth),
    Math.cos(angle) * Math.sin(azimuth),
    Math.sin(angle),
  ];
}

export function SteeringEllipsoidPlot({ ellipsoid }: SteeringEllipsoidPlotProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const [rotation, setRotation] = useState({ yaw: -0.55, pitch: 0.28 });
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const width = 520;
    const height = 420;
    const dpr = window.devicePixelRatio || 1;
    const isDark = document.documentElement.classList.contains('dark');
    const bg = isDark ? '#111827' : '#ffffff';
    const fg = isDark ? '#e5e7eb' : '#111827';
    const muted = isDark ? '#9ca3af' : '#4b5563';
    const line = isDark ? '#5eead4' : '#0f766e';
    const sphere = isDark ? 'rgba(148, 163, 184, 0.65)' : 'rgba(71, 85, 105, 0.45)';
    const sphereFill = isDark ? 'rgba(20, 184, 166, 0.06)' : 'rgba(14, 116, 144, 0.05)';
    const centerColor = isDark ? '#fbbf24' : '#b45309';

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    const scale = 150 * zoom;
    const project = (point: Vec3): [number, number] => {
      const rotated = rotate(point, rotation.yaw, rotation.pitch);
      return [width / 2 + rotated[0] * scale, height / 2 - rotated[1] * scale];
    };

    ctx.fillStyle = sphereFill;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, scale, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = sphere;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    const drawSphereGrid = (strokeStyle: string, lineWidth: number) => {
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = lineWidth;
      for (const theta of [
        Math.PI / 8,
        Math.PI / 4,
        (3 * Math.PI) / 8,
        Math.PI / 2,
        (5 * Math.PI) / 8,
        (3 * Math.PI) / 4,
        (7 * Math.PI) / 8,
      ]) {
        ctx.beginPath();
        for (let i = 0; i <= 192; i += 1) {
          const [x, y] = project(spherePoint(theta, (2 * Math.PI * i) / 192));
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      for (let meridian = 0; meridian < 12; meridian += 1) {
        const azimuth = (Math.PI * meridian) / 12;
        ctx.beginPath();
        for (let i = 0; i <= 192; i += 1) {
          const [x, y] = project(meridianPoint((2 * Math.PI * i) / 192, azimuth));
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    };

    drawSphereGrid(sphere, 0.8);

    const axes: Array<[Vec3, string]> = [
      [[1, 0, 0], 'n'],
      [[0, 1, 0], 'r'],
      [[0, 0, 1], 'k'],
    ];
    ctx.font = '13px sans-serif';
    for (const [axis, label] of axes) {
      const start = project([0, 0, 0]);
      const end = project(axis);
      ctx.strokeStyle = muted;
      ctx.beginPath();
      ctx.moveTo(start[0], start[1]);
      ctx.lineTo(end[0], end[1]);
      ctx.stroke();
      ctx.fillStyle = fg;
      ctx.fillText(label, end[0] + 6, end[1] - 6);
    }

    ctx.strokeStyle = line;
    ctx.lineWidth = 1.4;
    const latitudeCount = 9;
    const longitudeCount = 16;
    for (let lat = 1; lat < latitudeCount; lat++) {
      const theta = (Math.PI * lat) / latitudeCount;
      ctx.beginPath();
      for (let i = 0; i <= 96; i++) {
        const phi = (2 * Math.PI * i) / 96;
        const [x, y] = project(ellipsoidPoint(ellipsoid, theta, phi));
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    for (let lon = 0; lon < longitudeCount; lon++) {
      const phi = (2 * Math.PI * lon) / longitudeCount;
      ctx.beginPath();
      for (let i = 0; i <= 96; i++) {
        const theta = (Math.PI * i) / 96;
        const [x, y] = project(ellipsoidPoint(ellipsoid, theta, phi));
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    const center = project(ellipsoid.center);
    ctx.fillStyle = centerColor;
    ctx.beginPath();
    ctx.arc(center[0], center[1], 4, 0, 2 * Math.PI);
    ctx.fill();

    drawSphereGrid(isDark ? 'rgba(203, 213, 225, 0.42)' : 'rgba(51, 65, 85, 0.32)', 0.75);

    ctx.fillStyle = fg;
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Quantum steering ellipsoid', width / 2, 24);
    ctx.fillStyle = muted;
    ctx.font = '12px sans-serif';
    ctx.fillText(
      `center (${ellipsoid.center.map((value) => value.toFixed(2)).join(', ')}), radii ${ellipsoid.radii
        .map((value) => value.toFixed(2))
        .join(', ')}`,
      width / 2,
      height - 18,
    );
  }, [ellipsoid, rotation, zoom]);

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    dragRef.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current) return;
    const dx = event.clientX - dragRef.current.x;
    const dy = event.clientY - dragRef.current.y;
    dragRef.current = { x: event.clientX, y: event.clientY };
    setRotation((current) => ({
      yaw: current.yaw + dx * 0.01,
      pitch: Math.max(-1.35, Math.min(1.35, current.pitch + dy * 0.01)),
    }));
  };

  const handlePointerUp = () => {
    dragRef.current = null;
  };

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        className="w-full rounded border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-gray-700 dark:bg-gray-900"
        role="img"
        tabIndex={0}
        aria-label="Interactive quantum steering ellipsoid. Drag to rotate. Use the zoom control or mouse wheel to zoom."
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={(event) => {
          event.preventDefault();
          setZoom((current) =>
            Math.max(0.55, Math.min(2.6, current * (event.deltaY < 0 ? 1.08 : 0.92))),
          );
        }}
      />
      <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
        <label htmlFor="ellipsoid-zoom" className="shrink-0">
          Zoom
        </label>
        <input
          id="ellipsoid-zoom"
          type="range"
          min="0.55"
          max="2.6"
          step="0.01"
          value={zoom}
          onChange={(event) => setZoom(Number(event.target.value))}
          className="min-w-0 flex-1"
          aria-valuetext={`${zoom.toFixed(2)}x`}
        />
        <output htmlFor="ellipsoid-zoom" className="w-12 text-right font-mono">
          {zoom.toFixed(2)}x
        </output>
      </div>
    </div>
  );
}
