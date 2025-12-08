import React, { useState, useEffect } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { useDraggableAndResizable } from '../../../hooks/useDraggableAndResizable';
import { HoloButton } from '../../../components/ui/HoloButton';
import { X, Loader, ServerCrash, Brain } from 'lucide-react';
import { marked } from 'marked';
import { Project } from '../../../types';
import { analyzeProjectPerformance } from '../../../services/aiService';

interface ProjectAIAnalysisModalProps {
    project: Project;
    onClose: () => void;
}

export const ProjectAIAnalysisModal: React.FC<ProjectAIAnalysisModalProps> = ({ project, onClose }) => {
    const { theme, lang } = useZustandStore();
    const t = translations[lang];
    const { modalRef, headerRef, position, size, handleDragStart, handleResizeStart } = useDraggableAndResizable({ initialSize: { width: 600, height: 500 } });

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<{ summary: string; risks: string; suggestions: string } | null>(null);

    useEffect(() => {
        const analyze = async () => {
            setIsLoading(true);
            setError(null);
            const analysisResult = await analyzeProjectPerformance(project, lang);
            if (analysisResult) {
                setResult(analysisResult);
            } else {
                setError(t.errorGeneratingResponse || 'Failed to generate analysis.');
            }
            setIsLoading(false);
        };
        analyze();
    }, [project, lang, t.errorGeneratingResponse]);

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                    <Loader size={40} className="animate-spin text-purple-400" />
                    <p>{t.analyzing || 'Analyzing...'}</p>
                </div>
            );
        }
        if (error) {
            return (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-red-400">
                    <ServerCrash size={40} />
                    <p>{error}</p>
                </div>
            );
        }
        if (result) {
            return (
                <div className="space-y-4">
                    <div>
                        <h4 className="font-bold text-cyan-400 mb-2">{t.analysis}</h4>
                        <div className="prose prose-sm prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: marked(result.summary) as string }} />
                    </div>
                     <div>
                        <h4 className="font-bold text-orange-400 mb-2">{t.risks}</h4>
                        <div className="prose prose-sm prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: marked(result.risks) as string }} />
                    </div>
                     <div>
                        <h4 className="font-bold text-green-400 mb-2">{t.suggestions}</h4>
                        <div className="prose prose-sm prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: marked(result.suggestions) as string }} />
                    </div>
                </div>
            );
        }
        return null;
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
                        {t.aiAnalysis}
                    </h3>
                    <button onClick={onClose}><X /></button>
                </div>
                <div className="flex-1 p-6 overflow-y-auto">
                    {renderContent()}
                </div>
                <div className={`flex justify-end gap-3 p-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-slate-200'}`}>
                    <HoloButton variant="primary" onClick={onClose}>{t.close}</HoloButton>
                </div>
            </div>
        </div>
    );
};
