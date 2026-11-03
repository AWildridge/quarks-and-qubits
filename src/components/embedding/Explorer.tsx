import { useEffect, useMemo, useState } from 'react';
import HardwareCanvas, { chainColor, type EditMode } from './HardwareCanvas';
import {
  edgeKey,
  hardwareGraph,
  logicalEdges,
  type Edge,
  type Family,
} from '../../lib/embedding/topology';
import {
  exportEmbedding,
  type Defects,
  type EmbeddingResult,
  type Problem,
} from '../../lib/embedding/solver';
import './explorer.css';

const EMPTY: Defects = { qubits: [], couplings: [] };

export default function Explorer() {
  const [problem, setProblem] = useState<Problem>({ family: 'pegasus', size: 6, m: 8, n: 3 });
  const [mInput, setMInput] = useState('8'),
    [nInput, setNInput] = useState('3');
  const [defects, setDefects] = useState<Defects>(EMPTY),
    [history, setHistory] = useState<Defects[]>([]);
  const [result, setResult] = useState<EmbeddingResult | null>(null),
    [running, setBusy] = useState(true);
  const [completedKey, setCompletedKey] = useState('');
  const [error, setError] = useState(''),
    [inputError, setInputError] = useState('');
  const [selected, setSelected] = useState(-1),
    [mode, setMode] = useState<EditMode>('inspect');
  const [showAll, setShowAll] = useState(false),
    [run, setRun] = useState(0);
  const [qubit, setQubit] = useState(''),
    [endpointA, setEndpointA] = useState(''),
    [endpointB, setEndpointB] = useState('');
  const requestKey = JSON.stringify({ problem, defects, run });
  const busy = running || completedKey !== requestKey;
  const hardware = useMemo(
    () => hardwareGraph(problem.family, problem.size),
    [problem.family, problem.size],
  );
  const edges = useMemo(() => logicalEdges(problem.m, problem.n), [problem.m, problem.n]);
  const displayedEdges =
    selected >= 0
      ? edges.filter(([a, b]) => a === selected || b === selected)
      : problem.m * problem.n <= 128
        ? edges
        : [];

  useEffect(() => {
    setBusy(true);
    setError('');
    let active = true;
    const worker = new Worker(new URL('./solver.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = ({ data }: MessageEvent<{ result?: EmbeddingResult; error?: string }>) => {
      if (!active) return;
      setResult(data.result || null);
      setError(data.error || '');
      setCompletedKey(requestKey);
      setBusy(false);
    };
    worker.onerror = () => {
      if (active) {
        setError('The embedding worker could not start. Reload this page to try again.');
        setCompletedKey(requestKey);
        setBusy(false);
      }
    };
    worker.postMessage({ problem, defects });
    return () => {
      active = false;
      worker.terminate();
    };
  }, [problem, defects, run]);

  const edit = (next: Defects) => {
    setHistory((items) => [...items, defects]);
    setDefects(next);
    setInputError('');
  };
  const toggleQubit = (id: number) => {
    if (!Number.isInteger(id) || !hardware.byId.has(id)) {
      setInputError('Enter a qubit ID that exists in this hardware graph.');
      return;
    }
    edit({
      ...defects,
      qubits: defects.qubits.includes(id)
        ? defects.qubits.filter((q) => q !== id)
        : [...defects.qubits, id],
    });
  };
  const toggleCoupling = ([a, b]: Edge) => {
    if (!hardware.adjacency.get(a)?.has(b)) {
      setInputError('Those qubits do not share a hardware coupling.');
      return;
    }
    const key = edgeKey(a, b),
      exists = defects.couplings.some((e) => edgeKey(...e) === key);
    edit({
      ...defects,
      couplings: exists
        ? defects.couplings.filter((e) => edgeKey(...e) !== key)
        : [...defects.couplings, a < b ? [a, b] : [b, a]],
    });
  };
  const changeHardware = (family: Family, size: number) => {
    setProblem((p) => ({ ...p, family, size }));
    setDefects(EMPTY);
    setHistory([]);
    setSelected(-1);
    setQubit('');
    setEndpointA('');
    setEndpointB('');
    setInputError('');
  };
  const valid = !!result?.validation.valid && !busy && !error;
  const lengths = result?.chains.map((chain) => chain.length) || [];
  const histogram = new Map<number, number>();
  for (const length of lengths) histogram.set(length, (histogram.get(length) || 0) + 1);
  const selectedChain = result?.chains[selected] || [];

  return (
    <div className="embedding-explorer">
      <div className="embedding-layout">
        <aside className="embedding-controls" aria-label="Embedding controls">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const m = Number(mInput),
                n = Number(nInput);
              if (![m, n].every((x) => Number.isInteger(x) && x >= 2 && x <= 32)) return;
              setProblem((p) => ({ ...p, m, n }));
              setSelected(-1);
              setRun((value) => value + 1);
            }}
          >
            <p className="eyebrow">01 / Build the problem</p>
            <h2>Two cliques. One product.</h2>
            <div className="clique-inputs">
              <label>
                First clique (m)
                <input
                  id="clique-m"
                  type="number"
                  min="2"
                  max="32"
                  step="1"
                  required
                  value={mInput}
                  onChange={(e) => setMInput(e.target.value)}
                />
              </label>
              <span aria-hidden="true">□</span>
              <label>
                Second clique (n)
                <input
                  id="clique-n"
                  type="number"
                  min="2"
                  max="32"
                  step="1"
                  required
                  value={nInput}
                  onChange={(e) => setNInput(e.target.value)}
                />
              </label>
            </div>
            <p className="field-note">
              Each logical variable connects to every other variable in its row and column.
            </p>
            <label>
              Hardware topology
              <select
                id="hardware-family"
                value={problem.family}
                onChange={(e) => {
                  const family = e.target.value as Family;
                  changeHardware(family, family === 'pegasus' ? 6 : 8);
                }}
              >
                <option value="pegasus">Pegasus</option>
                <option value="chimera">Chimera</option>
              </select>
            </label>
            <label>
              Hardware size
              <select
                id="hardware-size"
                value={problem.size}
                onChange={(e) => changeHardware(problem.family, Number(e.target.value))}
              >
                {[2, 4, 6, 8, 12, 16].map((size) => (
                  <option key={size} value={size}>
                    {problem.family === 'pegasus' ? 'P' : 'C'}
                    {size}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="embedding-primary">
              Build embedding
            </button>
          </form>

          <section className="logical-panel" aria-labelledby="logical-heading">
            <h3 id="logical-heading">
              K<sub>{problem.m}</sub> □ K<sub>{problem.n}</sub>
            </h3>
            <svg
              className="logical-graph"
              viewBox={`0 0 ${Math.max(160, problem.n * 34 + 30)} ${Math.max(100, problem.m * 30 + 30)}`}
              role="img"
              aria-label={`Cartesian product of complete graphs: ${problem.m * problem.n} logical vertices, ${edges.length} logical edges. Select a logical variable using the control below.`}
            >
              <title>Logical CPCG graph</title>
              {displayedEdges.map(([a, b]) => (
                <line
                  key={`${a}-${b}`}
                  x1={20 + (a % problem.n) * 34}
                  y1={20 + Math.floor(a / problem.n) * 30}
                  x2={20 + (b % problem.n) * 34}
                  y2={20 + Math.floor(b / problem.n) * 30}
                  className="logical-edge"
                />
              ))}
              {Array.from({ length: problem.m * problem.n }, (_, i) => (
                <circle
                  key={i}
                  cx={20 + (i % problem.n) * 34}
                  cy={20 + Math.floor(i / problem.n) * 30}
                  r={i === selected ? 7 : 5}
                  fill={chainColor(i, problem.n)}
                  stroke={i === selected ? 'currentColor' : 'none'}
                  strokeWidth="2"
                  onClick={() => setSelected(i === selected ? -1 : i)}
                >
                  <title>{`Logical (${Math.floor(i / problem.n)}, ${i % problem.n})`}</title>
                </circle>
              ))}
            </svg>
            <label>
              Inspect logical variable
              <select value={selected} onChange={(e) => setSelected(Number(e.target.value))}>
                <option value="-1">Show all chains</option>
                {Array.from({ length: problem.m * problem.n }, (_, i) => (
                  <option key={i} value={i}>
                    ({Math.floor(i / problem.n)}, {i % problem.n})
                    {lengths[i] ? ` · ${lengths[i]} qubits` : ''}
                  </option>
                ))}
              </select>
            </label>
            <p className="field-note">
              Colors group rows. Select a variable to isolate its chain and logical couplings.
            </p>
            {selected >= 0 && (
              <p className="chain-readout">
                Qubits: {selectedChain.length ? selectedChain.join(', ') : 'No chain available.'}
              </p>
            )}
          </section>
        </aside>

        <div className="embedding-output">
          <div
            className={`embedding-status ${busy ? 'pending' : valid ? 'valid' : 'failed'}`}
            role="status"
            aria-live="polite"
            data-testid="embedding-status"
            data-valid={valid}
            data-busy={busy}
          >
            <span className="status-symbol" aria-hidden="true">
              {busy ? '…' : valid ? '✓' : '!'}
            </span>
            <div>
              <strong>
                {busy ? 'Finding and checking an embedding…' : error || result?.message}
              </strong>
              <p>
                {busy
                  ? 'Checking chains, qubits, and every required logical coupling.'
                  : valid
                    ? `${problem.m * problem.n} disjoint, connected chains · ${edges.length} / ${edges.length} logical couplings realized`
                    : 'A bounded search can miss an existing embedding; this result does not prove impossibility.'}
              </p>
            </div>
          </div>
          <div className="view-options">
            <label>
              Click action
              <select
                id="edit-mode"
                value={mode}
                onChange={(e) => setMode(e.target.value as EditMode)}
              >
                <option value="inspect">Inspect chains</option>
                <option value="qubits">Remove / restore qubits</option>
                <option value="couplings">Remove / restore couplings</option>
              </select>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showAll}
                onChange={(e) => setShowAll(e.target.checked)}
              />
              Show unused hardware
            </label>
          </div>
          <HardwareCanvas
            key={`${problem.family}:${problem.size}:${problem.m}:${problem.n}`}
            hardware={hardware}
            chains={result?.chains || []}
            defects={defects}
            selected={selected}
            n={problem.n}
            mode={mode}
            showAll={showAll}
            onQubit={toggleQubit}
            onCoupling={toggleCoupling}
            onSelect={setSelected}
          />
          <div className="graph-legend">
            <span>● Colored: logical chains</span>
            <span>— Gray: available couplings</span>
            <span>× Red: disabled hardware</span>
          </div>
          <dl className="embedding-metrics">
            <div>
              <dt>Logical variables</dt>
              <dd id="logical-count">{problem.m * problem.n}</dd>
            </div>
            <div>
              <dt>Qubits used</dt>
              <dd id="physical-count">{valid ? result.validation.physicalQubits : '—'}</dd>
            </div>
            <div>
              <dt>Longest chain</dt>
              <dd>{valid ? result.validation.maxChain : '—'}</dd>
            </div>
            <div>
              <dt>Mean chain length</dt>
              <dd>{valid ? result.validation.meanChain.toFixed(1) : '—'}</dd>
            </div>
          </dl>
          {valid && (
            <p className="chain-distribution">
              Chain lengths:{' '}
              {[...histogram]
                .sort((a, b) => a[0] - b[0])
                .map(([length, count]) => `${count} × ${length}`)
                .join(' · ')}
            </p>
          )}
          {!busy && result && !valid && (
            <p className="failure-details">
              {result.validation.missingQubits.length} unavailable qubits ·{' '}
              {result.validation.emptyChains.length} empty chains ·{' '}
              {result.validation.disconnected.length} disconnected chains ·{' '}
              {result.validation.missingEdges.length} missing logical couplings
            </p>
          )}
          <button
            type="button"
            id="export-mapping"
            className="embedding-secondary"
            disabled={!valid}
            onClick={() => {
              if (!result) return;
              const data = exportEmbedding(problem, defects, result);
              const url = URL.createObjectURL(
                new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
              );
              const link = document.createElement('a');
              link.href = url;
              link.download = `cpcg-${problem.family}-${problem.size}-k${problem.m}-k${problem.n}.json`;
              link.click();
              setTimeout(() => URL.revokeObjectURL(url), 1000);
            }}
          >
            Export verified embedding
          </button>
        </div>
      </div>

      <section className="defect-panel" aria-labelledby="defects-heading">
        <div className="defect-heading">
          <div>
            <p className="eyebrow">02 / Break it. Try again.</p>
            <h2 id="defects-heading">What happens when hardware goes missing?</h2>
            <p>
              Remove a qubit or coupling in the diagram, or enter its ID below. The explorer
              reroutes chains and tries new placements automatically.
            </p>
          </div>
          <div className="defect-actions">
            <button
              type="button"
              disabled={!history.length}
              onClick={() => {
                setDefects(history[history.length - 1]);
                setHistory((items) => items.slice(0, -1));
                setInputError('');
              }}
            >
              Undo
            </button>
            <button
              type="button"
              disabled={!defects.qubits.length && !defects.couplings.length}
              onClick={() => edit(EMPTY)}
            >
              Restore all
            </button>
          </div>
        </div>
        <p id="defect-count" className="defect-count" aria-live="polite">
          {defects.qubits.length} disabled qubits · {defects.couplings.length} disabled couplings
        </p>
        <div className="defect-forms">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              toggleQubit(Number(qubit));
            }}
          >
            <label>
              Qubit ID
              <input
                type="number"
                min="0"
                step="1"
                required
                value={qubit}
                onChange={(e) => setQubit(e.target.value)}
                placeholder="e.g. 20"
              />
            </label>
            <button type="submit">Toggle qubit</button>
          </form>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              toggleCoupling([Number(endpointA), Number(endpointB)]);
            }}
          >
            <label>
              Coupling start ID
              <input
                type="number"
                min="0"
                step="1"
                required
                value={endpointA}
                onChange={(e) => setEndpointA(e.target.value)}
              />
            </label>
            <label>
              Coupling end ID
              <input
                type="number"
                min="0"
                step="1"
                required
                value={endpointB}
                onChange={(e) => setEndpointB(e.target.value)}
              />
            </label>
            <button type="submit">Toggle coupling</button>
          </form>
        </div>
        {inputError && (
          <p role="alert" className="input-error">
            {inputError}
          </p>
        )}
        {(defects.qubits.length > 0 || defects.couplings.length > 0) && (
          <div className="disabled-items" aria-label="Disabled hardware">
            {defects.qubits.map((q) => (
              <button type="button" key={`q${q}`} onClick={() => toggleQubit(q)}>
                Restore qubit {q} ×
              </button>
            ))}
            {defects.couplings.map((edge) => (
              <button type="button" key={edgeKey(...edge)} onClick={() => toggleCoupling(edge)}>
                Restore {edge[0]} ↔ {edge[1]} ×
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
