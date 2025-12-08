
import React, { useState, useCallback, useRef } from 'react';

interface ColumnConfig {
  key: string;
  initialWidth: number;
}

/**
 * A custom hook to manage resizable table columns.
 * @param columns - An array of column configurations with keys and initial widths.
 * @param isRTL - A boolean indicating if the layout is right-to-left.
 * @returns A tuple containing the column widths object and the mousedown handler for resizing.
 */
export const useResizableColumns = (columns: ColumnConfig[], isRTL: boolean) => {
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(
    columns.reduce((acc, col) => ({ ...acc, [col.key]: col.initialWidth }), {})
  );

  const resizingColumnRef = useRef<string | null>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!resizingColumnRef.current) return;
    const key = resizingColumnRef.current;
    
    // For RTL, the change in X is inverted.
    const deltaX = isRTL ? startXRef.current - e.clientX : e.clientX - startXRef.current;
    
    const newWidth = Math.max(startWidthRef.current + deltaX, 80); // Min width 80px
    setColumnWidths(prev => ({ ...prev, [key]: newWidth }));
  }, [isRTL]);

  const handleMouseUp = useCallback(() => {
    resizingColumnRef.current = null;
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);
  
  const handleMouseDown = useCallback((key: string, e: React.MouseEvent) => {
    e.preventDefault();
    resizingColumnRef.current = key;
    startXRef.current = e.clientX;
    startWidthRef.current = columnWidths[key];
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [columnWidths, handleMouseMove, handleMouseUp]);

  return [columnWidths, handleMouseDown] as const;
};
