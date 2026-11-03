import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import {
  activeAdjacency,
  validateEmbedding,
  type Problem,
  type Defects,
} from '../src/lib/embedding/solver';
import { hardwareGraph, type Edge, type Coordinate } from '../src/lib/embedding/topology';

type Exported = {
  graph: { type: string; m: number; n: number; nodes: number; edges: Edge[] };
  hardware: { family: Problem['family']; size: number };
  disabled: Defects;
  mapping: Array<{ logical: number[]; chain: number[]; coordinates: Coordinate[] }>;
  validation: { valid: boolean };
  schema: string;
};
async function download(page: Page): Promise<Exported> {
  await expect(page.getByTestId('embedding-status')).toHaveAttribute('data-valid', 'true');
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export verified embedding' }).click();
  const file = await pending;
  const data = JSON.parse(await readFile((await file.path())!, 'utf8')) as Exported;
  const hardware = hardwareGraph(data.hardware.family, data.hardware.size);
  expect(
    validateEmbedding(
      data.mapping.map((x) => x.chain),
      data.graph.m,
      data.graph.n,
      activeAdjacency(hardware, data.disabled),
    ).valid,
  ).toBe(true);
  expect(data.mapping.every((x) => x.coordinates.length === x.chain.length)).toBe(true);
  return data;
}

for (const family of ['pegasus', 'chimera'] as const) {
  test(`${family} CPCG controls and exports describe actual Cartesian-product embeddings`, async ({
    page,
  }) => {
    await page.goto('/demos/cpcg-embedding/');
    await expect(page.getByTestId('embedding-status')).toHaveAttribute('data-valid', 'true');
    await page.getByLabel('Hardware topology').selectOption(family);
    await page.getByLabel('First clique (m)', { exact: true }).fill('3');
    await page.getByLabel('Second clique (n)', { exact: true }).fill('5');
    await page.getByRole('button', { name: 'Build embedding', exact: true }).click();
    await expect(page.locator('#logical-count')).toHaveText('15');
    const data = await download(page);
    expect(data.schema).toBe('quarks-and-qubits/cpcg-embedding@1');
    expect(data.graph.type).toBe('cartesian-product-of-complete-graphs');
    expect(data.graph.edges).toHaveLength(45);
    expect(data.mapping).toHaveLength(15);
    expect(data.hardware.family).toBe(family);
  });
  test(`${family} qubit and coupling removal trigger verified repairs; undo restores hardware`, async ({
    page,
  }) => {
    await page.goto('/demos/cpcg-embedding/');
    await expect(page.getByTestId('embedding-status')).toHaveAttribute('data-valid', 'true');
    await page.getByLabel('Hardware topology').selectOption(family);
    const original = await download(page);
    const qubit = original.mapping[0].chain[0];
    await page.getByLabel('Qubit ID', { exact: true }).fill(String(qubit));
    await page.getByRole('button', { name: 'Toggle qubit', exact: true }).click();
    await expect(page.locator('#defect-count')).toHaveText(
      '1 disabled qubits · 0 disabled couplings',
    );
    const repaired = await download(page);
    expect(repaired.disabled.qubits).toEqual([qubit]);
    expect(repaired.mapping.flatMap((x) => x.chain)).not.toContain(qubit);
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect(page.locator('#defect-count')).toContainText('0 disabled qubits');
    const graph = hardwareGraph(original.hardware.family, original.hardware.size);
    const chains = original.mapping.map((x) => x.chain),
      first = new Set(chains[0]);
    const edge = graph.edges.find(
      (e) =>
        first.has(e[0]) &&
        first.has(e[1]) &&
        !validateEmbedding(chains, 8, 3, activeAdjacency(graph, { qubits: [], couplings: [e] }))
          .valid,
    )!;
    await page.getByLabel('Coupling start ID', { exact: true }).fill(String(edge[0]));
    await page.getByLabel('Coupling end ID', { exact: true }).fill(String(edge[1]));
    await page.getByRole('button', { name: 'Toggle coupling', exact: true }).click();
    const rerouted = await download(page);
    expect(rerouted.disabled.couplings).toEqual([edge]);
    expect(rerouted.mapping.map((x) => x.chain)).not.toEqual(chains);
    await page.getByRole('button', { name: 'Restore all', exact: true }).click();
    await expect(page.locator('#defect-count')).toHaveText(
      '0 disabled qubits · 0 disabled couplings',
    );
    await download(page);
  });
}

test('capacity failure disables export, invalid edits report an error, and old URL redirects', async ({
  page,
}) => {
  await page.goto('/demos/pegasus-embedder/');
  await page.waitForURL('**/demos/cpcg-embedding/');
  await expect(page.getByTestId('embedding-status')).toHaveAttribute('data-valid', 'true');
  await page.getByLabel('Qubit ID', { exact: true }).fill('999999');
  await page.getByRole('button', { name: 'Toggle qubit', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('exists in this hardware graph');
  await expect(page.locator('#defect-count')).toContainText('0 disabled qubits');
  await page.getByLabel('Hardware size').selectOption('2');
  await page.getByLabel('First clique (m)', { exact: true }).fill('32');
  await page.getByLabel('Second clique (n)', { exact: true }).fill('32');
  await page.getByRole('button', { name: 'Build embedding', exact: true }).click();
  await expect(page.getByTestId('embedding-status')).toHaveAttribute('data-busy', 'false');
  await expect(page.getByTestId('embedding-status')).toHaveAttribute('data-valid', 'false');
  await expect(page.getByRole('button', { name: 'Export verified embedding' })).toBeDisabled();
  await expect(
    page.getByRole('link', { name: 'Unsolved! Wanna solve it? Contact me! ↗' }),
  ).toHaveAttribute('href', /^mailto:anwildri@fnal.gov/);
});

test('mobile embedding controls fit the viewport and remain usable', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/demos/cpcg-embedding/');
  await expect(page.getByTestId('embedding-status')).toHaveAttribute('data-valid', 'true');
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await expect(page.getByLabel('Inspect logical variable')).toBeVisible();
  await page.getByLabel('Inspect logical variable').selectOption('0');
  await expect(page.locator('.chain-readout')).toContainText('Qubits:');
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await page.getByRole('button', { name: 'Fit', exact: true }).click();
});
