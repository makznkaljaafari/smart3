
import React from 'react';
import { useZustandStore } from '../../store/useStore';
import { translations } from '../../lib/i18n';
import { HoloButton } from '../ui/HoloButton';
import { X, AlertTriangle, Check, Loader } from 'lucide-react';
import { useDraggableAndResizable } from '../../hooks/useDraggableAndResizable';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isConfirming?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message, confirmText, cancelText, isConfirming }) => {
  const { theme, lang } = useZustandStore(state => ({ theme: state.theme, lang: state.lang }));
  const t = translations[lang];
  const { modalRef, headerRef, position, size, handleDragStart, handleResizeStart } = useDraggableAndResizable({
    initialSize: { width: 450, height: 260 },
    minSize: { width: 400, height: 240 }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 z-[101]" onMouseDown={onClose}>
      <div
        ref={modalRef}
        style={{
            '--modal-x': `${position.x}px`,
            '--modal-y': `${position.y}px`,
            '--modal-width': `${size.width}px`,
            '--modal-height': `${size.height}px`,
        } as React.CSSProperties}
        className={`fixed inset-0 md:inset-auto md:left-[var(--modal-x)] md:top-[var(--modal-y)] md:w-[var(--modal-width)] md:h-[var(--modal-height)] rounded-none md:rounded-2xl shadow-2xl flex flex-col ${theme === 'dark' ? 'bg-[rgb(var(--bg-secondary-rgb))] border-2 border-orange-500/50' : 'bg-white border'}`}
        onMouseDown={e => e.stopPropagation()}
      >
        <div ref={headerRef} onMouseDown={handleDragStart} className={`p-4 border-b flex items-center justify-between cursor-move ${theme === 'dark' ? 'border-[rgb(var(--border-primary-rgb))]' : 'border-slate-200'}`}>
          <h3 className="text-lg font-bold flex items-center gap-2"><AlertTriangle className="text-orange-400" /> {title}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-500/20"><X size={20} /></button>
        </div>
        <div className="p-6 flex-1 overflow-y-auto">
          <p className={theme === 'dark' ? 'text-[rgb(var(--text-secondary-rgb))]' : 'text-slate-600'}>{message}</p>
        </div>
        <div className={`flex justify-end gap-3 p-4 border-t ${theme === 'dark' ? 'border-[rgb(var(--border-primary-rgb))]' : 'border-slate-200'}`}>
          <button type="button" onClick={onClose} className={`px-6 py-2 rounded-xl font-semibold ${theme === 'dark' ? 'bg-[rgb(var(--bg-tertiary-rgb))]' : 'bg-slate-200'}`}>{cancelText || t.cancel}</button>
          <HoloButton variant="danger" onClick={onConfirm} disabled={isConfirming} className={isConfirming ? 'animate-pulse' : ''}>
            {isConfirming ? <Loader className="animate-spin" size={18} /> : <Check size={18} />}
            <span>{isConfirming ? 'Deleting...' : (confirmText || t.delete)}</span>
          </HoloButton>
        </div>
        <div onMouseDown={handleResizeStart} className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize z-20 text-gray-500 hover:text-orange-400 hidden md:block">
            <svg width="100%" height="100%" viewBox="0 0 16 16"><path d="M16 0V16H0L16 0Z" fill="currentColor"/></svg>
        </div>
      </div>
    </div>
  );
};
