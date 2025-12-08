
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useZustandStore } from '../../store/useStore';

interface TooltipProps {
  content: string;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({ 
  content, 
  children, 
  position = 'bottom', 
  delay = 200 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ left: 0, top: 0 });
  const triggerRef = useRef<HTMLElement>(null);
  const timeoutRef = useRef<number | null>(null);
  const { theme } = useZustandStore(state => ({ theme: state.theme }));
  const isDark = theme !== 'light';

  const handleMouseEnter = () => {
    timeoutRef.current = window.setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        let top = 0;
        let left = 0;
        const gap = 8;

        // Initial calculation (refining happens via CSS transform mostly, but base coords needed)
        switch (position) {
          case 'top':
            top = rect.top - gap;
            left = rect.left + rect.width / 2;
            break;
          case 'bottom':
            top = rect.bottom + gap;
            left = rect.left + rect.width / 2;
            break;
          case 'left':
            top = rect.top + rect.height / 2;
            left = rect.left - gap;
            break;
          case 'right':
            top = rect.top + rect.height / 2;
            left = rect.right + gap;
            break;
        }

        setCoords({ top, left });
        setIsVisible(true);
      }
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Clone child to attach refs and events without wrapping in a div that might break layout
  const trigger = React.cloneElement(children, {
    ref: triggerRef,
    onMouseEnter: (e: React.MouseEvent) => {
      handleMouseEnter();
      children.props.onMouseEnter?.(e);
    },
    onMouseLeave: (e: React.MouseEvent) => {
      handleMouseLeave();
      children.props.onMouseLeave?.(e);
    }
  });

  const tooltipStyle = {
    top: coords.top,
    left: coords.left,
    transform: position === 'top' ? 'translate(-50%, -100%)' : 
               position === 'bottom' ? 'translate(-50%, 0)' :
               position === 'left' ? 'translate(-100%, -50%)' : 
               'translate(0, -50%)'
  };

  return (
    <>
      {trigger}
      {isVisible && createPortal(
        <div 
          className={`fixed z-[9999] px-3 py-1.5 text-xs font-medium rounded-lg shadow-xl pointer-events-none animate-in fade-in zoom-in-95 duration-200
            ${isDark 
              ? 'bg-gray-900/90 text-white border border-cyan-500/30 shadow-cyan-500/10 backdrop-blur-md' 
              : 'bg-slate-800 text-white border border-slate-700'
            }
          `}
          style={tooltipStyle}
        >
          {content}
        </div>,
        document.body
      )}
    </>
  );
};
