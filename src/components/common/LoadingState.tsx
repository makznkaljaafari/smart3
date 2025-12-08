
import React from 'react';
import { Cpu, Activity } from 'lucide-react';
import { useZustandStore } from '../../store/useStore';

interface LoadingStateProps {
    message?: string;
    fullScreen?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message, fullScreen = false }) => {
    const theme = useZustandStore(state => state.theme);
    const isDark = theme !== 'light';

    const containerClasses = fullScreen 
        ? 'fixed inset-0 z-[999] bg-black/80 backdrop-blur-md' 
        : 'w-full py-20';

    return (
        <div className={`flex flex-col items-center justify-center ${containerClasses}`}>
            <div className="relative flex flex-col items-center justify-center scale-110">
                
                {/* Sci-Fi Rings */}
                <div className="relative w-24 h-24">
                    {/* Outer Ring */}
                    <div className={`absolute inset-0 rounded-full border-t-2 border-b-2 animate-[spin_3s_linear_infinite] ${isDark ? 'border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 'border-cyan-600/40'}`}></div>
                    
                    {/* Middle Ring (Reverse) */}
                    <div className={`absolute inset-2 rounded-full border-l-2 border-r-2 animate-[spin_2s_linear_infinite_reverse] ${isDark ? 'border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.3)]' : 'border-purple-600/50'}`}></div>
                    
                    {/* Inner Pulse */}
                    <div className={`absolute inset-8 rounded-full animate-pulse ${isDark ? 'bg-cyan-400/20' : 'bg-cyan-600/10'}`}></div>
                </div>

                {/* Center Core */}
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`}>
                    <Cpu size={28} className={`animate-pulse ${isDark ? 'text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]' : 'text-cyan-700'}`} />
                </div>
            </div>
            
            {/* Message & Status Bar */}
            {message && (
                <div className="mt-8 text-center space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <p className={`font-mono text-sm tracking-widest uppercase ${isDark ? 'text-cyan-400' : 'text-slate-600'}`}>
                        {message}
                    </p>
                    
                    {/* Loading Bar */}
                    <div className={`h-1 w-32 mx-auto rounded-full overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-slate-200'}`}>
                        <div className={`h-full w-full origin-left animate-[loading_1.5s_ease-in-out_infinite] ${isDark ? 'bg-gradient-to-r from-cyan-500 to-purple-500' : 'bg-cyan-500'}`}></div>
                    </div>
                </div>
            )}
            
            <style>{`
                @keyframes loading {
                    0% { transform: scaleX(0); }
                    50% { transform: scaleX(0.7); }
                    100% { transform: scaleX(0); transform-origin: right; }
                }
            `}</style>
        </div>
    );
};
