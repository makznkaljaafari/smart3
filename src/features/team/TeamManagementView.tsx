
import React, { useEffect, useState, useCallback } from 'react';
import { useZustandStore } from '../../store/useStore';
import { translations } from '../../lib/i18n';
import { HoloButton } from '../../components/ui/HoloButton';
import { Plus, Users2, Loader, ServerCrash } from 'lucide-react';
import { TeamMember } from './types';
import { teamService } from '../../services/teamService';
import { InviteMemberModal } from './components/InviteMemberModal';
import { TeamMemberCard } from './components/TeamMemberCard';

export const TeamManagementView: React.FC = () => {
    const { theme, lang, currentCompany, userRole, authUser, addToast } = useZustandStore(s => ({
        theme: s.theme,
        lang: s.lang,
        currentCompany: s.currentCompany,
        userRole: s.userRole,
        authUser: s.authUser,
        addToast: s.addToast,
    }));
    const t = translations[lang];
    const isDark = theme === 'dark';

    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

    const loadTeamMembers = useCallback(async () => {
        if (!currentCompany) return;

        setIsLoading(true);
        setError(null);
        const { data, error: fetchError } = await teamService.getTeamMembers(currentCompany.id);

        if (fetchError) {
            setError(fetchError.message);
        } else {
            setTeamMembers(data || []);
        }
        setIsLoading(false);
    }, [currentCompany]);

    useEffect(() => {
        loadTeamMembers();
    }, [loadTeamMembers]);

    const handleRemoveMember = async (member: TeamMember) => {
        const confirmMessage = lang === 'ar' 
            ? `هل أنت متأكد من إزالة "${member.full_name}" من الفريق؟`
            : `Are you sure you want to remove "${member.full_name}" from the team?`;

        if (window.confirm(confirmMessage)) {
            setRemovingMemberId(member.id);
            const { error: removeError } = await teamService.removeMember(member.id);
            if (removeError) {
                addToast({ message: `Failed to remove member: ${removeError.message}`, type: 'error' });
            } else {
                addToast({ message: 'Member removed successfully.', type: 'success' });
                setTeamMembers(prev => prev.filter(m => m.id !== member.id));
            }
            setRemovingMemberId(null);
        }
    };
    
    const handleInviteSuccess = () => {
        setIsInviteModalOpen(false);
        loadTeamMembers();
    };

    const canManageTeam = userRole === 'owner' || userRole === 'admin';

    const renderContent = () => {
        if (isLoading) {
            return <div className="flex flex-col items-center justify-center h-64"><Loader size={40} className="animate-spin text-cyan-400 mb-4" /><p className="text-gray-500">تحميل بيانات الفريق...</p></div>;
        }
        if (error) {
            return <div className="p-8 text-center text-red-400 rounded-xl border border-red-500/20 bg-red-500/10"><ServerCrash className="mx-auto mb-2" /> Error: {error}</div>;
        }
        if (teamMembers.length === 0) {
            return (
                <div className={`flex flex-col items-center justify-center py-20 text-center rounded-2xl border-2 border-dashed ${isDark ? 'border-gray-700 text-gray-500' : 'border-slate-300 text-slate-400'}`}>
                    <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-4">
                        <Users2 size={32} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{t.noTeamMembers}</h3>
                    <p className="max-w-sm mx-auto mb-6 opacity-70">قم بدعوة أعضاء فريقك للعمل معاً في إدارة المهام والموارد المالية.</p>
                    {canManageTeam && <HoloButton icon={Plus} onClick={() => setIsInviteModalOpen(true)}>{t.inviteMember}</HoloButton>}
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teamMembers.map((member) => (
                    <TeamMemberCard 
                        key={member.id} 
                        member={member} 
                        t={t} 
                        isDark={isDark}
                        onRemove={handleRemoveMember}
                        canRemove={canManageTeam && member.id !== authUser?.id && member.role !== 'owner'}
                        isRemoving={removingMemberId === member.id}
                    />
                ))}
                 {canManageTeam && (
                    <button 
                        onClick={() => setIsInviteModalOpen(true)}
                        className={`group flex flex-col items-center justify-center h-full min-h-[200px] rounded-2xl border-2 border-dashed transition-all duration-300 ${isDark ? 'border-gray-700 hover:border-cyan-500/50 hover:bg-gray-800/30' : 'border-slate-300 hover:border-cyan-400 hover:bg-slate-50'}`}
                    >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors ${isDark ? 'bg-gray-800 text-gray-400 group-hover:bg-cyan-500/20 group-hover:text-cyan-400' : 'bg-slate-100 text-slate-400 group-hover:bg-cyan-100 group-hover:text-cyan-600'}`}>
                            <Plus size={24} />
                        </div>
                        <span className={`font-semibold ${isDark ? 'text-gray-400 group-hover:text-cyan-400' : 'text-slate-500 group-hover:text-cyan-700'}`}>{t.inviteMember}</span>
                    </button>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.manageTeam}</h1>
                    <p className={`${isDark ? 'text-gray-400' : 'text-slate-600'}`}>إدارة الأعضاء والصلاحيات في شركتك.</p>
                </div>
                 {canManageTeam && teamMembers.length > 0 && (
                    <HoloButton icon={Plus} onClick={() => setIsInviteModalOpen(true)}>{t.inviteMember}</HoloButton>
                )}
            </div>
            
            {renderContent()}

            {isInviteModalOpen && <InviteMemberModal onClose={() => setIsInviteModalOpen(false)} onSuccess={handleInviteSuccess} />}
        </div>
    );
};
