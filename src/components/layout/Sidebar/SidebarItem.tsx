
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useZustandStore } from '../../../store/useStore';
import { LucideIcon } from 'lucide-react';
import { Tooltip } from '../../ui/Tooltip';

interface SidebarItemProps {
  path: string;
  icon: LucideIcon;
  label: string;
  isCollapsed: boolean;
  isRTL: boolean;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({ path, icon: Icon, label, isCollapsed, isRTL }) => {
  const { theme, setState } = useZustandStore(state => ({ 
    theme: state.theme, 
    setState: useZustandStore.setState 
  }));
  const navigate = useNavigate();
  const location = useLocation();
  
  const isDark = !theme.startsWith('light');
  const isActive = location.pathname === path;

  const handleClick = () => {
    navigate(path);
    setState({ mobileMenuOpen: false });
  };

  const ButtonElement = (
    <button
      onClick={handleClick}
      // Removed native title if using custom tooltip logic (handled below)
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group relative ${isCollapsed ? 'justify-center' : ''} ${
        isActive
          ? (isDark
              ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)] border border-cyan-500/30'
              : 'bg-cyan-50 text-cyan-700 font-semibold')
          : (isDark 
              ? 'text-gray-400 hover:text-white hover:bg-white/5' 
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100')
      }`}
    >
      {/* Active Indicator Line */}
      {isActive && !isCollapsed && (
          <div className={`absolute ${isRTL ? 'right-0' : 'left-0'} top-1/2 -translate-y-1/2 w-1 h-6 rounded-full ${isDark ? 'bg-cyan-400' : 'bg-cyan-600'}`} />
      )}
      
      <Icon size={20} className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
      
      {!isCollapsed && <span className="font-medium">{label}</span>}
      
      {isActive && !isCollapsed && (
         <div className={`absolute ${isRTL ? 'left-3' : 'right-3'} w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_cyan]`}/>
      )}
    </button>
  );

  if (isCollapsed) {
    return <Tooltip content={label} position="right">{ButtonElement}</Tooltip>;
  }

  return ButtonElement;
};
