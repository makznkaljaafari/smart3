import React, { useState, useEffect, useRef, useCallback } from 'react';

interface DraggableOptions {
  initialSize?: { width: number; height: number };
  minSize?: { width: number; height: number };
}

// Helper to get coordinates from either Mouse or Touch event
const getCoords = (e: MouseEvent | TouchEvent): { x: number; y: number } => {
  if ('touches' in e && e.touches.length > 0) {
    return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
};
const getCoordsFromReactEvent = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
    if ('touches' in e && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: (e as React.MouseEvent).clientX, y: (e as React.MouseEvent).clientY };
  };

export const useDraggableAndResizable = ({
  initialSize = { width: 800, height: 600 },
  minSize = { width: 400, height: 300 }
}: DraggableOptions = {}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  // Changed from HTMLElement to HTMLDivElement as it is primarily used on divs
  const headerRef = useRef<HTMLDivElement>(null);

  const [position, setPosition] = useState(() => {
    if (window.innerWidth < 1024) return { x: 0, y: 0 };
    const w = initialSize.width || 800;
    const h = initialSize.height || 600;
    const initialX = Math.max(0, (window.innerWidth - w) / 2);
    const initialY = Math.max(0, (window.innerHeight - h) / 2);
    return { x: initialX, y: initialY };
  });

  const [size, setSize] = useState(initialSize);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const dragStartOffset = useRef({ x: 0, y: 0 });
  const resizeStartPos = useRef({ x: 0, y: 0 });
  const resizeStartSize = useRef({ width: 0, height: 0 });

  const handleDragStart = useCallback((e: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>) => {
    if (window.innerWidth < 1024) return; // Disable on mobile/tablet
    if ('button' in e && e.button !== 0) return;
    if (modalRef.current) {
      const { x: clientX, y: clientY } = getCoordsFromReactEvent(e);
      const modalRect = modalRef.current.getBoundingClientRect();
      dragStartOffset.current = {
        x: clientX - modalRect.left,
        y: clientY - modalRect.top
      };
      setIsDragging(true);
      e.preventDefault();
    }
  }, []);

  const handleResizeStart = useCallback((e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (window.innerWidth < 1024) return; // Disable on mobile/tablet
    if ('button' in e && e.button !== 0) return;
    const { x: clientX, y: clientY } = getCoordsFromReactEvent(e);
    setIsResizing(true);
    resizeStartPos.current = { x: clientX, y: clientY };
    resizeStartSize.current = { ...size };
    e.preventDefault();
  }, [size]);

  const handleMove = useCallback((e: MouseEvent | TouchEvent) => {
    // Prevent scrolling on mobile while dragging/resizing
    if (isDragging || isResizing) {
        if (e.cancelable) e.preventDefault();
    }

    const { x: clientX, y: clientY } = getCoords(e);
    
    if (isDragging && modalRef.current) {
      const newX = clientX - dragStartOffset.current.x;
      const newY = clientY - dragStartOffset.current.y;
      setPosition({ 
          x: Math.max(0, Math.min(newX, window.innerWidth - modalRef.current.offsetWidth)),
          y: Math.max(0, Math.min(newY, window.innerHeight - modalRef.current.offsetHeight)),
      });
    }
    if (isResizing) {
      const dx = clientX - resizeStartPos.current.x;
      const dy = clientY - resizeStartPos.current.y;

      let newWidth = resizeStartSize.current.width + dx;
      let newHeight = resizeStartSize.current.height + dy;

      if (newWidth < minSize.width) newWidth = minSize.width;
      if (newHeight < minSize.height) newHeight = minSize.height;
      
      setSize({ width: newWidth, height: newHeight });
    }
  }, [isDragging, isResizing, minSize.width, minSize.height]);

  const handleEnd = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove, { passive: false });
      window.addEventListener('touchend', handleEnd);
    } else {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, isResizing, handleMove, handleEnd]);
  
  return {
    modalRef,
    headerRef,
    position,
    size,
    handleDragStart,
    handleResizeStart
  };
};