import type { CorrelationMatrix } from './spin-types';
import type { LhaPdfGrid } from './lhapdf-grid';
import { fPid } from './lhapdf-grid';

export type IntegrationMethod = 'gl' | 'rect';
export type EftOrder = 0 | 1 | 2;
export type PhaseObservable = 'Delta' | 'Ckk' | 'Crr' | 'Cnn' | 'Crk' | 'B1k' | 'B1r';

export interface CoefficientEntry {
  name: string;
  value: number;
}

export interface SpinExplorerSettings {
  sqrtS: number;
  method: IntegrationMethod;
  nBeta: number;
  nZ: number;
  betaMin: number;
  betaMax: number;
  zMin: number;
  zMax: number;
  eftOrder: EftOrder;
  coefficients: CoefficientEntry[];
  observable: PhaseObservable;
}

export interface LocalKernels {
  A: number;
  Ckk: number;
  Crr: number;
  Cnn: number;
  Crk: number;
  Ckr: number;
  B1k: number;
  B1r: number;
  B2k: number;
  B2r: number;
}

export interface PhasePoint extends LocalKernels {
  beta: number;
  z: number;
  Delta: number;
}

export interface IntegratedSpinResult extends LocalKernels {
  Delta: number;
  sigma: number;
  matrix: CorrelationMatrix;
  phasePoints: PhasePoint[];
  betaNodes: number[];
  zNodes: number[];
  settings: SpinExplorerSettings;
}

export interface SteeringEllipsoid {
  center: Vec3;
  q: Mat3;
  radii: Vec3;
  axes: Mat3;
}

export type Vec3 = [number, number, number];
export type Mat3 = [Vec3, Vec3, Vec3];

const MTOP = 172.5;
const MH = 125.11;
const VEV = 246.22;
const GS = Math.sqrt(0.118 * 4 * Math.PI);
const EPS = 1e-12;

export const WILSON_COEFFICIENTS = [
  'c_tG',
  'c_phiG',
  'c_G',
  'cQq81',
  'cQq83',
  'ctu8',
  'ctd8',
  'cQu8',
  'cQd8',
  'ctq8',
  'cVVO',
  'cAAO',
  'cAVO',
  'cVAO',
  'cVVS',
  'cAAS',
  'cAVS',
  'cVAS',
] as const;

export const DEFAULT_SPIN_EXPLORER_SETTINGS: SpinExplorerSettings = {
  sqrtS: 13600,
  method: 'gl',
  nBeta: 24,
  nZ: 24,
  betaMin: 0.05,
  betaMax: 0.95,
  zMin: -1,
  zMax: 1,
  eftOrder: 1,
  coefficients: [{ name: 'c_tG', value: 0 }],
  observable: 'Delta',
};

export function betaFromMtt(mttGev: number): number {
  const threshold = 2 * MTOP;
  if (!Number.isFinite(mttGev) || mttGev <= threshold) return 0;
  return Math.sqrt(Math.max(0, 1 - (threshold * threshold) / (mttGev * mttGev)));
}

export function mttFromBeta(beta: number): number {
  return Math.sqrt(shatFromBeta(beta));
}

