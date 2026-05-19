/**
 * Export utilities for spin correlation explorer
 */

import type { ExportData, CorrelationMatrix } from './spin-types';
import { getHeatmapColor, getMatrixLabel } from './spin-utils';

/**
 * Export canvas as PNG image
 */
export function exportCanvasToPNG(canvas: HTMLCanvasElement, filename: string): void {
  canvas.toBlob((blob) => {
    if (!blob) {
      console.error('Failed to create blob from canvas');
      return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}

function escapeXml(value: string): string {
  return value.replace(/[<>&"']/g, (char) => {
    switch (char) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case '"':
        return '&quot;';
      default:
        return '&apos;';
    }
  });
}

/**
 * Export the heatmap as true SVG geometry and text.
 */
export function exportHeatmapToSVG(matrix: CorrelationMatrix, filename: string): void {
  const width = 800;
  const height = 800;
  const margin = 120;
  const cellSize = (Math.min(width, height) - 2 * margin) / matrix.size;
  const matrixStartX = margin;
  const matrixStartY = margin;
  const labels = ['n', 'r', 'k'];
  const elements: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">`,
    '<title id="title">Spin Correlation Matrix C_ij</title>',
    '<desc id="desc">Vector SVG heatmap of the current spin correlation matrix.</desc>',
    '<rect width="100%" height="100%" fill="white"/>',
    `<text x="${width / 2}" y="42" text-anchor="middle" font-family="sans-serif" font-size="28" font-weight="700">Spin Correlation Matrix C_ij</text>`,
  ];

  for (let i = 0; i < matrix.size; i++) {
    elements.push(
      `<text x="${matrixStartX + (i + 0.5) * cellSize}" y="${matrixStartY - 32}" text-anchor="middle" font-family="sans-serif" font-size="24">${labels[i]}</text>`,
      `<text x="${matrixStartX - 32}" y="${matrixStartY + (i + 0.58) * cellSize}" text-anchor="end" font-family="sans-serif" font-size="24">${labels[i]}</text>`,
    );
  }

  for (let row = 0; row < matrix.size; row++) {
    for (let col = 0; col < matrix.size; col++) {
      const value = matrix.data[row * matrix.size + col];
      const x = matrixStartX + col * cellSize;
      const y = matrixStartY + row * cellSize;
      const textColor = Math.abs(value) > 0.3 ? '#fff' : '#000';
      elements.push(
        `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${getHeatmapColor(value)}" stroke="#333" stroke-width="2"/>`,
        `<text x="${x + cellSize / 2}" y="${y + cellSize / 2 + 8}" text-anchor="middle" font-family="monospace" font-size="24" fill="${textColor}">${escapeXml(value.toFixed(3))}</text>`,
        `<title>${escapeXml(`${getMatrixLabel(row, col)} = ${value.toFixed(4)}`)}</title>`,
      );
    }
  }

  const legendX = (width - 360) / 2;
  const legendY = height - 92;
  for (let i = 0; i < 180; i++) {
    const value = -1 + (2 * i) / 179;
    elements.push(
      `<rect x="${legendX + i * 2}" y="${legendY}" width="2" height="28" fill="${getHeatmapColor(value)}"/>`,
    );
  }
  elements.push(
    `<rect x="${legendX}" y="${legendY}" width="360" height="28" fill="none" stroke="#333"/>`,
    `<text x="${legendX - 12}" y="${legendY + 20}" text-anchor="end" font-family="sans-serif" font-size="18">-1</text>`,
    `<text x="${legendX + 180}" y="${legendY + 54}" text-anchor="middle" font-family="sans-serif" font-size="18">0</text>`,
    `<text x="${legendX + 372}" y="${legendY + 20}" text-anchor="start" font-family="sans-serif" font-size="18">+1</text>`,
    '</svg>',
  );

  const blob = new Blob([elements.join('\n')], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Export current parameters and correlation matrix as JSON
 */
export function exportParametersToJSON(
  parameters: unknown,
  correlationMatrix: CorrelationMatrix,
  filename: string,
): void {
  const data: ExportData = {
    parameters,
    correlationMatrix,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  };

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Format correlation matrix for display
 */
export function formatCorrelationMatrix(matrix: CorrelationMatrix): string {
  const rows = [];
  for (let i = 0; i < matrix.size; i++) {
    const row = [];
    for (let j = 0; j < matrix.size; j++) {
      const value = matrix.data[i * matrix.size + j];
      row.push(value.toFixed(4).padStart(8));
    }
    rows.push(row.join(' '));
  }
  return rows.join('\n');
}

/**
 * Get current timestamp for filenames
 */
export function getTimestampString(): string {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-').split('T')[0];
}
