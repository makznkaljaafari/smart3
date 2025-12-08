import React from 'react';
import { Cpu } from 'lucide-react';
import { NeuralBackground } from '../../components/ui/NeuralBackground';
import { useZustandStore } from '../../store/useStore';

interface AuthLayoutProps {
    title: string;
    children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ title, children }) => {
    const theme = useZustandStore(state => state.theme);
    
    return (
        <div className="min-h-screen bg-[rgb(var(--bg-secondary-rgb))] flex flex-col justify-center items-center p-4">
            <NeuralBackground theme="dark" />
            <div className="relative z-10 w-full max-w-md">
                 <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_40px_rgba(6,182,212,0.6)] mb-4">
                        <Cpu size={32} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">Smart Finance AI</h1>
                    <p className="text-cyan-300">{title}</p>
                </div>

                <div className="bg-[rgb(var(--bg-secondary-rgb)/0.8)] backdrop-blur-lg border border-cyan-500/30 rounded-2xl p-8 shadow-2xl shadow-cyan-500/10">
                    {children}
                </div>
            </div>
        </div>
    );
};