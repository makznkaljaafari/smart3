
import React from 'react';
import { TeamMember } from '../types';
import { Shield, Users2, User, Mail, Calendar, Loader, Trash2 } from 'lucide-react';

interface RoleBadgeProps {
    role: string;
    t: any;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, t }) => {
    const roleConfig: Record<string, { label: string; color: string, icon: React.ElementType }> = {
        owner: { label: t.owner, color: 'bg-purple-500/20 text-purple-400 border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.2)]', icon: Shield },
        admin: { label: t.admin, color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]', icon: Shield },
        manager: { label: t.manager, color: 'bg-green-500/20 text-green-400 border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.2)]', icon: Users2 },
        employee: { label: t.employee, color: 'bg-gray-500/20 text-gray-400 border-gray-500/50', icon: User }
    };
    const config = roleConfig[role] || roleConfig.employee;
    const Icon = config.icon;
    
    return (
        <div className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border ${config.color}`}>
            <Icon size={12} />
            <span className="font-bold uppercase tracking-wider">{config.label}</span>
        </div>
    );
};

interface TeamMemberCardProps { 
    member: TeamMember;
    t: any;
    isDark: boolean;
    onRemove: (m: TeamMember) => void;
    canRemove: boolean;
    isRemoving: boolean;
}

export const TeamMemberCard: React.FC<TeamMemberCardProps> = ({ member, t, isDark, onRemove, canRemove, isRemoving }) => (
    <div className={`relative group p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1 ${isDark ? 'bg-gray-900/60 border-white/10 hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]' : 'bg-white border-slate-200 shadow-sm hover:shadow-lg'}`}>
        <div className="flex justify-between items-start mb-4">
             <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold shadow-inner ${isDark ? 'bg-gray-800 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {member.avatar_url ? (
                    <img src={member.avatar_url} alt={member.full_name} className="w-full h-full object-cover rounded-2xl" />
                ) : (
                    member.full_name ? member.full_name[0].toUpperCase() : <User />
                )}
            </div>
            <RoleBadge role={member.role} t={t} />
        </div>
        
        <div>
            <h3 className={`font-bold text-lg mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{member.full_name}</h3>
            <div className={`flex items-center gap-2 text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                <Mail size={14} />
                <span className="truncate">{member.email}</span>
            </div>
            
            <div className={`pt-4 border-t flex items-center justify-between ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
                <div className={`flex items-center gap-1.5 text-xs ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                    <Calendar size={12} />
                    <span>{new Date(member.joinedAt).toLocaleDateString()}</span>
                </div>
                
                {canRemove && (
                    <button 
                        onClick={() => onRemove(member)}
                        disabled={isRemoving}
                        className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 disabled:opacity-50 transition-colors"
                        title={t.remove}
                    >
                        {isRemoving ? <Loader size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                )}
            </div>
        </div>
    </div>
);
