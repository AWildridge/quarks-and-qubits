interface LhaSubgrid {
  x: number[];
  q: number[];
  logX: number[];
  logQ: number[];
  flavors: number[];
  values: number[];
}

export interface LhaPdfGrid {
  setName: string;
  member: number;
  subgrids: LhaSubgrid[];
}

function lowerIndex(values: number[], target: number): number {
  if (target <= values[0]) return 0;
  if (target >= values[values.length - 1]) return values.length - 2;
  let low = 0;
  let high = values.length - 1;
  while (high - low > 1) {
    const mid = Math.floor((low + high) / 2);
    if (values[mid] <= target) low = mid;
    else high = mid;
  }
  return low;
}

function parseNumberLine(line: string): number[] {
  return line.trim().split(/\s+/).filter(Boolean).map(Number);
}

export function parseLhaGrid(text: string, setName = 'NNPDF31_lo_as_0118', member = 0): LhaPdfGrid {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const subgrids: LhaSubgrid[] = [];
  let i = 0;

  while (i < lines.length) {
    if (lines[i] !== '---') {
      i += 1;
      continue;
    }
    i += 1;
    if (i >= lines.length || lines[i] === '---') break;

    const x = parseNumberLine(lines[i]);
    const q = parseNumberLine(lines[i + 1]);
    const flavors = parseNumberLine(lines[i + 2]).map((value) => Math.trunc(value));
    i += 3;

    const values: number[] = [];
    const expectedRows = x.length * q.length;
    for (
      let row = 0;
      row < expectedRows && i < lines.length && lines[i] !== '---';
      row += 1, i += 1
    ) {
      values.push(...parseNumberLine(lines[i]));
    }
    subgrids.push({ x, q, logX: x.map(Math.log), logQ: q.map(Math.log), flavors, values });
  }

  if (!subgrids.length) {
    throw new Error('No LHAPDF subgrids found');
  }

  return { setName, member, subgrids };
}

export async function loadDefaultLhaPdfGrid(): Promise<LhaPdfGrid> {
  const response = await fetch('/lhapdf/NNPDF31_lo_as_0118_0000.dat');
  if (!response.ok) {
    throw new Error(`Failed to load LHAPDF grid: ${response.status}`);
  }
  return parseLhaGrid(await response.text());
}

export function xfxQ(grid: LhaPdfGrid, pid: number, xInput: number, qInput: number): number {
  if (xInput <= 0 || xInput > 1 || qInput <= 0) return 0;
  const subgrid =
    grid.subgrids.find(
      (candidate) =>
        qInput >= candidate.q[0] &&
        qInput <= candidate.q[candidate.q.length - 1] &&
        xInput >= candidate.x[0] &&
        xInput <= candidate.x[candidate.x.length - 1],
    ) ?? grid.subgrids[grid.subgrids.length - 1];
  const flavorIndex = subgrid.flavors.indexOf(pid);
  if (flavorIndex < 0) return 0;

  const x = Math.min(Math.max(xInput, subgrid.x[0]), subgrid.x[subgrid.x.length - 1]);
  const q = Math.min(Math.max(qInput, subgrid.q[0]), subgrid.q[subgrid.q.length - 1]);
  const logX = Math.log(x);
  const logQ = Math.log(q);
  const ix = lowerIndex(subgrid.logX, logX);
  const iq = lowerIndex(subgrid.logQ, logQ);
  const tx = (logX - subgrid.logX[ix]) / (subgrid.logX[ix + 1] - subgrid.logX[ix] || 1);
  const tq = (logQ - subgrid.logQ[iq]) / (subgrid.logQ[iq + 1] - subgrid.logQ[iq] || 1);
  const strideFlavor = subgrid.flavors.length;
  const strideQ = subgrid.q.length * strideFlavor;
  const at = (xIndex: number, qIndex: number) =>
    subgrid.values[xIndex * strideQ + qIndex * strideFlavor + flavorIndex] ?? 0;

  const v00 = at(ix, iq);
  const v10 = at(ix + 1, iq);
  const v01 = at(ix, iq + 1);
  const v11 = at(ix + 1, iq + 1);
  return (1 - tx) * (1 - tq) * v00 + tx * (1 - tq) * v10 + (1 - tx) * tq * v01 + tx * tq * v11;
}

export function fPid(grid: LhaPdfGrid, pid: number, x: number, q: number): number {
  if (x <= 0 || x > 1) return 0;
  return xfxQ(grid, pid, x, q) / x;
}
