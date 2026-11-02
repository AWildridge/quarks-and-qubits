import { useEffect, useMemo, useRef, useState } from 'react';
import { loadDefaultLhaPdfGrid, type LhaPdfGrid } from '../../lib/lhapdf-grid';
import {
  DEFAULT_SPIN_EXPLORER_SETTINGS,
  WILSON_COEFFICIENTS,
  betaFromMtt,
  integrateSpinExplorer,
  mttBoundsForSqrtS,
  mttFromBeta,
  normalizedSettings,
  steeringEllipsoidFromResult,
  type CoefficientEntry,
  type EftOrder,
  type IntegrationMethod,
  type PhaseObservable,
  type SpinExplorerSettings,
} from '../../lib/spin-calculation';
import {
  exportCanvasToPNG,
  exportHeatmapToSVG,
  exportParametersToJSON,
  getTimestampString,
} from '../../lib/export';
import { Heatmap } from './Heatmap';
import { PhaseSpacePlot } from './PhaseSpacePlot';
import { SteeringEllipsoidPlot } from './SteeringEllipsoidPlot';

const OBSERVABLES: Array<{ label: string; value: PhaseObservable }> = [
  { label: 'Δ entanglement witness', value: 'Delta' },
  { label: 'C_kk', value: 'Ckk' },
  { label: 'C_rr', value: 'Crr' },
  { label: 'C_nn', value: 'Cnn' },
  { label: 'C_rk', value: 'Crk' },
  { label: 'B_1k', value: 'B1k' },
  { label: 'B_1r', value: 'B1r' },
];

