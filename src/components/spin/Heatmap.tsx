/**
 * Heatmap component for displaying C_ij correlation matrix
 */

import React, { useEffect, useRef, useState } from 'react';
import type { CorrelationMatrix } from '../../lib/spin-types';
import { getHeatmapColor, getMatrixLabel } from '../../lib/spin-utils';

interface HeatmapProps {
  matrix: CorrelationMatrix;
  width?: number;
  height?: number;
}

export function Heatmap({ matrix, width = 400, height = 400 }: HeatmapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);
  const [focusedCell, setFocusedCell] = useState<{ row: number; col: number } | null>(null);

  // Draw heatmap
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High DPI support
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Layout
    const margin = 60;
    const cellSize = (Math.min(width, height) - 2 * margin) / matrix.size;
    const matrixStartX = margin;
    const matrixStartY = margin;

    // Draw cells
    for (let row = 0; row < matrix.size; row++) {
      for (let col = 0; col < matrix.size; col++) {
        const value = matrix.data[row * matrix.size + col];
        const x = matrixStartX + col * cellSize;
        const y = matrixStartY + row * cellSize;

        // Cell background
        ctx.fillStyle = getHeatmapColor(value);
        ctx.fillRect(x, y, cellSize, cellSize);

        // Cell border
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, cellSize, cellSize);

        // Highlight hovered or focused cell
        if (
          (hoveredCell?.row === row && hoveredCell?.col === col) ||
          (focusedCell?.row === row && focusedCell?.col === col)
        ) {
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 3;
          ctx.strokeRect(x, y, cellSize, cellSize);
        }

        // Value text
        ctx.fillStyle = Math.abs(value) > 0.3 ? '#fff' : '#000';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(value.toFixed(3), x + cellSize / 2, y + cellSize / 2);
      }
    }

    // Draw axis labels
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';

    const labels = ['x', 'y', 'z'];
    for (let i = 0; i < matrix.size; i++) {
      // Column labels (top)
      ctx.fillText(labels[i], matrixStartX + (i + 0.5) * cellSize, matrixStartY - 20);

      // Row labels (left)
      ctx.textAlign = 'right';
      ctx.fillText(labels[i], matrixStartX - 20, matrixStartY + (i + 0.5) * cellSize);
      ctx.textAlign = 'center';
    }

    // Title
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('Spin Correlation Matrix C_ij', width / 2, 20);

    // Color scale legend
    const legendY = height - 30;
    const legendWidth = 200;
    const legendHeight = 20;
    const legendX = (width - legendWidth) / 2;

    for (let i = 0; i < legendWidth; i++) {
      const value = -1 + (2 * i) / legendWidth;
      ctx.fillStyle = getHeatmapColor(value);
      ctx.fillRect(legendX + i, legendY, 1, legendHeight);
    }

    ctx.strokeStyle = '#333';
    ctx.strokeRect(legendX, legendY, legendWidth, legendHeight);

    ctx.fillStyle = '#000';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('-1', legendX - 15, legendY + legendHeight / 2);
    ctx.textAlign = 'center';
    ctx.fillText('0', legendX + legendWidth / 2, legendY + legendHeight + 15);
    ctx.textAlign = 'right';
    ctx.fillText('+1', legendX + legendWidth + 15, legendY + legendHeight / 2);
  }, [matrix, width, height, hoveredCell, focusedCell]);

  // Handle mouse hover
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const margin = 60;
    const cellSize = (Math.min(width, height) - 2 * margin) / matrix.size;
    const matrixStartX = margin;
    const matrixStartY = margin;

    const col = Math.floor((x - matrixStartX) / cellSize);
    const row = Math.floor((y - matrixStartY) / cellSize);

    if (row >= 0 && row < matrix.size && col >= 0 && col < matrix.size) {
      setHoveredCell({ row, col });
    } else {
      setHoveredCell(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredCell(null);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!focusedCell) {
      setFocusedCell({ row: 0, col: 0 });
      return;
    }

    let { row, col } = focusedCell;

    switch (e.key) {
      case 'ArrowUp':
        row = Math.max(0, row - 1);
        e.preventDefault();
        break;
      case 'ArrowDown':
        row = Math.min(matrix.size - 1, row + 1);
        e.preventDefault();
        break;
      case 'ArrowLeft':
        col = Math.max(0, col - 1);
        e.preventDefault();
        break;
      case 'ArrowRight':
        col = Math.min(matrix.size - 1, col + 1);
        e.preventDefault();
        break;
    }

    setFocusedCell({ row, col });
  };

  // Get current cell info for screen readers
  const getFocusedCellInfo = () => {
    if (!focusedCell) return 'Use arrow keys to navigate cells';
    const { row, col } = focusedCell;
    const value = matrix.data[row * matrix.size + col];
    const label = getMatrixLabel(row, col);
    return `${label} = ${value.toFixed(4)}`;
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="img"
        aria-label={`Correlation matrix heatmap. ${getFocusedCellInfo()}`}
        className="border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {getFocusedCellInfo()}
      </div>
      {hoveredCell && (
        <div className="mt-2 text-sm text-gray-700">
          Hover: {getMatrixLabel(hoveredCell.row, hoveredCell.col)} ={' '}
          {matrix.data[hoveredCell.row * matrix.size + hoveredCell.col].toFixed(4)}
        </div>
      )}
    </div>
  );
}
