/**
 * Utilities for loading and interpolating spin correlation grids
 */

import type {
  SpinGrid,
  ProductionMode,
  Basis,
  EnergyPreset,
  CorrelationMatrix,
} from './spin-types';

/**
 * Load a precomputed grid from JSON
 */
export async function loadGrid(
  productionMode: ProductionMode,
  basis: Basis,
  energy: EnergyPreset,
): Promise<SpinGrid> {
  const filename = `${productionMode}_${basis}_${energy}.json`;
  const response = await fetch(`/data/spin-grids/${filename}`);
  if (!response.ok) {
    throw new Error(`Failed to load grid: ${filename}`);
  }
  return response.json();
}

/**
 * Bilinear interpolation between grid points
 */
function bilinearInterpolate(
  grid: number[][][],
  thetaRange: number[],
  phiRange: number[],
  theta: number,
  phi: number,
): number[] {
  // Find surrounding grid points
  const thetaIdx = thetaRange.findIndex((t) => t >= theta);
  const phiIdx = phiRange.findIndex((p) => p >= phi);

  // Handle edge cases
  if (thetaIdx <= 0) return grid[0][phiIdx >= 0 ? phiIdx : 0];
  if (thetaIdx >= thetaRange.length) return grid[thetaRange.length - 1][phiIdx >= 0 ? phiIdx : 0];
  if (phiIdx <= 0) return grid[thetaIdx][0];
  if (phiIdx >= phiRange.length) return grid[thetaIdx][phiRange.length - 1];

  // Get the four surrounding points
  const t0 = thetaRange[thetaIdx - 1];
  const t1 = thetaRange[thetaIdx];
  const p0 = phiRange[phiIdx - 1];
  const p1 = phiRange[phiIdx];

  const q00 = grid[thetaIdx - 1][phiIdx - 1];
  const q01 = grid[thetaIdx - 1][phiIdx];
  const q10 = grid[thetaIdx][phiIdx - 1];
  const q11 = grid[thetaIdx][phiIdx];

  // Normalized coordinates [0, 1]
  const dt = (theta - t0) / (t1 - t0);
  const dp = (phi - p0) / (p1 - p0);

  // Interpolate each matrix element
  const result = new Array(9);
  for (let i = 0; i < 9; i++) {
    const v0 = q00[i] * (1 - dt) + q10[i] * dt;
    const v1 = q01[i] * (1 - dt) + q11[i] * dt;
    result[i] = v0 * (1 - dp) + v1 * dp;
  }

  return result;
}

/**
 * Get correlation matrix for specific angles
 */
export function getCorrelationMatrix(
  grid: SpinGrid,
  theta: number,
  phi: number,
): CorrelationMatrix {
  const data = bilinearInterpolate(grid.grids, grid.thetaRange, grid.phiRange, theta, phi);
  return {
    data,
    size: 3,
  };
}

/**
 * Compute spin axes from correlation matrix
 * This is a simplified approximation for visualization
 */
export function computeSpinAxes(matrix: CorrelationMatrix, theta: number, phi: number) {
  // In the beam basis, the dominant correlation direction
  // can be approximated from the matrix structure
  const sinTheta = Math.sin(theta);
  const cosTheta = Math.cos(theta);
  const sinPhi = Math.sin(phi);
  const cosPhi = Math.cos(phi);

  // Top quark spin axis (approximation based on production angles)
  const top: [number, number, number] = [sinTheta * cosPhi, sinTheta * sinPhi, cosTheta];

  // Anti-top spin axis (anti-correlated in some components)
  // This is a simplified model for visualization
  const Czz = matrix.data[8];
  const antiCorrelation = Czz < 0 ? -1 : 1;

  const antiTop: [number, number, number] = [
    antiCorrelation * sinTheta * Math.cos(phi + Math.PI),
    antiCorrelation * sinTheta * Math.sin(phi + Math.PI),
    antiCorrelation * cosTheta,
  ];

  return { top, antiTop };
}

/**
 * Get a readable label for matrix element
 */
export function getMatrixLabel(row: number, col: number): string {
  const labels = ['x', 'y', 'z'];
  return `C_{${labels[row]}${labels[col]}}`;
}

/**
 * Get color for heatmap based on correlation value
 * Returns RGB color string
 */
export function getHeatmapColor(value: number): string {
  // Blue (negative) -> White (zero) -> Red (positive)
  // Assuming values in [-1, 1]
  const normalized = Math.max(-1, Math.min(1, value));

  if (normalized < 0) {
    // Negative: blue scale
    const intensity = Math.abs(normalized);
    const r = Math.round(255 * (1 - intensity));
    const g = Math.round(255 * (1 - intensity));
    const b = 255;
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    // Positive: red scale
    const intensity = normalized;
    const r = 255;
    const g = Math.round(255 * (1 - intensity));
    const b = Math.round(255 * (1 - intensity));
    return `rgb(${r}, ${g}, ${b})`;
  }
}
