import { qubitId, type Coordinate, type Family } from './topology.ts';

// Adapted from AJ Wildridge's PrimaryVertexing, commit 2eee5972bf8a459286b3ef3712df4f70c53bb039:
// src/embedding/embedding_utils.py::generate_ideal_CPCG_embedding and
// src/Missing_Qubit_Correction.py::minor_embed (also the Pegasus CPCG notebook).
// Coordinates are checked before conversion; padded empty chains are never logical vertices.
export function chimeraNexus(nexus: number, copies: number): Coordinate[][] {
  const width = Math.ceil(nexus / 8),
    height = Math.ceil(nexus / 4);
  const chains: Coordinate[][] = [];
  for (let copy = 0; copy < copies; copy++)
    for (let i = 0; i < nexus; i++) {
      const layer = Math.floor(i / 4),
        k = i % 4;
      const row = copy * width + height - 1 - layer,
        col = copy * width + layer;
      const chain: Coordinate[] = [
        [row, col, 0, k],
        [row, col, 1, k],
      ];
      for (let d = 1; d < height - layer; d++) chain.push([row - d, col, 0, k]);
      for (let d = 1; d <= layer; d++) chain.push([row, col - d, 1, k]);
      if (layer + 1 > height / 2) {
        for (let d = 1; d <= (copies - copy - 1) * width; d++) chain.push([row, col + d, 1, k]);
        const start = width - (layer - Math.floor(height / 2));
        for (let d = 0; d < copy * width - (height - 1 - layer); d++)
          chain.push([row - start - d, col, 0, k]);
      } else {
        for (let d = 0; d < copy * width - layer; d++) chain.push([row, col - layer - 1 - d, 1, k]);
        for (let d = 1; d <= (copies - copy - 1) * width; d++) chain.push([row + d, col, 0, k]);
      }
      chains.push(chain);
    }
  return chains;
}