export function mttBoundsForSqrtS(sqrtS: number): { min: number; max: number } {
  return {
    min: 2 * MTOP,
    max: Math.max(2 * MTOP + 1, sqrtS * 0.999),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function finite(value: number, fallback = 0): number {
  return Number.isFinite(value) ? value : fallback;
}

function wcMap(entries: CoefficientEntry[]): Record<string, number> {
  return entries.reduce<Record<string, number>>((acc, entry) => {
    const value = Number(entry.value);
    if (entry.name && Number.isFinite(value) && value !== 0) {
      acc[entry.name] = value;
    }
    return acc;
  }, {});
}

function wc(wcValues: Record<string, number>, name: string): number {
  return wcValues[name] ?? 0;
}

export function normalizedSettings(settings: SpinExplorerSettings): SpinExplorerSettings {
  const sqrtS = clamp(settings.sqrtS, 2000, 100000);
  const betaUpper = clamp(betaFromMtt(mttBoundsForSqrtS(sqrtS).max), 0.01, 0.999);
  const betaMin = clamp(Math.min(settings.betaMin, settings.betaMax - 0.01), 0, betaUpper - 0.01);
  const betaMax = clamp(Math.max(settings.betaMax, betaMin + 0.01), betaMin + 0.01, betaUpper);
  const zMin = clamp(Math.min(settings.zMin, settings.zMax - 0.01), -1, 0.99);
  const zMax = clamp(Math.max(settings.zMax, zMin + 0.01), zMin + 0.01, 1);
  return {
    ...settings,
    sqrtS,
    nBeta: Math.round(clamp(settings.nBeta, 8, 96)),
    nZ: Math.round(clamp(settings.nZ, 8, 96)),
    betaMin,
    betaMax,
    zMin,
    zMax,
    coefficients: settings.coefficients.length
      ? settings.coefficients
      : DEFAULT_SPIN_EXPLORER_SETTINGS.coefficients,
  };
}

function gaussLegendre(
  n: number,
  min: number,
  max: number,
): { nodes: number[]; weights: number[] } {
  const nodes = new Array<number>(n);
  const weights = new Array<number>(n);
  const midpoint = 0.5 * (max + min);
  const half = 0.5 * (max - min);
  const m = Math.floor((n + 1) / 2);

  for (let i = 0; i < m; i++) {
    let z = Math.cos((Math.PI * (i + 0.75)) / (n + 0.5));
    let previous = 0;

    for (let iteration = 0; iteration < 32; iteration++) {
      let p1 = 1;
      let p2 = 0;
      for (let j = 1; j <= n; j++) {
        const p3 = p2;
        p2 = p1;
        p1 = ((2 * j - 1) * z * p2 - (j - 1) * p3) / j;
      }
      const derivative = (n * (z * p1 - p2)) / (z * z - 1);
      previous = z;
      z -= p1 / derivative;
      if (Math.abs(z - previous) < 1e-14) break;
    }

    let p1 = 1;
    let p2 = 0;
    for (let j = 1; j <= n; j++) {
      const p3 = p2;
      p2 = p1;
      p1 = ((2 * j - 1) * z * p2 - (j - 1) * p3) / j;
    }
    const derivative = (n * (z * p1 - p2)) / (z * z - 1);
    const weight = (2 * half) / ((1 - z * z) * derivative * derivative);

    nodes[i] = midpoint - half * z;
    nodes[n - 1 - i] = midpoint + half * z;
    weights[i] = weight;
    weights[n - 1 - i] = weight;
  }

  return { nodes, weights };
}

function rectangular(n: number, min: number, max: number): { nodes: number[]; weights: number[] } {
  const step = (max - min) / n;
  return {
    nodes: Array.from({ length: n }, (_, i) => min + (i + 0.5) * step),
    weights: Array.from({ length: n }, () => step),
  };
}

function integrationGrid(
  n: number,
  min: number,
  max: number,
  method: IntegrationMethod,
): { nodes: number[]; weights: number[] } {
  return method === 'gl' ? gaussLegendre(n, min, max) : rectangular(n, min, max);
}

function shatFromBeta(beta: number): number {
  const beta2 = clamp(beta * beta, 0, 1 - EPS);
  return (4 * MTOP * MTOP) / (1 - beta2);
}

function defaultMuDyn(shat: number, z: number): number {
  const p2cm = Math.max(shat / 4 - MTOP * MTOP, 0);
  const pt2 = p2cm * (1 - z * z);
  return Math.sqrt(MTOP * MTOP + pt2) / 2;
}

function fGgSm(beta: number, z: number): number {
  const beta2 = beta * beta;
  const bz2 = beta2 * z * z;
  return (7 + 9 * bz2) / (192 * (1 - bz2) * (1 - bz2));
}

function fQqSm(): number {
  return 1 / 18;
}

function ggSm(beta: number, z: number): LocalKernels {
  const beta2 = beta * beta;
  const beta4 = beta2 * beta2;
  const z2 = z * z;
  const z4 = z2 * z2;
  const f = fGgSm(beta, z);
  const oneMinusBeta2 = Math.max(1 - beta2, 0);
  const oneMinusZ2 = Math.max(1 - z2, 0);
  const rawRk = f * (2 * z * Math.pow(oneMinusZ2, 1.5) * beta2 * Math.sqrt(oneMinusBeta2));
  const rkSign = Math.sign(z || 1);

  return {
    A: f * (1 + 2 * beta2 * oneMinusZ2 - beta4 * (z4 - 2 * z2 + 2)),
    Cnn: -f * (1 - 2 * beta2 + beta4 * (z4 - 2 * z2 + 2)),
    Ckk: -f * (1 - 2 * z2 * oneMinusZ2 * beta2 - (2 - 2 * z2 + z4) * beta4),
    Crr: -f * (1 - (2 - 2 * z2 + z4) * beta2 * (2 - beta2)),
    Crk: rkSign * rawRk,
    Ckr: -rkSign * rawRk,
    B1k: 0,
    B1r: 0,
    B2k: 0,
    B2r: 0,
  };
}

function qqSm(beta: number, z: number, orientation: 1 | -1): LocalKernels {
  const zeff = orientation === 1 ? z : -z;
  const beta2 = beta * beta;
  const z2 = zeff * zeff;
  const f = fQqSm();
  const arg = Math.max((1 - z2) * (1 - beta2), 0);
  const rk = 2 * zeff * f * Math.sqrt(arg);
  const sign = Math.sign(z || 1) * (orientation === 1 ? 1 : -1);

  return {
    A: f * (2 + beta2 * (z2 - 1)),
    Cnn: f * beta2 * (z2 - 1),
    Ckk: f * (beta2 + z2 * (2 - beta2)),
    Crr: f * (2 - beta2 - z2 * (2 - beta2)),
    Crk: sign * rk,
    Ckr: -sign * rk,
    B1k: 0,
    B1r: 0,
    B2k: 0,
    B2r: 0,
  };
}

function ggLinear(beta: number, z: number, values: Record<string, number>): Partial<LocalKernels> {
  const beta2 = beta * beta;
  const z2 = z * z;
  const denom = Math.max(1 - beta2 * z2, 1e-10);
  const denom2 = beta2 * z2 - 1;
  const cTG = wc(values, 'c_tG');
  const cPhiG = wc(values, 'c_phiG');
  const cG = wc(values, 'c_G');
  const hdenom = 4 * MTOP * MTOP - (1 - beta2) * MH * MH;
  const common = (GS * GS) / denom;
  const termTG = (GS * GS * VEV * MTOP * (9 * beta2 * z2 + 7)) / (12 * Math.SQRT2);
  const termPhi = (-beta2 * MTOP ** 4) / hdenom;
  const termG = (9 * GS * GS * beta2 * MTOP * MTOP * z2) / 8;
  const sqrtBz = Math.sqrt(Math.max((1 - beta2) * (1 - z2), 1e-16));
  const sqrtRatio = Math.sqrt(Math.max((1 - z2) / Math.max(1 - beta2, 1e-16), 0));
  const rawCrk =
    common *
    (((GS *
      GS *
      VEV *
      MTOP *
      beta2 *
      z *
      (1 - z2) *
      (9 * beta2 + (beta2 - 2) * z2 * (9 * beta2 * (z2 - 1) + 7) - 2)) /
      (24 * Math.SQRT2 * sqrtBz * denom2)) *
      cTG +
      ((9 * GS * GS * beta2 * MTOP * MTOP * z) / 8) * sqrtRatio * cG);
  const rkSign = Math.sign(z || 1);

  return {
    A: common * (termTG * cTG + termPhi * cPhiG + termG * cG),
    Cnn:
      common *
      (((-7 * GS * GS * VEV * MTOP) / (12 * Math.SQRT2)) * cTG + termPhi * cPhiG + termG * cG),
    Ckk:
      common *
      (((GS * GS * VEV * MTOP * (9 * beta2 * z2 + 7) * (beta2 * (z2 * z2 - z2 - 1) + 1)) /
        (12 * Math.SQRT2 * denom2)) *
        cTG -
        termPhi * cPhiG -
        termG * cG),
    Crr:
      common *
      (((GS *
        GS *
        VEV *
        MTOP *
        (-9 * beta2 * beta2 * (z - z ** 3) ** 2 - 7 * beta2 * (z2 * z2 - z2 + 1) + 7)) /
        (12 * Math.SQRT2 * denom2)) *
        cTG +
        termPhi * cPhiG +
        termG * cG),
    Crk: rkSign * rawCrk,
    Ckr: -rkSign * rawCrk,
  };
}

function mapWarsawToInternal(
  values: Record<string, number>,
  qType: 'up' | 'down',
): Record<string, number> {
  const hasInternal = ['cVVO', 'cAAO', 'cAVO', 'cVAO', 'cVVS', 'cAAS', 'cAVS', 'cVAS'].some(
    (key) => key in values,
  );
  if (hasInternal) return { ...values };

  const cLL0 = (values.cQq81 ?? 0) + (qType === 'up' ? (values.cQq83 ?? 0) : -(values.cQq83 ?? 0));
  const cRR0 = qType === 'up' ? (values.ctu8 ?? 0) : (values.ctd8 ?? 0);
  const cLR0 = qType === 'up' ? (values.cQu8 ?? 0) : (values.cQd8 ?? 0);
  const cRL0 = values.ctq8 ?? 0;
  const norm = 0.5;

  return {
    ...values,
    cVVO: norm * (cLL0 + cRR0 + cRL0 + cLR0),
    cAAO: norm * (cLL0 + cRR0 - cRL0 - cLR0),
    cAVO: norm * (-cLL0 + cRR0 + cRL0 - cLR0),
    cVAO: norm * (-cLL0 + cRR0 - cRL0 + cLR0),
  };
}

function qqLinear(
  beta: number,
  z: number,
  values: Record<string, number>,
  orientation: 1 | -1,
): Partial<LocalKernels> {
  const zeff = orientation === 1 ? z : -z;
  const beta2 = beta * beta;
  const z2 = zeff * zeff;
  const denom = Math.max(1 - beta2, 1e-10);
  const cTG = wc(values, 'c_tG');
  const cVVO = wc(values, 'cVVO');
  const cAAO = wc(values, 'cAAO');
  const cAVO = wc(values, 'cAVO');
  const cVAO = wc(values, 'cVAO');
  const pref = (4 * GS * GS * MTOP * MTOP) / 9;
  const sqrtRatio = Math.sqrt(Math.max((1 - z2) / denom, 0));
  const sign = orientation === 1 ? 1 : -1;

  return {
    A:
      (pref / denom) *
      (Math.SQRT2 * GS * GS * (VEV / MTOP) * (1 - beta2) * cTG +
        (2 - (1 - z2) * beta2) * cVVO +
        2 * zeff * beta * cAAO),
    Cnn: -GS * GS * MTOP * MTOP * ((4 * beta2 * (1 - z2)) / (9 * denom)) * cVVO,
    Ckk:
      (4 *
        GS *
        GS *
        MTOP *
        (cVVO * MTOP * (beta2 + z2 * (2 - beta2)) +
          2 * zeff * cAAO * MTOP * beta +
          Math.SQRT2 * GS * GS * VEV * z2 * cTG * (1 - beta2))) /
      (9 * denom),
    Crr:
      ((4 * GS * GS * MTOP * MTOP * (1 - z2)) / (9 * denom)) *
      (Math.SQRT2 * GS * GS * (VEV / MTOP) * (1 - beta2) * cTG + (2 - beta2) * cVVO),
    Crk:
      (-2 *
        GS *
        GS *
        MTOP *
        MTOP *
        sqrtRatio *
        (Math.SQRT2 * GS * GS * (VEV / MTOP) * (2 - beta2) * zeff * cTG +
          4 * zeff * cVVO +
          2 * beta * cAAO)) /
      9,
    Ckr:
      (2 *
        GS *
        GS *
        MTOP *
        MTOP *
        sqrtRatio *
        (Math.SQRT2 * GS * GS * (VEV / MTOP) * (2 - beta2) * zeff * cTG +
          4 * zeff * cVVO +
          2 * beta * cAAO)) /
      9,
    B1k: (pref / denom) * (beta * (z2 + 1) * cAVO + 2 * zeff * cVAO),
    B1r: -pref * sqrtRatio * (beta * zeff * cAVO + 2 * cVAO) * sign,
    B2k: (pref / denom) * (beta * (z2 + 1) * cAVO - 2 * zeff * cVAO),
    B2r: pref * sqrtRatio * (beta * zeff * cAVO - 2 * cVAO) * sign,
  };
}

function addKernels(base: LocalKernels, patch: Partial<LocalKernels>, scale = 1): LocalKernels {
  return {
    A: base.A + (patch.A ?? 0) * scale,
    Ckk: base.Ckk + (patch.Ckk ?? 0) * scale,
    Crr: base.Crr + (patch.Crr ?? 0) * scale,
    Cnn: base.Cnn + (patch.Cnn ?? 0) * scale,
    Crk: base.Crk + (patch.Crk ?? 0) * scale,
    Ckr: base.Ckr + (patch.Ckr ?? patch.Crk ?? 0) * scale,
    B1k: base.B1k + (patch.B1k ?? 0) * scale,
    B1r: base.B1r + (patch.B1r ?? 0) * scale,
    B2k: base.B2k + (patch.B2k ?? 0) * scale,
    B2r: base.B2r + (patch.B2r ?? 0) * scale,
  };
}

const LUMINOSITY_X_NODES = [
  0.00343570040745, 0.018014036361, 0.0438827858743, 0.0804415140889, 0.12683404677, 0.181973159637,
  0.244566499025, 0.313146955642, 0.386107074429, 0.461736739433, 0.538263260567, 0.613892925571,
  0.686853044358, 0.755433500975, 0.818026840363, 0.87316595323, 0.919558485911, 0.956117214126,
  0.981985963639, 0.996564299593,
];

const LUMINOSITY_X_WEIGHTS = [
  0.00880700356958, 0.0203007149002, 0.0313360241671, 0.0416383707884, 0.0509650599086,
  0.0590972659808, 0.0658443192246, 0.0710480546592, 0.0745864932363, 0.0763766935654,
  0.0763766935654, 0.0745864932363, 0.0710480546592, 0.0658443192246, 0.0590972659808,
  0.0509650599086, 0.0416383707884, 0.0313360241671, 0.0203007149002, 0.00880700356958,
];

function luminosityAb(
  pdfGrid: LhaPdfGrid,
  tau: number,
  mu: number,
  pidA: number,
  pidB: number,
): number {
  if (tau <= 0 || tau >= 1) return 0;
  const logMin = Math.log(tau);
  let sum = 0;
  for (let i = 0; i < LUMINOSITY_X_NODES.length; i++) {
    const u = LUMINOSITY_X_NODES[i] * -logMin;
    const x = Math.exp(logMin + u);
    const xb = tau / x;
    sum +=
      LUMINOSITY_X_WEIGHTS[i] * -logMin * fPid(pdfGrid, pidA, x, mu) * fPid(pdfGrid, pidB, xb, mu);
  }
  return sum;
}

function lhapdfLuminosities(
  beta: number,
  z: number,
  sqrtS: number,
  pdfGrid: LhaPdfGrid,
): {
  gg: number;
  upForward: number;
  upBackward: number;
  downForward: number;
  downBackward: number;
} {
  const tau = shatFromBeta(beta) / (sqrtS * sqrtS);
  if (tau <= 0 || tau >= 1) {
    return { gg: 0, upForward: 0, upBackward: 0, downForward: 0, downBackward: 0 };
  }
  const shat = shatFromBeta(beta);
  const mu = defaultMuDyn(shat, z);
  return {
    gg: luminosityAb(pdfGrid, tau, mu, 21, 21),
    upForward: luminosityAb(pdfGrid, tau, mu, 2, -2) + luminosityAb(pdfGrid, tau, mu, 4, -4),
    upBackward: luminosityAb(pdfGrid, tau, mu, -2, 2) + luminosityAb(pdfGrid, tau, mu, -4, 4),
    downForward: luminosityAb(pdfGrid, tau, mu, 1, -1) + luminosityAb(pdfGrid, tau, mu, 3, -3),
    downBackward: luminosityAb(pdfGrid, tau, mu, -1, 1) + luminosityAb(pdfGrid, tau, mu, -3, 3),
  };
}

function surrogateLuminosities(
  beta: number,
  z: number,
  sqrtS: number,
): {
  gg: number;
  upForward: number;
  upBackward: number;
  downForward: number;
  downBackward: number;
} {
  const tau = shatFromBeta(beta) / (sqrtS * sqrtS);
  if (tau <= 0 || tau >= 1) {
    return { gg: 0, upForward: 0, upBackward: 0, downForward: 0, downBackward: 0 };
  }
  const x = Math.sqrt(tau);
  const highX = Math.pow(Math.max(1 - x, 0), 4.8);
  const smallX = Math.pow(Math.max(tau, 1e-8), -0.28);
  const scale = Math.log(defaultMuDyn(shatFromBeta(beta), z) + 3) / Math.log(175);
  const gg = 5.4 * smallX * Math.pow(Math.max(1 - x, 0), 5.8) * scale;
  const up = 0.72 * Math.pow(Math.max(tau, 1e-8), -0.13) * highX * (1 + 0.05 * scale);
  const down = 0.42 * Math.pow(Math.max(tau, 1e-8), -0.11) * highX * (1 + 0.04 * scale);
  const orientation = 0.14 * z * Math.max(0.2, 1 - 1.5 * x);

  return {
    gg,
    upForward: up * (1 + orientation),
    upBackward: up * (1 - orientation),
    downForward: down * (1 + 0.75 * orientation),
    downBackward: down * (1 - 0.75 * orientation),
  };
}

function localPpKernels(
  beta: number,
  z: number,
  settings: SpinExplorerSettings,
  pdfGrid?: LhaPdfGrid,
): LocalKernels {
  const values = wcMap(settings.coefficients);
  const l = pdfGrid
    ? lhapdfLuminosities(beta, z, settings.sqrtS, pdfGrid)
    : surrogateLuminosities(beta, z, settings.sqrtS);
  let sum: LocalKernels = {
    A: 0,
    Ckk: 0,
    Crr: 0,
    Cnn: 0,
    Crk: 0,
    Ckr: 0,
    B1k: 0,
    B1r: 0,
    B2k: 0,
    B2r: 0,
  };

  let gg = ggSm(beta, z);
  if (settings.eftOrder > 0) {
    const linear = ggLinear(beta, z, values);
    gg = addKernels(gg, linear);
    if (settings.eftOrder > 1)
      gg = addKernels(gg, linear, 0.25 * Math.max(...Object.values(values).map(Math.abs), 0));
  }
  sum = addKernels(sum, gg, l.gg);

  const channels: Array<[Record<string, number>, number, 1 | -1]> = [
    [mapWarsawToInternal(values, 'up'), l.upForward, 1],
    [mapWarsawToInternal(values, 'up'), l.upBackward, -1],
    [mapWarsawToInternal(values, 'down'), l.downForward, 1],
    [mapWarsawToInternal(values, 'down'), l.downBackward, -1],
  ];

  for (const [mapped, weight, orientation] of channels) {
    let qq = qqSm(beta, z, orientation);
    if (settings.eftOrder > 0) {
      const linear = qqLinear(beta, z, mapped, orientation);
      qq = addKernels(qq, linear);
      if (settings.eftOrder > 1)
        qq = addKernels(qq, linear, 0.25 * Math.max(...Object.values(mapped).map(Math.abs), 0));
    }
    sum = addKernels(sum, qq, weight);
  }

  return sum;
}

function betaJacobian(beta: number): number {
  const beta2 = Math.min(beta * beta, 1 - EPS);
  return (2 * beta2) / (1 - beta2);
}

export function deltaCriterion(Ckk: number, Crr: number, Cnn: number): number {
  return -Cnn + Math.abs(Ckk + Crr) - 1;
}

export function integrateSpinExplorer(
  settingsInput: SpinExplorerSettings,
  pdfGrid?: LhaPdfGrid,
): IntegratedSpinResult {
  const settings = normalizedSettings(settingsInput);
  const betaGrid = integrationGrid(
    settings.nBeta,
    settings.betaMin,
    settings.betaMax,
    settings.method,
  );
  const zGrid = integrationGrid(settings.nZ, settings.zMin, settings.zMax, settings.method);
  const totals: LocalKernels = {
    A: 0,
    Ckk: 0,
    Crr: 0,
    Cnn: 0,
    Crk: 0,
    Ckr: 0,
    B1k: 0,
    B1r: 0,
    B2k: 0,
    B2r: 0,
  };
  const phasePoints: PhasePoint[] = [];
  let sigma = 0;

  for (let ib = 0; ib < betaGrid.nodes.length; ib++) {
    const beta = betaGrid.nodes[ib];
    for (let iz = 0; iz < zGrid.nodes.length; iz++) {
      const z = zGrid.nodes[iz];
      const local = localPpKernels(beta, z, settings, pdfGrid);
      const jacobianWeight = betaGrid.weights[ib] * zGrid.weights[iz] * betaJacobian(beta);
      const weightedA = Math.max(local.A, 0) * jacobianWeight;
      sigma += weightedA;
      totals.A += weightedA;
      totals.Ckk += local.Ckk * jacobianWeight;
      totals.Crr += local.Crr * jacobianWeight;
      totals.Cnn += local.Cnn * jacobianWeight;
      totals.Crk += local.Crk * jacobianWeight;
      totals.Ckr += local.Ckr * jacobianWeight;
      totals.B1k += local.B1k * jacobianWeight;
      totals.B1r += local.B1r * jacobianWeight;
      totals.B2k += local.B2k * jacobianWeight;
      totals.B2r += local.B2r * jacobianWeight;

      const invLocalA = Math.abs(local.A) > EPS ? 1 / local.A : 0;
      const phaseCrk = local.Crk * invLocalA;
      const point = {
        beta,
        z,
        A: local.A,
        Ckk: -local.Ckk * invLocalA,
        Crr: -local.Crr * invLocalA,
        Cnn: -local.Cnn * invLocalA,
        Crk: phaseCrk,
        Ckr: phaseCrk,
        B1k: local.B1k * invLocalA,
        B1r: local.B1r * invLocalA,
        B2k: local.B2k * invLocalA,
        B2r: local.B2r * invLocalA,
        Delta: 0,
      };
      point.Delta = deltaCriterion(point.Ckk, point.Crr, point.Cnn);
      phasePoints.push(point);
    }
  }

  const invSigma = Math.abs(sigma) > EPS ? 1 / sigma : 0;
  const symmetricCrk = finite(totals.Crk * invSigma);
  const result: LocalKernels = {
    A: totals.A,
    Ckk: finite(-totals.Ckk * invSigma),
    Crr: finite(-totals.Crr * invSigma),
    Cnn: finite(-totals.Cnn * invSigma),
    Crk: symmetricCrk,
    Ckr: symmetricCrk,
    B1k: finite(totals.B1k * invSigma),
    B1r: finite(totals.B1r * invSigma),
    B2k: finite(totals.B2k * invSigma),
    B2r: finite(totals.B2r * invSigma),
  };
  const delta = deltaCriterion(result.Ckk, result.Crr, result.Cnn);
  const matrix: CorrelationMatrix = {
    size: 3,
    data: [result.Cnn, 0, 0, 0, result.Crr, result.Crk, 0, result.Ckr, result.Ckk],
  };

  return {
    ...result,
    Delta: finite(delta),
    sigma: finite(sigma),
    matrix,
    phasePoints,
    betaNodes: betaGrid.nodes,
    zNodes: zGrid.nodes,
    settings,
  };
}

function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function matVec(m: Mat3, v: Vec3): Vec3 {
  return [
    m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
    m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
    m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2],
  ];
}

function outer(a: Vec3, b: Vec3): Mat3 {
  return [
    [a[0] * b[0], a[0] * b[1], a[0] * b[2]],
    [a[1] * b[0], a[1] * b[1], a[1] * b[2]],
    [a[2] * b[0], a[2] * b[1], a[2] * b[2]],
  ];
}

function sub(a: Mat3, b: Mat3): Mat3 {
  return a.map((row, i) => row.map((value, j) => value - b[i][j]) as Vec3) as Mat3;
}

function add(a: Mat3, b: Mat3): Mat3 {
  return a.map((row, i) => row.map((value, j) => value + b[i][j]) as Vec3) as Mat3;
}

function scaleMat(a: Mat3, scale: number): Mat3 {
  return a.map((row) => row.map((value) => value * scale) as Vec3) as Mat3;
}

function transpose(a: Mat3): Mat3 {
  return [
    [a[0][0], a[1][0], a[2][0]],
    [a[0][1], a[1][1], a[2][1]],
    [a[0][2], a[1][2], a[2][2]],
  ];
}

function multiply(a: Mat3, b: Mat3): Mat3 {
  const out: Mat3 = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      out[i][j] = a[i][0] * b[0][j] + a[i][1] * b[1][j] + a[i][2] * b[2][j];
    }
  }
  return out;
}

