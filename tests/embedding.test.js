import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { hardwareGraph, logicalEdges, qubitId } from '../src/lib/embedding/topology.ts';
import { templateEmbedding } from '../src/lib/embedding/templates.ts';
import {
  activeAdjacency,
  validateEmbedding,
  solveEmbedding,
  exportEmbedding,
} from '../src/lib/embedding/solver.ts';

const reference = JSON.parse(
  readFileSync(new URL('./fixtures/embedding-reference.json', import.meta.url)),
);

test('hardware nodes and every coupling match independently generated D-Wave graphs', () => {
  for (const fixture of reference.topologies) {
    const graph = hardwareGraph(fixture.family, fixture.size);
    const hash = createHash('sha256')
      .update(JSON.stringify({ nodes: graph.nodes.map((q) => q.id), edges: graph.edges }))
      .digest('hex');
    assert.equal(hash, fixture.sha256, `${fixture.family} ${fixture.size}`);
    assert.equal(graph.nodes.length, fixture.nodes);
    assert.equal(graph.edges.length, fixture.edges);
  }
});

test('CPCG ports match PrimaryVertexing chains, including a reference case with missing Pegasus edges', () => {
  for (const fixture of reference.embeddings) {
    const { family, size, m, n } = fixture;
    const chains = templateEmbedding(family, size, m, n);
    assert.deepEqual(chains, fixture.chains, `${family} K${m} × K${n}`);
    assert.equal(
      validateEmbedding(chains, m, n, hardwareGraph(family, size).adjacency).valid,
      fixture.valid,
    );
    const solution = solveEmbedding(fixture);
    assert.equal(solution.validation.valid, true, `Corrected ${family} K${m} × K${n}`);
  }
});

test('the logical graph is a Cartesian product with row and column cliques', () => {
  const edges = logicalEdges(3, 5);
  assert.equal(edges.length, 45);
  for (let a = 0; a < 15; a++)
    for (let b = a + 1; b < 15; b++) {
      const expected = Math.floor(a / 5) === Math.floor(b / 5) || a % 5 === b % 5;
      assert.equal(
        edges.some(([u, v]) => u === a && v === b),
        expected,
      );
    }
});

test('out-of-range coordinates cannot alias valid qubit labels', () => {
  assert.throws(() => qubitId('pegasus', 6, [0, 0, 4, 5]), /beyond/);
  assert.throws(() => qubitId('chimera', 8, [-1, 9, 0, 0]), /beyond/);
  assert.throws(
    () => solveEmbedding({ family: 'pegasus', size: 6, m: 3.5, n: 4 }),
    /whole numbers/,
  );
});

for (const family of ['chimera', 'pegasus']) {
  const problem = { family, size: 8, m: 8, n: 3 };
  test(`${family}: disabled used qubits trigger a real, verified repair and export excludes them`, () => {
    const initial = solveEmbedding(problem);
    const removed = initial.chains[0][0];
    const defects = { qubits: [removed], couplings: [] };
    const graph = hardwareGraph(family, 8);
    assert.equal(
      validateEmbedding(initial.chains, 8, 3, activeAdjacency(graph, defects)).valid,
      false,
    );
    const repaired = solveEmbedding(problem, defects);
    assert.equal(repaired.validation.valid, true);
    assert.ok(!repaired.chains.flat().includes(removed));
    assert.notDeepEqual(repaired.chains, initial.chains);
    const data = exportEmbedding(problem, defects, repaired);
    assert.equal(data.mapping.length, 24);
    assert.deepEqual(data.disabled, defects);
    assert.equal(data.graph.edges.length, 108);
  });
  test(`${family}: a broken physical chain is detected and rerouted using existing couplings`, () => {
    const initial = solveEmbedding(problem),
      graph = hardwareGraph(family, 8);
    const chain = new Set(initial.chains[0]);
    const possible = graph.edges.filter(([a, b]) => chain.has(a) && chain.has(b));
    const edge = possible.find(
      (e) =>
        !validateEmbedding(
          initial.chains,
          8,
          3,
          activeAdjacency(graph, { qubits: [], couplings: [e] }),
        ).valid,
    );
    assert.ok(edge, 'A chain bridge exists in this construction');
    const defects = { qubits: [], couplings: [edge] };
    const repaired = solveEmbedding(problem, defects);
    assert.equal(repaired.validation.valid, true);
    assert.notDeepEqual(repaired.chains, initial.chains);
    assert.equal(
      validateEmbedding(repaired.chains, 8, 3, activeAdjacency(graph, defects)).valid,
      true,
    );
  });
  test(`${family}: missing logical couplings and overlapping chains cannot pass validation`, () => {
    const initial = solveEmbedding(problem),
      graph = hardwareGraph(family, 8);
    const a = new Set(initial.chains[0]),
      b = new Set(initial.chains[1]);
    const removed = graph.edges.filter(
      ([u, v]) => (a.has(u) && b.has(v)) || (a.has(v) && b.has(u)),
    );
    assert.ok(removed.length);
    const check = validateEmbedding(
      initial.chains,
      8,
      3,
      activeAdjacency(graph, { qubits: [], couplings: removed }),
    );
    assert.equal(check.valid, false);
    assert.ok(check.missingEdges.some(([u, v]) => u === 0 && v === 1));
    const overlap = initial.chains.map((c) => [...c]);
    overlap[1].push(overlap[0][0]);
    assert.equal(validateEmbedding(overlap, 8, 3, graph.adjacency).valid, false);
  });
  test(`${family}: disconnected hardware fails honestly and cannot be exported`, () => {
    const p = { ...problem, size: 4, m: 3, n: 3 },
      graph = hardwareGraph(family, 4);
    const defects = { qubits: [], couplings: graph.edges };
    const result = solveEmbedding(p, defects);
    assert.equal(result.validation.valid, false);
    assert.equal(result.method, 'none');
    assert.throws(() => exportEmbedding(p, defects, result), /Only a verified/);
  });
}
