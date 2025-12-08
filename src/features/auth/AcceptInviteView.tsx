import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { teamService } from '../../services/teamService';
import { useZustandStore } from '../../store/useStore';
import { AuthLayout } from './AuthLayout';
import { Loader, CheckCircle, XCircle } from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import { translations } from '../../lib/i18n';

export const AcceptInviteView: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, authLoading, loadUserCompanies, switchCompany, lang, authUser } = useZustandStore(s => ({
        isAuthenticated: s.isAuthenticated,
        authLoading: s.authLoading,
        loadUserCompanies: s.loadUserCompanies,
        switchCompany: s.switchCompany,
        lang: s.lang,
        authUser: s.authUser,
    }));
    const t = translations[lang];

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState(t.acceptingInvitation);

    useEffect(() => {
        const accept = async () => {
            if (!token) {
                setStatus('error');
                setMessage(t.invalidInvitation);
                return;
            }
            if (!isAuthenticated || !authUser) { // Check for authUser
                // If not authenticated, redirect to login, preserving the original destination
                navigate(ROUTES.LOGIN, { state: { from: location } });
                return;
            }

            const { data, error } = await teamService.acceptInvite(token);

            if (error) {
                setStatus('error');
                setMessage(error.message || t.invalidInvitation);
            } else {
                setStatus('success');
                setMessage(t.invitationAccepted);
                
                // Now loadUserCompanies has the user object it needs
                await loadUserCompanies(authUser); 
                if (data && (data as any).companyId) {
                    await switchCompany((data as any).companyId);
                }
                // Redirect to dashboard after a short delay
                setTimeout(() => navigate(ROUTES.DASHBOARD, { replace: true }), 2000);
            }
        };

        if (!authLoading) {
            accept();
        }

    }, [token, isAuthenticated, authUser, authLoading, navigate, loadUserCompanies, switchCompany, t, location]); // Add authUser to dependency array

    const StatusIcon = () => {
        if (status === 'loading') return <Loader size={48} className="animate-spin text-cyan-400" />;
        if (status === 'success') return <CheckCircle size={48} className="text-green-400" />;
        return <XCircle size={48} className="text-red-400" />;
    };

    return (
        <AuthLayout title="Team Invitation">
            <div className="text-center text-white p-8">
                <div className="mb-4">
                    <StatusIcon />
                </div>
                <p>{message}</p>
            </div>
        </AuthLayout>
    );
};