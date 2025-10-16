/**
 * Generate precomputed spin correlation grids for the demo.
 * These are simplified analytical approximations for demonstration purposes.
 * Real physics would require full NNLO QCD calculations.
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, '..', 'public', 'data', 'spin-grids');

// Create output directory
mkdirSync(OUTPUT_DIR, { recursive: true });

/**
 * Simplified spin correlation model (LO approximation)
 * C_ij = correlation between spin component i of top and component j of anti-top
 * For demonstration: uses analytical forms based on production mechanism
 */
function computeCij(productionMode, basis, energy, theta, phi) {
  // Matrix indices: 0=x, 1=y, 2=z in the chosen basis
  const Cij = Array(9).fill(0);

  // Production-dependent correlation strength
  const alpha = productionMode === 'gg' ? 0.3 : 0.5; // qqbar has stronger correlations
  const energyFactor = parseFloat(energy.replace('TeV', '')) / 13.0; // normalize to 13 TeV

  if (basis === 'helicity') {
    // Helicity basis: aligned with particle momentum
    // Diagonal correlations dominate
    Cij[0] = alpha * energyFactor * Math.cos(theta) * 0.3; // C_xx
    Cij[1] = 0.02; // C_xy (small)
    Cij[2] = alpha * Math.sin(theta) * Math.cos(phi) * 0.4; // C_xz
    Cij[3] = 0.02; // C_yx
    Cij[4] = alpha * energyFactor * Math.cos(theta) * 0.3; // C_yy
    Cij[5] = alpha * Math.sin(theta) * Math.sin(phi) * 0.4; // C_yz
    Cij[6] = alpha * Math.sin(theta) * Math.cos(phi) * 0.4; // C_zx
    Cij[7] = alpha * Math.sin(theta) * Math.sin(phi) * 0.4; // C_zy
    Cij[8] = alpha * energyFactor * (1 - 0.3 * Math.sin(theta) ** 2); // C_zz (strongest)
  } else if (basis === 'beam') {
    // Beam basis: z along beam axis
    // Different correlation pattern
    Cij[0] = alpha * 0.25 * Math.cos(2 * phi); // C_xx
    Cij[1] = alpha * 0.25 * Math.sin(2 * phi); // C_xy
    Cij[2] = alpha * 0.15 * Math.sin(theta); // C_xz
    Cij[3] = alpha * 0.25 * Math.sin(2 * phi); // C_yx
    Cij[4] = -alpha * 0.25 * Math.cos(2 * phi); // C_yy
    Cij[5] = alpha * 0.15 * Math.cos(theta); // C_yz
    Cij[6] = alpha * 0.15 * Math.sin(theta); // C_zx
    Cij[7] = alpha * 0.15 * Math.cos(theta); // C_zy
    Cij[8] = alpha * energyFactor * 0.35; // C_zz
  } else {
    // off-diagonal basis: maximizes off-diagonal elements
    const mixAngle = Math.PI / 4;
    Cij[0] = alpha * 0.2; // C_xx
    Cij[1] = alpha * energyFactor * 0.45 * Math.cos(theta - mixAngle); // C_xy (enhanced)
    Cij[2] = alpha * 0.3 * Math.sin(phi); // C_xz
    Cij[3] = alpha * energyFactor * 0.45 * Math.cos(theta - mixAngle); // C_yx
    Cij[4] = alpha * 0.2; // C_yy
    Cij[5] = alpha * 0.3 * Math.cos(phi); // C_yz
    Cij[6] = alpha * 0.3 * Math.sin(phi); // C_zx
    Cij[7] = alpha * 0.3 * Math.cos(phi); // C_zy
    Cij[8] = alpha * 0.25 * (1 + 0.2 * Math.cos(theta)); // C_zz
  }

  return Cij;
}

/**
 * Generate grid for a specific parameter combination
 */
function generateGrid(productionMode, basis, energy, thetaSteps, phiSteps) {
  const thetaRange = Array.from({ length: thetaSteps }, (_, i) => (i * Math.PI) / (thetaSteps - 1));
  const phiRange = Array.from({ length: phiSteps }, (_, i) => (i * 2 * Math.PI) / (phiSteps - 1));

  const grids = thetaRange.map((theta) =>
    phiRange.map((phi) => computeCij(productionMode, basis, energy, theta, phi)),
  );

  return {
    productionMode,
    basis,
    energy,
    thetaSteps,
    phiSteps,
    thetaRange,
    phiRange,
    grids,
  };
}

// Generate grids for all combinations
const productionModes = ['gg', 'qqbar'];
const bases = ['helicity', 'beam', 'off-diagonal'];
const energies = ['7TeV', '8TeV', '13TeV', '14TeV'];

// Use 91x91 grid for good resolution (π/90 ~ 2 degrees)
const thetaSteps = 91;
const phiSteps = 91;

console.log('Generating spin correlation grids...');
let count = 0;

for (const productionMode of productionModes) {
  for (const basis of bases) {
    for (const energy of energies) {
      const grid = generateGrid(productionMode, basis, energy, thetaSteps, phiSteps);
      const filename = `${productionMode}_${basis}_${energy}.json`;
      const filepath = join(OUTPUT_DIR, filename);

      writeFileSync(filepath, JSON.stringify(grid, null, 2));
      count++;
      console.log(`✓ Generated ${filename}`);
    }
  }
}

console.log(`\n✅ Generated ${count} grid files in ${OUTPUT_DIR}`);
