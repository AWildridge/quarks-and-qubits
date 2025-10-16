/**
 * Type definitions for spin correlation explorer
 */

export type ProductionMode = 'gg' | 'qqbar';
export type Basis = 'helicity' | 'beam' | 'off-diagonal';
export type EnergyPreset = '7TeV' | '8TeV' | '13TeV' | '14TeV';

export interface SpinParameters {
  productionMode: ProductionMode;
  basis: Basis;
  energy: EnergyPreset;
  theta: number; // radians, [0, π]
  phi: number; // radians, [0, 2π]
}

export interface CorrelationMatrix {
  /** 3x3 matrix of C_ij values, flattened row-major */
  data: number[];
  /** Number of rows/columns (always 3 for spin-1/2) */
  size: number;
}

export interface SpinGrid {
  productionMode: ProductionMode;
  basis: Basis;
  energy: EnergyPreset;
  /** Number of theta steps */
  thetaSteps: number;
  /** Number of phi steps */
  phiSteps: number;
  /** Theta values in radians */
  thetaRange: number[];
  /** Phi values in radians */
  phiRange: number[];
  /** Precomputed C_ij matrices: [thetaIdx][phiIdx][9 values] */
  grids: number[][][];
}

export interface SpinAxes {
  /** Unit vector for top quark spin axis [x, y, z] */
  top: [number, number, number];
  /** Unit vector for anti-top quark spin axis [x, y, z] */
  antiTop: [number, number, number];
}

export interface ExportData {
  parameters: SpinParameters;
  correlationMatrix: CorrelationMatrix;
  timestamp: string;
  version: string;
}
