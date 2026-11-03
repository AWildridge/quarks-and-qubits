import {
  edgeKey,
  hardwareGraph,
  logicalEdges,
  type Edge,
  type Family,
  type Hardware,
} from './topology.ts';
import { templateEmbedding } from './templates.ts';

export type Problem = { family: Family; size: number; m: number; n: number };
export type Defects = { qubits: number[]; couplings: Edge[] };
export type Validation = {
  valid: boolean;
  missingQubits: number[];
  overlaps: number[];
  emptyChains: number[];
  disconnected: number[];
  missingEdges: Edge[];
  physicalQubits: number;
  maxChain: number;
  meanChain: number;
};
export type EmbeddingResult = {
  chains: number[][];
  validation: Validation;
  method: 'cpcg' | 'repaired' | 'relocated' | 'none';
  message: string;
  attempts: number;
  elapsedMs: number;
};

export function activeAdjacency(hardware: Hardware, defects: Defects) {
  const disabled = new Set(defects.qubits);
  const couplings = new Set(defects.couplings.map(([a, b]) => edgeKey(a, b)));
  return new Map(
    hardware.nodes
      .filter((q) => !disabled.has(q.id))
      .map((q) => [
        q.id,
        new Set(
          [...hardware.adjacency.get(q.id)!].filter(
            (v) => !disabled.has(v) && !couplings.has(edgeKey(q.id, v)),
          ),
        ),
      ]),
  );
}

function components(chain: number[], adjacency: Map<number, Set<number>>) {
  const unseen = new Set(chain.filter((q) => adjacency.has(q)));
  const groups: number[][] = [];
  while (unseen.size) {
    const group = [unseen.values().next().value!];
    unseen.delete(group[0]);
    for (let i = 0; i < group.length; i++)
      for (const v of adjacency.get(group[i]) || []) {
        if (unseen.delete(v)) group.push(v);
      }
    groups.push(group);
  }
  return groups;
}

export function validateEmbedding(
  chains: number[][],
  m: number,
  n: number,
  adjacency: Map<number, Set<number>>,
): Validation {
  const owners = new Map<number, number>(),
    missing = new Set<number>(),
    overlaps = new Set<number>();
  const emptyChains: number[] = [],
    disconnected: number[] = [];
  for (let i = 0; i < m * n; i++) {
    const chain = chains[i] || [];
    if (!chain.length) emptyChains.push(i);
    const seen = new Set<number>();
    for (const q of chain) {
      if (!adjacency.has(q)) missing.add(q);
      if (owners.has(q) || seen.has(q)) overlaps.add(q);
      owners.set(q, i);
      seen.add(q);
    }
    if (chain.length && components(chain, adjacency).length !== 1) disconnected.push(i);
  }
  const realized = new Set<string>();
  for (const [q, a] of owners)
    for (const v of adjacency.get(q) || []) {
      const b = owners.get(v);
      if (b !== undefined && a !== b) realized.add(edgeKey(a, b));
    }
  const missingEdges = logicalEdges(m, n).filter(([a, b]) => !realized.has(edgeKey(a, b)));
  const lengths = chains.map((c) => c.length),
    total = lengths.reduce((a, b) => a + b, 0);
  return {
    valid:
      chains.length === m * n &&
      !missing.size &&
      !overlaps.size &&
      !emptyChains.length &&
      !disconnected.length &&
      !missingEdges.length,
    missingQubits: [...missing],
    overlaps: [...overlaps],
    emptyChains,
    disconnected,
    missingEdges,
    physicalQubits: owners.size,
    maxChain: Math.max(0, ...lengths),
    meanChain: total / (m * n),
  };
}

function repairEmbedding(
  seed: number[][],
  problem: Problem,
  adjacency: Map<number, Set<number>>,
  deadline: number,
) {
  const chains = seed.map((chain) => chain.filter((q) => adjacency.has(q)));
  const owners = new Map<number, number>();
  for (const [i, chain] of chains.entries())
    for (const q of chain) {
      if (owners.has(q)) return null;
      owners.set(q, i);
    }
  if (chains.some((c) => !c.length)) return null;
  // Shortest paths may use unused, functioning qubits. Another logical chain is never
  // traversed or borrowed. The target endpoint remains owned by its original chain.
  const route = (starts: number[], targets: Set<number>, owner: number): number[] | null => {
    if (Date.now() > deadline) return null;
    const queue = [...starts],
      previous = new Map(starts.map((q) => [q, -1]));
    for (let i = 0; i < queue.length; i++) {
      const q = queue[i];
      if (targets.has(q)) {
        const path = [q];
        while (previous.get(path[path.length - 1]) !== -1)
          path.push(previous.get(path[path.length - 1])!);
        return path.reverse();
      }
      for (const v of adjacency.get(q) || []) {
        if (previous.has(v) || (owners.has(v) && owners.get(v) !== owner && !targets.has(v)))
          continue;
        previous.set(v, q);
        queue.push(v);
      }
    }
    return null;
  };
  const add = (i: number, path: number[]) => {
    for (const q of path)
      if (!owners.has(q)) {
        chains[i].push(q);
        owners.set(q, i);
      }
  };
  for (const [i, chain] of chains.entries()) {
    let groups = components(chain, adjacency);
    while (groups.length > 1) {
      const path = route(groups[0], new Set(groups.slice(1).flat()), i);
      if (!path) return null;
      add(i, path);
      groups = components(chains[i], adjacency);
    }
  }
  for (const [a, b] of logicalEdges(problem.m, problem.n)) {
    if (Date.now() > deadline) return null;
    if (chains[a].some((q) => [...adjacency.get(q)!].some((v) => owners.get(v) === b))) continue;
    const path = route(chains[a], new Set(chains[b]), a);
    if (!path) return null;
    add(a, path.slice(0, -1));
  }
  return chains.map((chain) => chain.sort((a, b) => a - b));
}