function identity(): Mat3 {
  return [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];
}

function jacobiEigenSymmetric(input: Mat3): { values: Vec3; vectors: Mat3 } {
  const a: Mat3 = input.map((row) => [...row] as Vec3) as Mat3;
  const v = identity();

  for (let iteration = 0; iteration < 40; iteration++) {
    let p = 0;
    let q = 1;
    let max = Math.abs(a[p][q]);
    for (const [i, j] of [
      [0, 2],
      [1, 2],
    ] as Array<[number, number]>) {
      const value = Math.abs(a[i][j]);
      if (value > max) {
        max = value;
        p = i;
        q = j;
      }
    }
    if (max < 1e-12) break;

    const theta = (a[q][q] - a[p][p]) / (2 * a[p][q]);
    const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
    const c = 1 / Math.sqrt(t * t + 1);
    const s = t * c;
    const app = a[p][p];
    const aqq = a[q][q];
    const apq = a[p][q];

    a[p][p] = app - t * apq;
    a[q][q] = aqq + t * apq;
    a[p][q] = 0;
    a[q][p] = 0;

    for (let k = 0; k < 3; k++) {
      if (k !== p && k !== q) {
        const akp = a[k][p];
        const akq = a[k][q];
        a[k][p] = c * akp - s * akq;
        a[p][k] = a[k][p];
        a[k][q] = s * akp + c * akq;
        a[q][k] = a[k][q];
      }
      const vkp = v[k][p];
      const vkq = v[k][q];
      v[k][p] = c * vkp - s * vkq;
      v[k][q] = s * vkp + c * vkq;
    }
  }

  const pairs = ([0, 1, 2] as const)
    .map((index) => ({
      value: Math.max(0, a[index][index]),
      vector: [v[0][index], v[1][index], v[2][index]] as Vec3,
    }))
    .sort((left, right) => right.value - left.value);

  return {
    values: [pairs[0].value, pairs[1].value, pairs[2].value],
    vectors: [
      [pairs[0].vector[0], pairs[1].vector[0], pairs[2].vector[0]],
      [pairs[0].vector[1], pairs[1].vector[1], pairs[2].vector[1]],
      [pairs[0].vector[2], pairs[1].vector[2], pairs[2].vector[2]],
    ],
  };
}

