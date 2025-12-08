
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useZustandStore } from '../../store/useStore';
import { translations } from '../../lib/i18n';
import { AuthLayout } from './AuthLayout';
import { HoloButton } from '../../components/ui/HoloButton';
import { Mail, Lock, LogIn, Loader } from 'lucide-react';
import { ROUTES } from '../../constants/routes';

const REMEMBER_ME_KEY = 'rememberedEmail';

export const LoginView: React.FC = () => {
    const { login, lang, authLoading, isAuthenticated } = useZustandStore(state => ({
        login: state.login,
        lang: state.lang,
        authLoading: state.authLoading,
        isAuthenticated: state.isAuthenticated
    }));
    const t = translations[lang];
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || ROUTES.DASHBOARD;

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(true);
    const [error, setError] = useState('');
    const [localLoading, setLocalLoading] = useState(false);

    // Redirect if user is already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, navigate, from]);

    useEffect(() => {
        const savedEmail = localStorage.getItem(REMEMBER_ME_KEY);
        if (savedEmail) {
            setEmail(savedEmail);
            setRememberMe(true);
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLocalLoading(true);
        try {
            await login(email, password);
            if (rememberMe) {
                localStorage.setItem(REMEMBER_ME_KEY, email);
            } else {
                localStorage.removeItem(REMEMBER_ME_KEY);
            }
            // Success: App.tsx auth listener triggers bootstrapAuthAndCompany
            // We do not need to navigate here manually; the AuthListener + useEffect will handle it.
            // But to be safe/responsive:
            // navigate(ROUTES.DASHBOARD);
        } catch (err: any) {
            setError(err.message || 'Failed to login');
            setLocalLoading(false);
        }
    };

    const inputClasses = "w-full bg-[rgb(var(--bg-tertiary-rgb))] border border-[rgb(var(--border-primary-rgb))] rounded-lg p-3 pl-10 text-[rgb(var(--text-primary-rgb))] focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500";

    const isLoading = authLoading || localLoading;

    return (
        <AuthLayout title="تسجيل الدخول">
            <p className="text-center text-xs text-[rgb(var(--text-muted-rgb))] mb-6">
                {t.loginHelperText}
            </p>
            <form onSubmit={handleSubmit} className="space-y-6">
                {error && <p className="text-red-400 bg-red-500/10 p-3 rounded-lg text-center text-sm">{error}</p>}
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input type="email" autoComplete="email" placeholder={t.email || 'Email'} value={email} onChange={e => setEmail(e.target.value)} required className={inputClasses} />
                </div>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input type="password" autoComplete="current-password" placeholder={t.password || 'Password'} value={password} onChange={e => setPassword(e.target.value)} required className={inputClasses} />
                </div>

                <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                        <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="rounded bg-[rgb(var(--bg-tertiary-rgb))] border-[rgb(var(--border-primary-rgb))] text-cyan-500 focus:ring-cyan-600 focus:ring-offset-[rgb(var(--bg-secondary-rgb))]" />
                        تذكرني
                    </label>
                    <Link to="#" className="text-sm text-cyan-400 hover:underline">
                        هل نسيت كلمة المرور؟
                    </Link>
                </div>

                <HoloButton type="submit" variant="primary" className="w-full justify-center !py-3" disabled={isLoading}>
                    {isLoading ? <Loader size={20} className="animate-spin" /> : <LogIn size={20} />}
                    <span>{isLoading ? 'جاري الدخول...' : 'تسجيل الدخول'}</span>
                </HoloButton>
                <p className="text-center text-gray-400 text-sm">
                    ليس لديك حساب؟{' '}
                    <Link to={ROUTES.REGISTER} className="font-semibold text-cyan-400 hover:underline">
                        أنشئ حساباً جديداً
                    </Link>
                </p>
            </form>
        </AuthLayout>
    );
};
