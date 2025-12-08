import React, { useState, useEffect } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { useDraggableAndResizable } from '../../../hooks/useDraggableAndResizable';
import { HoloButton } from '../../../components/ui/HoloButton';
import { X, Loader, ServerCrash, Brain, Copy } from 'lucide-react';
import { marked } from 'marked';

interface StocktakeSummaryModalProps {
    isLoading: boolean;
    error: string | null;
    summary: string | null;
    onClose: () => void;
}

export const StocktakeSummaryModal: React.FC<StocktakeSummaryModalProps> = ({ isLoading, error, summary, onClose }) => {
    const { theme, lang } = useZustandStore();
    const t = translations[lang];
    const { modalRef, headerRef, position, size, handleDragStart, handleResizeStart } = useDraggableAndResizable({ initialSize: { width: 700, height: 600 } });

    const handleCopy = () => {
        if (summary) {
            navigator.clipboard.writeText(summary);
            useZustandStore.getState().addToast({ message: t.copiedToClipboard || 'Copied to clipboard!', type: 'success' });
        }
    };

    return (
        <div className="fixed inset-0 bg-black/75 z-50" onMouseDown={onClose}>
            <div
                ref={modalRef}
                style={{ ...position, ...size }}
                className={`fixed rounded-2xl shadow-2xl flex flex-col ${theme === 'dark' ? 'bg-gray-900 border-2 border-purple-500/50' : 'bg-white border'}`}
                onMouseDown={e => e.stopPropagation()}
            >
                <div ref={headerRef} onMouseDown={handleDragStart} className={`p-6 border-b flex items-center justify-between cursor-move ${theme === 'dark' ? 'border-gray-700' : 'border-slate-200'}`}>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Brain className="text-purple-400" />
                        {t.stocktakeSummary}
                    </h3>
                    <button onClick={onClose}><X /></button>
                </div>
                <div className="flex-1 p-6 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4">
                            <Loader size={40} className="animate-spin text-purple-400" />
                            <p>{t.generatingSummary}</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-red-400">
                            <ServerCrash size={40} />
                            <p>{t.errorGeneratingResponse}</p>
                            <p className="text-xs text-gray-500">{error}</p>
                        </div>
                    ) : summary ? (
                        <div
                            className="prose prose-sm prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: marked(summary) }}
                        />
                    ) : null}
                </div>
                <div className={`flex justify-between items-center gap-3 p-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-slate-200'}`}>
                    <HoloButton variant="secondary" icon={Copy} onClick={handleCopy} disabled={!summary}>
                        {t.copyToClipboard}
                    </HoloButton>
                    <HoloButton variant="primary" onClick={onClose}>{t.close}</HoloButton>
                </div>
                 <div onMouseDown={handleResizeStart} className="absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize z-20 text-gray-500 hover:text-cyan-400"><svg width="100%" height="100%" viewBox="0 0 16 16"><path d="M16 0V16H0L16 0Z" fill="currentColor"/></svg></div>
            </div>
        </div>
    );
};