function numberValue(value: string, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function Explorer() {
  const [settings, setSettings] = useState<SpinExplorerSettings>(DEFAULT_SPIN_EXPLORER_SETTINGS);
  const [pdfGrid, setPdfGrid] = useState<LhaPdfGrid | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const phaseRef = useRef<HTMLDivElement>(null);

  const normalized = useMemo(() => normalizedSettings(settings), [settings]);
  const result = useMemo(
    () => integrateSpinExplorer(normalized, pdfGrid ?? undefined),
    [normalized, pdfGrid],
  );
  const ellipsoid = useMemo(() => steeringEllipsoidFromResult(result), [result]);
  const mttBounds = mttBoundsForSqrtS(normalized.sqrtS);
  const mttMinTev = mttFromBeta(normalized.betaMin) / 1000;
  const mttMaxTev = mttFromBeta(normalized.betaMax) / 1000;
  const maxMttTev = mttBounds.max / 1000;

  useEffect(() => {
    let cancelled = false;
    loadDefaultLhaPdfGrid()
      .then((grid) => {
        if (!cancelled) setPdfGrid(grid);
      })
      .catch((error: unknown) => {
        if (!cancelled)
          setPdfError(error instanceof Error ? error.message : 'Failed to load reference data');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const update = <K extends keyof SpinExplorerSettings>(key: K, value: SpinExplorerSettings[K]) => {
    setSettings((current) => normalizedSettings({ ...current, [key]: value }));
  };

  const updateCoefficient = (index: number, patch: Partial<CoefficientEntry>) => {
    setSettings((current) => {
      const coefficients = current.coefficients.map((entry, i) =>
        i === index ? { ...entry, ...patch } : entry,
      );
      return { ...current, coefficients };
    });
  };

  const addCoefficient = () => {
    setSettings((current) => ({
      ...current,
      coefficients: [...current.coefficients, { name: 'cQq83', value: 0 }],
    }));
  };

  const removeCoefficient = (index: number) => {
    setSettings((current) => ({
      ...current,
      coefficients:
        current.coefficients.length > 1
          ? current.coefficients.filter((_, i) => i !== index)
          : current.coefficients,
    }));
  };

  const handleExportPNG = () => {
    const canvas = phaseRef.current?.querySelector('canvas');
    if (canvas) exportCanvasToPNG(canvas, `spin-phase-space-${getTimestampString()}.png`);
  };

  const handleExportSVG = () => {
    exportHeatmapToSVG(result.matrix, `spin-correlation-${getTimestampString()}.svg`);
  };

  const handleExportJSON = () => {
    exportParametersToJSON(normalized, result.matrix, `spin-explorer-${getTimestampString()}.json`);
  };

  return (
    <div className="space-y-8">
      <section className="grid gap-5 rounded border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900 sm:p-5 lg:grid-cols-3">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-950 dark:text-gray-50">Integration</h2>
          <div className="rounded border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300">
            {pdfGrid
              ? 'Reference data loaded'
              : pdfError
                ? `Reference data unavailable: ${pdfError}`
                : 'Loading reference data'}
          </div>

          <div>
            <label
              htmlFor="sqrt-s"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Center-of-mass energy √s (TeV)
            </label>
            <input
              id="sqrt-s"
              type="number"
              min={2}
              max={100}
              step={0.1}
              value={Number((normalized.sqrtS / 1000).toFixed(3))}
              onChange={(event) =>
                update('sqrtS', numberValue(event.target.value, normalized.sqrtS / 1000) * 1000)
              }
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-950 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-gray-600 dark:bg-gray-950 dark:text-gray-50"
            />
          </div>

          <div>
            <label
              htmlFor="integration-method"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Integration method
            </label>
            <select
              id="integration-method"
              value={normalized.method}
              onChange={(event) => update('method', event.target.value as IntegrationMethod)}
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-950 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-gray-600 dark:bg-gray-950 dark:text-gray-50"
            >
              <option value="gl">Gauss-Legendre</option>
              <option value="rect">Rectangular midpoint</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="n-beta"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                m(ttbar) points
              </label>
              <input
                id="n-beta"
                type="number"
                min={8}
                max={96}
                value={normalized.nBeta}
                onChange={(event) =>
                  update('nBeta', numberValue(event.target.value, normalized.nBeta))
                }
                className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-950 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-gray-600 dark:bg-gray-950 dark:text-gray-50"
              />
            </div>
            <div>
              <label
                htmlFor="n-z"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                cos(θ*) points
              </label>
              <input
                id="n-z"
                type="number"
                min={8}
                max={96}
                value={normalized.nZ}
                onChange={(event) => update('nZ', numberValue(event.target.value, normalized.nZ))}
                className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-950 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-gray-600 dark:bg-gray-950 dark:text-gray-50"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-950 dark:text-gray-50">Phase Space</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="mtt-min"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                m(ttbar) min (TeV)
              </label>
              <input
                id="mtt-min"
                type="number"
                min={mttBounds.min / 1000}
                max={maxMttTev}
                step={0.01}
                value={Number(mttMinTev.toFixed(3))}
                onChange={(event) =>
                  update('betaMin', betaFromMtt(numberValue(event.target.value, mttMinTev) * 1000))
                }
                className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-950 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-gray-600 dark:bg-gray-950 dark:text-gray-50"
              />
            </div>
            <div>
              <label
                htmlFor="mtt-max"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                m(ttbar) max (TeV)
              </label>
              <input
                id="mtt-max"
                type="number"
                min={mttBounds.min / 1000}
                max={maxMttTev}
                step={0.01}
                value={Number(mttMaxTev.toFixed(3))}
                onChange={(event) =>
                  update('betaMax', betaFromMtt(numberValue(event.target.value, mttMaxTev) * 1000))
                }
                className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-950 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-gray-600 dark:bg-gray-950 dark:text-gray-50"
              />
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                ≤ {maxMttTev.toFixed(2)} TeV
              </div>
            </div>
            <div>
              <label
                htmlFor="z-min"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                cos(θ*) min
              </label>
              <input
                id="z-min"
                type="number"
                min={-1}
                max={0.99}
                step={0.01}
                value={normalized.zMin}
                onChange={(event) =>
                  update('zMin', numberValue(event.target.value, normalized.zMin))
                }
                className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-950 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-gray-600 dark:bg-gray-950 dark:text-gray-50"
              />
            </div>
            <div>
              <label
                htmlFor="z-max"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                cos(θ*) max
              </label>
              <input
                id="z-max"
                type="number"
                min={-0.99}
                max={1}
                step={0.01}
                value={normalized.zMax}
                onChange={(event) =>
                  update('zMax', numberValue(event.target.value, normalized.zMax))
                }
                className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-950 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-gray-600 dark:bg-gray-950 dark:text-gray-50"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="phase-observable"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Phase-space observable
            </label>
            <select
              id="phase-observable"
              value={normalized.observable}
              onChange={(event) => update('observable', event.target.value as PhaseObservable)}
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-950 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-gray-600 dark:bg-gray-950 dark:text-gray-50"
            >
              {OBSERVABLES.map((observable) => (
                <option key={observable.value} value={observable.value}>
                  {observable.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-950 dark:text-gray-50">SMEFT</h2>
          <div>
            <label
              htmlFor="eft-order"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              EFT order
            </label>
            <select
              id="eft-order"
              value={normalized.eftOrder}
              onChange={(event) => update('eftOrder', Number(event.target.value) as EftOrder)}
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-950 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-gray-600 dark:bg-gray-950 dark:text-gray-50"
            >
              <option value={0}>SM</option>
              <option value={1}>SM + linear</option>
              <option value={2}>SM + linear + quadratic</option>
            </select>
          </div>

          <div className="space-y-3">
            {normalized.coefficients.map((entry, index) => (
              <div
                key={`${entry.name}-${index}`}
                className="grid grid-cols-[minmax(0,1fr)_7rem_2.5rem] gap-2"
              >
                <label htmlFor={`wilson-coefficient-${index}`} className="sr-only">
                  Wilson coefficient
                </label>
                <select
                  id={`wilson-coefficient-${index}`}
                  value={entry.name}
                  onChange={(event) => updateCoefficient(index, { name: event.target.value })}
                  className="min-w-0 rounded border border-gray-300 bg-white px-3 py-2 text-gray-950 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-gray-600 dark:bg-gray-950 dark:text-gray-50"
                >
                  {WILSON_COEFFICIENTS.map((coefficient) => (
                    <option key={coefficient} value={coefficient}>
                      {coefficient}
                    </option>
                  ))}
                </select>
                <label htmlFor={`wilson-value-${index}`} className="sr-only">
                  Wilson value
                </label>
                <input
                  id={`wilson-value-${index}`}
                  type="number"
                  step="0.000001"
                  value={entry.value}
                  onChange={(event) =>
                    updateCoefficient(index, { value: numberValue(event.target.value, 0) })
                  }
                  className="min-w-0 rounded border border-gray-300 bg-white px-3 py-2 text-gray-950 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-gray-600 dark:bg-gray-950 dark:text-gray-50"
                />
                <button
                  type="button"
                  onClick={() => removeCoefficient(index)}
                  className="rounded border border-gray-300 bg-white px-2 py-2 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-gray-600 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-gray-800"
                  aria-label={`Remove ${entry.name}`}
                >
                  -
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addCoefficient}
              className="rounded bg-teal-700 px-3 py-2 text-sm font-medium text-white hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              Add coefficient
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['sigma weight', result.sigma.toExponential(3), 'metric-sigma'],
          ['Delta', result.Delta.toFixed(4), 'metric-delta'],
          ['C_kk', result.Ckk.toFixed(4), 'metric-ckk'],
          ['C_rk', result.Crk.toFixed(4), 'metric-crk'],
          ['C_kr', result.Ckr.toFixed(4), 'metric-ckr'],
          ['C_rr + C_nn', (result.Crr + result.Cnn).toFixed(4), 'metric-crr-cnn'],
        ].map(([label, value, testId]) => (
          <div
            key={label}
            className="rounded border border-gray-200 p-4 dark:border-gray-700"
            data-testid={testId}
          >
            <div className="text-sm text-gray-600 dark:text-gray-400">{label}</div>
            <div className="mt-1 font-mono text-xl text-gray-950 dark:text-gray-50">{value}</div>
          </div>
        ))}
      </section>

      <section ref={phaseRef}>
        <h2 className="mb-3 text-xl font-semibold text-gray-950 dark:text-gray-50">Phase Space</h2>
        <PhaseSpacePlot result={result} observable={normalized.observable} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-xl font-semibold text-gray-950 dark:text-gray-50">
            Integrated Matrix
          </h2>
          <Heatmap matrix={result.matrix} />
        </div>
        <div>
          <h2 className="mb-3 text-xl font-semibold text-gray-950 dark:text-gray-50">
            Steering Ellipsoid
          </h2>
          <SteeringEllipsoidPlot ellipsoid={ellipsoid} />
        </div>
      </section>

      <section className="rounded border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-3 text-lg font-semibold text-gray-950 dark:text-gray-50">Export</h2>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleExportPNG}
            className="rounded bg-teal-700 px-4 py-2 text-white hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            Export PNG
          </button>
          <button
            type="button"
            onClick={handleExportSVG}
            className="rounded bg-teal-700 px-4 py-2 text-white hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            Export SVG
          </button>
          <button
            type="button"
            onClick={handleExportJSON}
            className="rounded bg-gray-800 px-4 py-2 text-white hover:bg-gray-950 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:bg-gray-200 dark:text-gray-950 dark:hover:bg-white"
          >
            Export JSON
          </button>
        </div>
      </section>

      <div className="sr-only" aria-live="polite" aria-atomic="true">
        spin integration at {(normalized.sqrtS / 1000).toFixed(1)} TeV, {normalized.method}, Delta{' '}
        {result.Delta.toFixed(4)}, C kk {result.Ckk.toFixed(4)}
      </div>
    </div>
  );
}
