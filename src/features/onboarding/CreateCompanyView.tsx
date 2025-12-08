
import React, { useState } from 'react';
import { useZustandStore } from '../../store/useStore';
import { HoloButton } from '../../components/ui/HoloButton';
import { Loader, Building, Rocket, Sparkles, ArrowRight } from 'lucide-react';
import { companyService } from '../../services/companyService';
import { Company } from '../../types';
import { NeuralBackground } from '../../components/ui/NeuralBackground';

export const CreateCompanyView: React.FC = () => {
    const { addUserCompany, authUser, theme, settings } = useZustandStore(s => ({
        addUserCompany: s.addUserCompany,
        authUser: s.authUser,
        theme: s.theme,
        settings: s.settings
    }));
    const [companyName, setCompanyName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!companyName.trim() || isLoading || !authUser) return;
        
        setIsLoading(true);
        setError('');
        
        try {
            const { data, error: rpcError } = await companyService.onboardUser(
                authUser.name || 'User', 
                companyName, 
                settings.baseCurrency || 'YER', 
                settings.profile.locale || 'ar'
            );
            
            if (rpcError) {
                throw new Error(rpcError.message);
            }
            
            if (!data || !data.company) {
                throw new Error('Onboarding returned invalid data');
            }

            const newCompany: Company = {
                id: data.company.id,
                name: data.company.name,
                owner_id: data.company.owner_id,
                created_at: data.company.created_at,
            };
            
            addUserCompany(newCompany, data.role?.role || 'owner');
            
        } catch (err: any) {
            setError(err.message || 'Failed to create company');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[rgb(var(--bg-primary-rgb))] text-[rgb(var(--text-primary-rgb))]">
            <NeuralBackground theme={theme} />
            <div className="relative z-10 w-full max-w-md bg-[rgb(var(--bg-secondary-rgb)/0.8)] backdrop-blur-xl p-8 rounded-2xl border border-cyan-500/30 shadow-2xl">
                <div className="flex justify-center mb-6">
                    <div className="p-4 rounded-full bg-cyan-500/20 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                        <Rocket size={40} />
                    </div>
                </div>
                
                <h1 className="text-2xl font-bold text-center mb-2">Welcome to Smart Finance</h1>
                <p className="text-center text-[rgb(var(--text-secondary-rgb))] mb-8">Let's set up your first workspace.</p>
                
                {error && <div className="mb-4 p-3 bg-red-500/10 text-red-400 rounded-lg text-sm text-center">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                            <Building size={16} /> Company Name
                        </label>
                        <input 
                            type="text" 
                            value={companyName}
                            onChange={e => setCompanyName(e.target.value)}
                            placeholder="My Awesome Company"
                            className="w-full p-3 rounded-xl bg-[rgb(var(--bg-tertiary-rgb))] border border-[rgb(var(--border-primary-rgb))] focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                            autoFocus
                        />
                    </div>
                    
                    <HoloButton 
                        type="submit" 
                        variant="primary" 
                        className="w-full justify-center !py-3 !text-lg"
                        disabled={isLoading || !companyName.trim()}
                    >
                        {isLoading ? <Loader className="animate-spin" /> : <Sparkles size={20} />}
                        {isLoading ? 'Creating...' : 'Get Started'}
                    </HoloButton>
                </form>
            </div>
        </div>
    );
};