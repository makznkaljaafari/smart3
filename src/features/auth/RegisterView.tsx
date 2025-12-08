
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useZustandStore } from '../../store/useStore';
import { translations } from '../../lib/i18n';
import { AuthLayout } from './AuthLayout';
import { HoloButton } from '../../components/ui/HoloButton';
import { Mail, Lock, User, UserPlus, Loader } from 'lucide-react';
import { ROUTES } from '../../constants/routes';

export const RegisterView: React.FC = () => {
    const { register, lang, authLoading, isAuthenticated } = useZustandStore();
    const t = translations[lang];
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [localLoading, setLocalLoading] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            navigate(ROUTES.DASHBOARD, { replace: true });
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLocalLoading(true);
        try {
            await register(name, email, password);
            // The auth listener in App.tsx will detect the new user,
            // run the bootstrap (creating profile/company), and then redirect.
        } catch (err: any) {
            setError(err.message || 'Failed to register');
            setLocalLoading(false);
        }
    };

    const inputClasses = "w-full bg-[rgb(var(--bg-tertiary-rgb))] border border-[rgb(var(--border-primary-rgb))] rounded-lg p-3 pl-10 text-[rgb(var(--text-primary-rgb))] focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500";
    const isLoading = authLoading || localLoading;

    return (
        <AuthLayout title="إنشاء حساب جديد">
            <form onSubmit={handleSubmit} className="space-y-6">
                {error && <p className="text-red-400 bg-red-500/10 p-3 rounded-lg text-center text-sm">{error}</p>}

                <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input type="text" placeholder={t.name} value={name} onChange={e => setName(e.target.value)} required className={inputClasses} />
                </div>
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input type="email" placeholder={t.email} value={email} onChange={e => setEmail(e.target.value)} required className={inputClasses} />
                </div>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input type="password" placeholder={t.password} value={password} onChange={e => setPassword(e.target.value)} required className={inputClasses} minLength={6} />
                </div>
                <HoloButton type="submit" variant="primary" className="w-full justify-center" disabled={isLoading}>
                    {isLoading ? <Loader size={20} className="animate-spin"/> : <UserPlus size={20} />}
                    {isLoading ? 'جاري الإنشاء...' : 'إنشاء حساب'}
                </HoloButton>
                <p className="text-center text-gray-400 text-sm">
                    لديك حساب بالفعل؟{' '}
                    <Link to={ROUTES.LOGIN} className="font-semibold text-cyan-400 hover:underline">
                        سجل الدخول
                    </Link>
                </p>
            </form>
        </AuthLayout>
    );
};
