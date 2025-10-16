/**
 * Interactive Spin Correlation Explorer
 * Main component integrating all controls and visualizations
 */

import { useState, useEffect, useRef } from 'react';
import type {
  SpinParameters,
  SpinGrid,
  ProductionMode,
  Basis,
  EnergyPreset,
} from '../../lib/spin-types';
import { loadGrid, getCorrelationMatrix, computeSpinAxes } from '../../lib/spin-utils';
import {
  exportCanvasToPNG,
  exportCanvasToSVG,
  exportParametersToJSON,
  getTimestampString,
} from '../../lib/export';
import { Heatmap } from './Heatmap';
import { SpinVectorPlot } from './SpinVectorPlot';

export function Explorer() {
  // Parameters
  const [parameters, setParameters] = useState<SpinParameters>({
    productionMode: 'gg',
    basis: 'helicity',
    energy: '13TeV',
    theta: Math.PI / 4, // 45 degrees
    phi: Math.PI / 2, // 90 degrees
  });

  // Grid data
  const [grid, setGrid] = useState<SpinGrid | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Canvas refs for export
  const heatmapRef = useRef<HTMLDivElement>(null);
  const vectorPlotRef = useRef<HTMLDivElement>(null);

  // Load grid when parameters change
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const newGrid = await loadGrid(
          parameters.productionMode,
          parameters.basis,
          parameters.energy,
        );
        setGrid(newGrid);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load grid');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [parameters.productionMode, parameters.basis, parameters.energy]);

  // Compute current correlation matrix and spin axes
  const matrix = grid ? getCorrelationMatrix(grid, parameters.theta, parameters.phi) : null;
  const axes = matrix ? computeSpinAxes(matrix, parameters.theta, parameters.phi) : null;

  // Update parameter handlers
  const updateParam = <K extends keyof SpinParameters>(key: K, value: SpinParameters[K]) => {
    setParameters((prev) => ({ ...prev, [key]: value }));
  };

  // Export handlers
  const handleExportPNG = () => {
    const canvas = heatmapRef.current?.querySelector('canvas');
    if (canvas) {
      const filename = `spin-correlation-${getTimestampString()}.png`;
      exportCanvasToPNG(canvas, filename);
    }
  };

  const handleExportSVG = () => {
    const canvas = heatmapRef.current?.querySelector('canvas');
    if (canvas) {
      const filename = `spin-correlation-${getTimestampString()}.svg`;
      exportCanvasToSVG(canvas, filename);
    }
  };

  const handleExportJSON = () => {
    if (matrix) {
      const filename = `spin-params-${getTimestampString()}.json`;
      exportParametersToJSON(parameters, matrix, filename);
    }
  };

  // Convert radians to degrees for display
  const thetaDeg = (parameters.theta * 180) / Math.PI;
  const phiDeg = (parameters.phi * 180) / Math.PI;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading correlation data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 border border-red-300 bg-red-50 rounded">
        <h3 className="text-lg font-semibold text-red-800">Error</h3>
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls Panel */}
      <div className="bg-gray-50 p-6 rounded-lg space-y-4">
        <h2 className="text-xl font-semibold">Parameters</h2>

        {/* Production Mode */}
        <div>
          <label htmlFor="production-mode" className="block text-sm font-medium text-gray-700 mb-2">
            Production Mode
          </label>
          <select
            id="production-mode"
            value={parameters.productionMode}
            onChange={(e) => updateParam('productionMode', e.target.value as ProductionMode)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="gg">Gluon fusion (gg)</option>
            <option value="qqbar">Quark-antiquark annihilation (qq̄)</option>
          </select>
        </div>

        {/* Basis */}
        <div>
          <label htmlFor="basis" className="block text-sm font-medium text-gray-700 mb-2">
            Spin Basis
          </label>
          <select
            id="basis"
            value={parameters.basis}
            onChange={(e) => updateParam('basis', e.target.value as Basis)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="helicity">Helicity basis</option>
            <option value="beam">Beam basis</option>
            <option value="off-diagonal">Off-diagonal basis</option>
          </select>
        </div>

        {/* Energy Preset */}
        <div>
          <label htmlFor="energy" className="block text-sm font-medium text-gray-700 mb-2">
            Center-of-Mass Energy
          </label>
          <select
            id="energy"
            value={parameters.energy}
            onChange={(e) => updateParam('energy', e.target.value as EnergyPreset)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7TeV">7 TeV (Run 1)</option>
            <option value="8TeV">8 TeV (Run 1)</option>
            <option value="13TeV">13 TeV (Run 2)</option>
            <option value="14TeV">14 TeV (Run 3/Future)</option>
          </select>
        </div>

        {/* Theta Slider */}
        <div>
          <label htmlFor="theta" className="block text-sm font-medium text-gray-700 mb-2">
            Polar Angle θ: {thetaDeg.toFixed(1)}° ({parameters.theta.toFixed(3)} rad)
          </label>
          <input
            id="theta"
            type="range"
            min="0"
            max={Math.PI}
            step={Math.PI / 180}
            value={parameters.theta}
            onChange={(e) => updateParam('theta', parseFloat(e.target.value))}
            className="w-full"
            aria-valuemin={0}
            aria-valuemax={Math.PI}
            aria-valuenow={parameters.theta}
            aria-valuetext={`${thetaDeg.toFixed(1)} degrees`}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0°</span>
            <span>90°</span>
            <span>180°</span>
          </div>
        </div>

        {/* Phi Slider */}
        <div>
          <label htmlFor="phi" className="block text-sm font-medium text-gray-700 mb-2">
            Azimuthal Angle φ: {phiDeg.toFixed(1)}° ({parameters.phi.toFixed(3)} rad)
          </label>
          <input
            id="phi"
            type="range"
            min="0"
            max={2 * Math.PI}
            step={Math.PI / 180}
            value={parameters.phi}
            onChange={(e) => updateParam('phi', parseFloat(e.target.value))}
            className="w-full"
            aria-valuemin={0}
            aria-valuemax={2 * Math.PI}
            aria-valuenow={parameters.phi}
            aria-valuetext={`${phiDeg.toFixed(1)} degrees`}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0°</span>
            <span>180°</span>
            <span>360°</span>
          </div>
        </div>
      </div>

      {/* Visualizations */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Heatmap */}
        <div ref={heatmapRef}>
          <h3 className="text-lg font-semibold mb-3">Correlation Matrix</h3>
          {matrix && <Heatmap matrix={matrix} />}
        </div>

        {/* Vector Plot */}
        <div ref={vectorPlotRef}>
          <h3 className="text-lg font-semibold mb-3">Spin Orientation</h3>
          {axes && <SpinVectorPlot axes={axes} />}
        </div>
      </div>

      {/* Export Controls */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Export</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExportPNG}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Export PNG
          </button>
          <button
            onClick={handleExportSVG}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Export SVG
          </button>
          <button
            onClick={handleExportJSON}
            className="px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Export Parameters (JSON)
          </button>
        </div>
        <p className="mt-3 text-sm text-gray-600">
          Export the current visualization as an image or download the parameters and correlation
          matrix as JSON for further analysis.
        </p>
      </div>

      {/* Live region for screen readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Current parameters: {parameters.productionMode} production, {parameters.basis} basis,{' '}
        {parameters.energy}, theta {thetaDeg.toFixed(1)} degrees, phi {phiDeg.toFixed(1)} degrees
      </div>
    </div>
  );
}
