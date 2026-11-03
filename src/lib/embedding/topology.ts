export type Family = 'chimera' | 'pegasus';
export type Coordinate = [number, number, number, number];
export type Edge = [number, number];
export type Qubit = { id: number; coordinate: Coordinate; x: number; y: number };
export type Hardware = {
  family: Family;
  size: number;
  nodes: Qubit[];
  edges: Edge[];
  byId: Map<number, Qubit>;
  adjacency: Map<number, Set<number>>;
};

// D-Wave's standard offset family (offsets_index=0), fabric_only=True.
// Integer labels follow Ocean's coordinate conversions, so exports use real qubit IDs.
export const PEGASUS_OFFSETS = [
  [2, 2, 2, 2, 10, 10, 10, 10, 6, 6, 6, 6],
  [6, 6, 6, 6, 2, 2, 2, 2, 10, 10, 10, 10],
];

export const edgeKey = (a: number, b: number) => (a < b ? `${a}:${b}` : `${b}:${a}`);

export function qubitId(family: Family, size: number, q: Coordinate): number {
  const [a, b, c, d] = q;
  const valid =
    q.every(Number.isInteger) &&
    (family === 'chimera'
      ? a >= 0 && a < size && b >= 0 && b < size && c >= 0 && c < 2 && d >= 0 && d < 4
      : a >= 0 && a < 2 && b >= 0 && b < size && c >= 0 && c < 12 && d >= 0 && d < size - 1);
  // Reject invalid coordinates before linearization: an out-of-range coordinate can alias
  // a different, valid qubit ID if it is simply converted to an integer.
  if (!valid) throw new Error('The construction extends beyond this hardware graph.');
  return family === 'chimera'
    ? ((a * size + b) * 2 + c) * 4 + d
    : d + (size - 1) * (c + 12 * (b + a * size));
}

export function hardwareGraph(family: Family, size: number): Hardware {
  if (!['chimera', 'pegasus'].includes(family) || !Number.isInteger(size) || size < 2 || size > 16)
    throw new Error('Choose Chimera or Pegasus with size 2–16.');
  const nodes: Qubit[] = [];
  const edges: Edge[] = [];
  const byId = new Map<number, Qubit>();
  const adjacency = new Map<number, Set<number>>();
  const addNode = (coordinate: Coordinate, x: number, y: number) => {
    const id = qubitId(family, size, coordinate);
    const node = { id, coordinate, x, y };
    nodes.push(node);
    byId.set(id, node);
    adjacency.set(id, new Set());
  };
  const addEdge = (a: Coordinate, b: Coordinate) => {
    const x = qubitId(family, size, a),
      y = qubitId(family, size, b);
    if (!byId.has(x) || !byId.has(y) || adjacency.get(x)!.has(y)) return;
    adjacency.get(x)!.add(y);
    adjacency.get(y)!.add(x);
    edges.push(x < y ? [x, y] : [y, x]);
  };
  if (family === 'chimera') {
    for (let row = 0; row < size; row++)
      for (let col = 0; col < size; col++)
        for (let u = 0; u < 2; u++)
          for (let k = 0; k < 4; k++)
            addNode(
              [row, col, u, k],
              col * 12 + (u ? 9 : 1 + k * 1.6),
              row * 12 + (u ? 2 + k * 1.6 : 9),
            );
    for (const {
      coordinate: [r, c, u, k],
    } of nodes) {
      if (u === 0) {
        for (let j = 0; j < 4; j++) addEdge([r, c, 0, k], [r, c, 1, j]);
        if (r + 1 < size) addEdge([r, c, 0, k], [r + 1, c, 0, k]);
      } else if (c + 1 < size) addEdge([r, c, 1, k], [r, c + 1, 1, k]);
    }
  } else {
    for (let u = 0; u < 2; u++)
      for (let w = 0; w < size; w++)
        for (let k = w === 0 ? 2 : 0; k < (w === size - 1 ? 10 : 12); k++)
          for (let z = 0; z < size - 1; z++) {
            const p = k % 2 ? -0.1 : 0.1;
            addNode(
              [u, w, k, z],
              u ? z * 12 + PEGASUS_OFFSETS[1][k] + 5.5 : w * 12 + k + p,
              u ? w * 12 + k + p : z * 12 + PEGASUS_OFFSETS[0][k] + 5.5,
            );
          }
    for (const {
      coordinate: [u, w, k, z],
    } of nodes) {
      if (z + 1 < size - 1) addEdge([u, w, k, z], [u, w, k, z + 1]);
      if (k % 2 === 0) addEdge([u, w, k, z], [u, w, k + 1, z]);
      if (u === 0)
        for (let kk = 0; kk < 12; kk++) {
          const ww = z + Number(kk < PEGASUS_OFFSETS[0][k]);
          const zz = w - Number(k < PEGASUS_OFFSETS[1][kk]);
          if (zz >= 0 && zz < size - 1) addEdge([0, w, k, z], [1, ww, kk, zz]);
        }
    }
  }
  nodes.sort((a, b) => a.id - b.id);
  edges.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  return { family, size, nodes, edges, byId, adjacency };
}

export function logicalEdges(m: number, n: number): Edge[] {
  const edges: Edge[] = [];
  for (let i = 0; i < m; i++)
    for (let j = 0; j < n; j++) {
      for (let k = i + 1; k < m; k++) edges.push([i * n + j, k * n + j]);
      for (let k = j + 1; k < n; k++) edges.push([i * n + j, i * n + k]);
    }
  return edges;
}
