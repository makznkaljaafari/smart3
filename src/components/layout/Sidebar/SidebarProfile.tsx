
import React from 'react';
import { useZustandStore } from '../../../store/useStore';
import { CompanySwitcher } from '../../common/CompanySwitcher';

interface SidebarProfileProps {
  isCollapsed: boolean;
  isDark: boolean;
}

export const SidebarProfile: React.FC<SidebarProfileProps> = ({ isCollapsed, isDark }) => {
  const { profile } = useZustandStore(state => ({ profile: state.settings.profile }));

  const containerClass = `p-4 flex-shrink-0 ${isDark ? 'bg-black/20 border-t border-white/5' : 'bg-slate-50 border-t border-slate-200'}`;

  if (isCollapsed) {
    return (
      <div className={containerClass}>
        <div className="flex justify-center">
          <div 
            className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold shadow-lg cursor-pointer" 
            title={profile.name}
          >
            {profile.name?.[0]?.toUpperCase() || 'U'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold shadow-[0_0_15px_rgba(168,85,247,0.4)] flex-shrink-0 border border-white/10">
            {profile.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`font-semibold text-sm truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{profile.name}</p>
            <p className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{profile.phone || 'No Phone'}</p>
          </div>
        </div>
        <CompanySwitcher />
      </div>
    </div>
  );
};