export function steeringEllipsoidFromResult(result: IntegratedSpinResult): SteeringEllipsoid {
  const b: Vec3 = [0, result.B1r, result.B1k];
  const bbar: Vec3 = [0, result.B2r, result.B2k];
  const c: Mat3 = [
    [result.Cnn, 0, 0],
    [0, result.Crr, result.Crk],
    [0, result.Ckr, result.Ckk],
  ];
  const bbarNorm = clamp(dot(bbar, bbar), 0, 1 - 1e-8);
  const denom = 1 - bbarNorm;
  const cBbar = matVec(c, bbar);
  const center: Vec3 = [
    (b[0] - cBbar[0]) / denom,
    (b[1] - cBbar[1]) / denom,
    (b[2] - cBbar[2]) / denom,
  ];

  const t1 = sub(c, outer(b, bbar));
  const t2 = add(identity(), scaleMat(outer(bbar, bbar), 1 / denom));
  const t3 = sub(transpose(c), outer(bbar, b));
  const qRaw = scaleMat(multiply(multiply(t1, t2), t3), 1 / denom);
  const q: Mat3 = [
    [qRaw[0][0], 0.5 * (qRaw[0][1] + qRaw[1][0]), 0.5 * (qRaw[0][2] + qRaw[2][0])],
    [0.5 * (qRaw[1][0] + qRaw[0][1]), qRaw[1][1], 0.5 * (qRaw[1][2] + qRaw[2][1])],
    [0.5 * (qRaw[2][0] + qRaw[0][2]), 0.5 * (qRaw[2][1] + qRaw[1][2]), qRaw[2][2]],
  ];
  const eig = jacobiEigenSymmetric(q);

  return {
    center,
    q,
    radii: [
      Math.sqrt(Math.max(eig.values[0], 0)),
      Math.sqrt(Math.max(eig.values[1], 0)),
      Math.sqrt(Math.max(eig.values[2], 0)),
    ],
    axes: eig.vectors,
  };
}