export function solveEmbedding(
  problem: Problem,
  defects: Defects = { qubits: [], couplings: [] },
  budgetMs = 1800,
): EmbeddingResult {
  const start = Date.now(),
    deadline = start + budgetMs;
  const { family, size, m, n } = problem;
  if (![m, n].every((x) => Number.isInteger(x) && x >= 2 && x <= 32))
    throw new Error('Clique sizes must be whole numbers from 2 to 32.');
  const hardware = hardwareGraph(family, size),
    adjacency = activeAdjacency(hardware, defects);
  let attempts = 0,
    example: number[][] = [];
  const finish = (
    chains: number[][],
    method: EmbeddingResult['method'],
    message: string,
  ): EmbeddingResult => ({
    chains,
    validation: validateEmbedding(chains, m, n, adjacency),
    method,
    message,
    attempts,
    elapsedMs: Date.now() - start,
  });
  const candidates: number[][][] = [];
  for (const swap of [false, true])
    for (const padded of [false, true]) {
      if (padded && (family !== 'pegasus' || (swap ? n : m) <= 16 || (swap ? n : m) > 24)) continue;
      try {
        const seed = templateEmbedding(family, size, m, n, swap, 0, 0, padded);
        if (seed.every((chain) => chain.every((q) => hardware.byId.has(q)))) candidates.push(seed);
      } catch {
        /* This orientation does not fit the hardware. Try the other one. */
      }
    }
  candidates.sort((a, b) => a.flat().length - b.flat().length);
  for (const seed of candidates) {
    attempts++;
    if (!example.length) example = seed;
    if (validateEmbedding(seed, m, n, adjacency).valid)
      return finish(seed, 'cpcg', 'Verified CPCG embedding');
  }
  if (adjacency.size < m * n)
    return finish(example, 'none', 'Too few functioning qubits for this logical graph.');
  for (const seed of candidates) {
    const repaired = repairEmbedding(seed, problem, adjacency, deadline);
    if (repaired && validateEmbedding(repaired, m, n, adjacency).valid)
      return finish(repaired, 'repaired', 'Verified embedding after rerouting chains');
  }
  // Like the original Chimera implementation, scan alternative placements and both nexus
  // orientations. A bounded unsuccessful search must never be described as a proof of impossibility.
  for (let distance = 1; distance < 2 * size && Date.now() < deadline; distance++)
    for (let dx = 0; dx <= distance && Date.now() < deadline; dx++) {
      const dy = distance - dx;
      if (dx >= size || dy >= size) continue;
      for (const swap of [false, true]) {
        if (Date.now() > deadline) break;
        try {
          const seed = templateEmbedding(family, size, m, n, swap, dx, dy, true);
          if (!seed.every((chain) => chain.every((q) => hardware.byId.has(q)))) continue;
          attempts++;
          if (validateEmbedding(seed, m, n, adjacency).valid)
            return finish(seed, 'relocated', 'Verified embedding at a new hardware location');
          const repaired = repairEmbedding(seed, problem, adjacency, deadline);
          if (repaired && validateEmbedding(repaired, m, n, adjacency).valid)
            return finish(
              repaired,
              'relocated',
              'Verified embedding after relocation and rerouting',
            );
        } catch {
          /* Placement exceeds the finite hardware graph. */
        }
      }
    }
  return finish(
    example,
    'none',
    'No verified embedding found. Try a larger graph or restore hardware.',
  );
}

export function exportEmbedding(problem: Problem, defects: Defects, result: EmbeddingResult) {
  const hardware = hardwareGraph(problem.family, problem.size);
  const validation = validateEmbedding(
    result.chains,
    problem.m,
    problem.n,
    activeAdjacency(hardware, defects),
  );
  if (!validation.valid) throw new Error('Only a verified embedding can be exported.');
  return {
    schema: 'quarks-and-qubits/cpcg-embedding@1',
    graph: {
      type: 'cartesian-product-of-complete-graphs',
      m: problem.m,
      n: problem.n,
      nodes: problem.m * problem.n,
      edges: logicalEdges(problem.m, problem.n),
    },
    hardware: {
      family: problem.family,
      size: problem.size,
      ...(problem.family === 'pegasus' ? { offsetsIndex: 0, fabricOnly: true } : { tile: 4 }),
      labelConvention: 'dwave-ocean-linear',
    },
    disabled: defects,
    mapping: result.chains.map((chain, i) => ({
      logical: [Math.floor(i / problem.n), i % problem.n],
      chain,
      coordinates: chain.map((q) => hardware.byId.get(q)!.coordinate),
    })),
    validation,
    method: result.method,
    reference: {
      repository: 'AWildridge/PrimaryVertexing',
      commit: '2eee5972bf8a459286b3ef3712df4f70c53bb039',
    },
  };
}