export function pegasusNexus(nexus: number, copies: number): Coordinate[][] {
  const p = Math.ceil(nexus / 8) + 1,
    factor = Math.floor(p / 2);
  const layers = p - 1,
    split1 = Math.floor(p / 2),
    split2 = p - split1;
  const upLeft = 2 - Math.ceil(nexus / 16);
  const result: Coordinate[][] = [];
  for (let copy = 0; copy < copies; copy++) {
    const offset = copy * factor,
      up = offset,
      left = offset;
    const down = (copies - 1 - copy) * factor,
      right = down;
    const chains: Coordinate[][] = [];
    for (let red = 0; red < 4; red++) {
      const chain: Coordinate[] = [];
      for (let z = 0; z < p - 1 + down; z++)
        chain.push([0, offset, 4 + red, z + offset], [0, offset, 8 + red, z + offset]);
      for (let z = -left; z < 1; z++)
        chain.push([1, p - 1 + offset, red, z + offset], [1, p - 1 + offset, red + 4, z + offset]);
      chains.push(chain);
    }
    for (let yellow = 0; yellow < 4; yellow++) {
      const chain: Coordinate[] = [];
      for (let z = 0; z < p - 1 + down; z++) chain.push([0, 1 + offset, yellow, z + offset]);
      for (let z = -left; z < 1; z++) chain.push([1, p - 2 + offset, yellow + 8, z + offset]);
      chains.push(chain);
    }
    for (let w = 1; w < p - 1; w++)
      for (let k = 4; k < 8; k++) {
        const chain: Coordinate[] = [];
        for (let z = -left; z < p - 1 + right; z++) {
          if (
            w + z > p - 1 + right ||
            (w <= split1 && z < 0) ||
            (z < 0 && w + z + 2 * offset <= split2 * (copy + 1) - copy - upLeft)
          )
            continue;
          if (w <= split1 || w + z <= layers) chain.push([1, w + offset, k, z + offset]);
          if (w + z === p - 1)
            for (let v = -up; v <= p - 2 - z + down; v++) {
              if (
                (offset !== 0 &&
                  z > split1 - 1 &&
                  z + v + 2 * offset < split2 + split1 * copy - upLeft) ||
                (z <= split1 - 1 && v < 0)
              )
                continue;
              if (z < split1 || z + v < layers) chain.push([0, z + offset, k, v + offset]);
            }
        }
        chains.push(chain);
      }
    for (let w = 0; w < p - 2; w++)
      for (let k = 8; k < 12; k++) {
        const chain: Coordinate[] = [];
        for (let z = -left; z < p - 1 + right; z++) {
          if (
            w + z > p - 2 + right ||
            (w <= split1 - 1 && z < 0) ||
            (z < 0 && w + z + 2 * offset < split2 * (copy + 1) - copy - upLeft)
          )
            continue;
          if (w < split1 || w + z < layers) chain.push([1, w + offset, k, z + offset]);
          if (w + z === p - 2)
            for (let v = -up; v <= p - 2 - z + down; v++) {
              const vw = z + 1;
              if (
                (offset !== 0 &&
                  vw > split1 - 1 &&
                  vw + v + 2 * offset < split2 + split1 * copy + 1 - upLeft) ||
                (vw <= split1 && v < 0)
              )
                continue;
              if (vw <= split1 || vw + v <= layers) chain.push([0, vw + offset, k - 8, v + offset]);
            }
        }
        for (let z = -left; z < p - 1 + right; z++) {
          if (
            w + z > p - 2 + right ||
            (w + offset < p + (copy - 1) * factor - 1 && w + z + 2 * offset <= (p - 1) * copy - 1)
          )
            continue;
          if (w + offset >= split1 + split2 * copy && w + z + 2 * offset === layers) break;
          if (
            (w <= split1 - 1 && z < 0) ||
            (z < 0 && w + z + 2 * offset < split2 * (copy + 1) - copy - upLeft)
          )
            continue;
          if (w < split1 || w + z < layers) chain.push([1, w + 1 + offset, k - 8, z + offset]);
          if (w + z === p - 2)
            for (let v = -up; v <= p - 2 - z + down; v++) {
              if (
                (offset !== 0 &&
                  z > split1 - 1 &&
                  z + v + 2 * offset < split2 + split1 * copy - upLeft) ||
                (z <= split1 - 1 && v < 0)
              )
                continue;
              if (z < split1 || z + v < layers) chain.push([0, z + offset, k, v + offset]);
            }
        }
        chains.push(chain);
      }
    result.push(...chains.slice(0, nexus));
  }
  return result;
}

export function templateEmbedding(
  family: Family,
  size: number,
  m: number,
  n: number,
  swap = false,
  dx = 0,
  dy = 0,
  padded = false,
): number[][] {
  const nexus = swap ? n : m,
    copies = swap ? m : n;
  // The reference Pegasus construction has missing bus couplings at nexus sizes 17–24.
  // A K32 nexus contains the requested clique as a subgraph; trim unused chains afterward.
  const width = padded && family === 'pegasus' && nexus > 16 && nexus <= 24 ? 32 : nexus;
  const raw = family === 'chimera' ? chimeraNexus(width, copies) : pegasusNexus(width, copies);
  const result: number[][] = Array.from({ length: m * n }, () => []);
  for (let j = 0; j < copies; j++)
    for (let i = 0; i < nexus; i++) {
      const logical = swap ? j * n + i : i * n + j;
      result[logical] = [
        ...new Set(
          raw[j * width + i].map((q) => {
            const shifted: Coordinate =
              family === 'chimera'
                ? [q[0] + dy, q[1] + dx, q[2], q[3]]
                : [q[0], q[1] + (q[0] ? dy : dx), q[2], q[3] + (q[0] ? dx : dy)];
            return qubitId(family, size, shifted);
          }),
        ),
      ].sort((a, b) => a - b);
    }
  return result;
}
