
import React from 'react';
import { SectionBox } from '../../../components/ui/SectionBox';
import { AppTheme } from '../../../types';
import { Mail, Code, Phone, MapPin, Globe, Cpu } from 'lucide-react';

interface AboutSectionProps {
  t: any;
  theme: AppTheme;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ t, theme }) => {
  const isDark = theme !== 'light';
  const year = new Date().getFullYear();

  return (
    <SectionBox title={t.about || 'حول التطبيق'} theme={theme}>
      <div className="flex flex-col items-center text-center space-y-6 p-4">
        
        {/* Developer Avatar / Icon */}
        <div className="relative group">
            <div className="absolute inset-0 bg-cyan-500 blur-xl opacity-20 rounded-full group-hover:opacity-40 transition-opacity duration-500"></div>
            <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-slate-800 to-black flex items-center justify-center text-white shadow-2xl border-4 border-white/5 ring-1 ring-cyan-500/30">
               <Code size={48} className="text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
            </div>
            <div className="absolute bottom-1 right-1 w-8 h-8 bg-green-500 rounded-full border-4 border-gray-900 flex items-center justify-center" title="Available for work">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            </div>
        </div>
        
        {/* Name & Title */}
        <div>
            <h3 className={`text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                عبدالكريم الجعفري
            </h3>
            <p className={`text-sm font-semibold tracking-wide uppercase mt-1 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                Full Stack Developer
            </p>
            <div className={`flex items-center justify-center gap-2 mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                <MapPin size={14} className="text-red-500" />
                <span>الجمهورية اليمنية</span>
            </div>
        </div>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl mt-6">
             {/* Phone Card */}
             <a href="tel:00967779816960" className={`p-4 rounded-xl border transition-all duration-300 hover:scale-105 hover:shadow-lg group ${isDark ? 'bg-gray-800/50 border-gray-700 hover:border-green-500/50' : 'bg-white border-slate-200 hover:border-green-400'}`}>
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${isDark ? 'bg-green-500/20 text-green-400 group-hover:bg-green-500/30' : 'bg-green-100 text-green-600'}`}>
                        <Phone size={24} />
                    </div>
                    <div className="text-left">
                        <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Mobile / WhatsApp</p>
                        <p className={`font-mono text-lg font-bold ${isDark ? 'text-gray-100' : 'text-gray-800'}`} dir="ltr">00967 779 816 960</p>
                    </div>
                </div>
             </a>

             {/* Email Card */}
             <a href="mailto:alkarime0@gmail.com" className={`p-4 rounded-xl border transition-all duration-300 hover:scale-105 hover:shadow-lg group ${isDark ? 'bg-gray-800/50 border-gray-700 hover:border-orange-500/50' : 'bg-white border-slate-200 hover:border-orange-400'}`}>
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${isDark ? 'bg-orange-500/20 text-orange-400 group-hover:bg-orange-500/30' : 'bg-orange-100 text-orange-600'}`}>
                        <Mail size={24} />
                    </div>
                    <div className="text-left overflow-hidden">
                        <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Email Address</p>
                        <p className={`font-mono text-base font-bold truncate ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>alkarime0@gmail.com</p>
                    </div>
                </div>
             </a>
        </div>

        {/* App Footer Info */}
        <div className={`mt-10 pt-8 border-t w-full flex flex-col items-center ${isDark ? 'border-gray-800' : 'border-slate-200'}`}>
             <div className="flex items-center gap-2 mb-2">
                <Cpu size={18} className={isDark ? 'text-purple-400' : 'text-purple-600'} />
                <h4 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Smart Finance AI</h4>
             </div>
             <p className={`max-w-md text-sm text-center leading-relaxed ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                تم تطوير هذا النظام لتقديم حلول مالية ذكية وشاملة، مع التركيز على الأداء العالي وتجربة المستخدم السلسة.
            </p>
             <div className={`flex gap-4 mt-6 text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                <span>© {year} Abdulkareem Al-Jafari</span>
                <span>•</span>
                <span>v1.0.0 Enterprise</span>
            </div>
        </div>
      </div>
    </SectionBox>
  );
};
