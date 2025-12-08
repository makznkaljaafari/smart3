
import React from 'react';
import { Expense } from '../../types';
import { translations } from '../../../../lib/i18n';
import { useZustandStore } from '../../../../store/useStore';
import { formatFileSize } from '../../lib/utils';
import { UploadCloud, File as FileIcon, Trash2, Loader } from 'lucide-react';

interface ExpenseAttachmentsProps {
    attachments: Expense['attachments'];
    uploadingFiles: string[];
    isDragging: boolean;
    setIsDragging: (v: boolean) => void;
    onFileChange: (files: FileList | null) => void;
    onRemoveAttachment: (id: string) => void;
}

export const ExpenseAttachments: React.FC<ExpenseAttachmentsProps> = ({ 
    attachments, uploadingFiles, isDragging, setIsDragging, onFileChange, onRemoveAttachment 
}) => {
    const { lang } = useZustandStore();
    const t = translations[lang];

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };
    const handleDragLeave = () => setIsDragging(false);
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        onFileChange(e.dataTransfer.files);
    };

    return (
        <section>
            <h4 className="text-lg font-bold mb-4 text-white">{t.attachments}</h4>
            <div 
                onDragOver={handleDragOver} 
                onDragLeave={handleDragLeave} 
                onDrop={handleDrop} 
                className={`p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${isDragging ? 'border-cyan-500 bg-cyan-500/10' : 'border-gray-600 hover:border-gray-500'}`}
            >
                <UploadCloud size={32} className="mx-auto text-gray-400 mb-2" />
                <p className="text-gray-300">{t.dragAndDrop}</p>
                <input type="file" multiple onChange={e => onFileChange(e.target.files)} className="hidden" id="file-upload" />
                <label htmlFor="file-upload" className="cursor-pointer text-cyan-400 hover:underline">{t.browse}</label>
            </div>
            
            {(attachments && attachments.length > 0) && (
                <div className="mt-4 space-y-2">
                    {attachments.map(att => (
                        <div key={att.id} className="flex items-center justify-between p-2 bg-gray-800 rounded-lg border border-gray-700">
                            <div className="flex items-center gap-2">
                                <FileIcon size={16} className="text-blue-400" />
                                <span className="text-sm text-gray-200">{att.name}</span>
                                <span className="text-xs text-gray-500">({formatFileSize(att.size)})</span>
                            </div>
                            <button type="button" onClick={() => onRemoveAttachment(att.id)} className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-full transition-colors">
                                <Trash2 size={16}/>
                            </button>
                        </div>
                    ))}
                </div>
            )}
            
            {uploadingFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                    {uploadingFiles.map(name => (
                        <div key={name} className="flex items-center justify-between p-2 bg-gray-800 rounded-lg opacity-70 border border-gray-700">
                            <div className="flex items-center gap-2">
                                <Loader size={16} className="animate-spin text-cyan-400" />
                                <span className="text-sm text-gray-300">{name}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
};
