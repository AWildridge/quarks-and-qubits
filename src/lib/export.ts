/**
 * Export utilities for spin correlation explorer
 */

import type { ExportData, SpinParameters, CorrelationMatrix } from './spin-types';

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

/**
 * Export canvas as SVG
 * Note: This creates a simple SVG wrapper around a rasterized image.
 * For true vector export, we'd need to redraw using SVG elements.
 */
export function exportCanvasToSVG(canvas: HTMLCanvasElement, filename: string): void {
  const dataUrl = canvas.toDataURL('image/png');
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}">
  <title>Spin Correlation Matrix</title>
  <image width="${canvas.width}" height="${canvas.height}" xlink:href="${dataUrl}"/>
</svg>`;

  const blob = new Blob([svg], { type: 'image/svg+xml' });
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
  parameters: SpinParameters,
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
