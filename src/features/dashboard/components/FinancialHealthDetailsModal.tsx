import React from 'react';
import { useDraggableAndResizable } from '../../../hooks/useDraggableAndResizable';
import { HoloButton } from '../../../components/ui/HoloButton';
import { X, HeartPulse } from 'lucide-react';
// FIX: Add missing import for 'marked' library
import { marked } from 'marked';

interface FinancialHealthDetailsModalProps {
  analysis: string;
  onClose: () => void;
  theme: 'light' | 'dark';
  t: Record<string, any>;
}

export const FinancialHealthDetailsModal: React.FC<FinancialHealthDetailsModalProps> = ({ analysis, onClose, theme, t }) => {
  const { modalRef, headerRef, position, size, handleDragStart, handleResizeStart } = useDraggableAndResizable({
    initialSize: { width: 640, height: 500 },
    minSize: { width: 500, height: 400 }
  });

  return (
    <div className="fixed inset-0 bg-black/75 z-50" onMouseDown={onClose}>
      <div
        ref={modalRef}
        style={{ left: `${position.x}px`, top: `${position.y}px`, width: `${size.width}px`, height: `${size.height}px` }}
        className={`fixed rounded-2xl shadow-2xl w-full flex flex-col overflow-hidden ${theme === 'dark' ? 'bg-gray-900 border-2 border-cyan-500/50' : 'bg-white border'}`}
        onMouseDown={e => e.stopPropagation()}
      >
        <div
          ref={headerRef}
          onMouseDown={handleDragStart}
          className={`p-6 border-b flex items-center justify-between cursor-move ${theme === 'dark' ? 'border-gray-700' : 'border-slate-200'}`}
        >
          <h3 className="text-xl font-bold flex items-center gap-2">
            <HeartPulse className="text-cyan-400" />
            {t.financialHealthDetails}
          </h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-500/20"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div
            className="prose prose-sm prose-invert max-w-none whitespace-pre-wrap text-[rgb(var(--text-secondary-rgb))]"
            dangerouslySetInnerHTML={{ __html: marked(analysis) as string }}
          />
        </div>

        <div className={`flex justify-end gap-3 p-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-slate-200'}`}>
          <HoloButton variant="primary" onClick={onClose}>{t.close}</HoloButton>
        </div>

        <div onMouseDown={handleResizeStart} className="absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize z-20 text-gray-500 hover:text-cyan-400">
          <svg width="100%" height="100%" viewBox="0 0 16 16"><path d="M16 0V16H0L16 0Z" fill="currentColor"/></svg>
        </div>
      </div>
    </div>
  );
};
