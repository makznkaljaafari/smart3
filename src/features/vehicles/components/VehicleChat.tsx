
import React, { useState, useRef, useEffect } from 'react';
import { Vehicle } from '../types';
import { useZustandStore } from '../../../store/useStore';
import { vehicleService } from '../../../services/vehicleService';
import { Send, Bot, User, Loader, Sparkles } from 'lucide-react';
import { HoloButton } from '../../../components/ui/HoloButton';
import { marked } from 'marked';

interface VehicleChatProps {
    vehicle: Vehicle;
}

export const VehicleChat: React.FC<VehicleChatProps> = ({ vehicle }) => {
    const { lang, theme } = useZustandStore();
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<{ role: 'user' | 'model', content: string }[]>([
        { role: 'model', content: lang === 'ar' ? `مرحباً! أنا مساعدك الذكي الخاص بسيارة ${vehicle.make} ${vehicle.model}. كيف يمكنني مساعدتك اليوم؟` : `Hello! I'm your AI assistant for this ${vehicle.make} ${vehicle.model}. How can I help you?` }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const isDark = theme === 'dark';

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;
        
        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);

        try {
            const responseText = await vehicleService.chatWithVehicle(vehicle, userMsg, messages, lang as 'ar' | 'en');
            if (responseText) {
                setMessages(prev => [...prev, { role: 'model', content: responseText }]);
            }
        } catch (e) {
            console.error(e);
            setMessages(prev => [...prev, { role: 'model', content: lang === 'ar' ? 'عذراً، حدث خطأ أثناء المعالجة.' : 'Sorry, an error occurred.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full min-h-[400px]">
            {/* Chat Area */}
            <div className={`flex-1 overflow-y-auto p-4 space-y-4 rounded-xl border mb-4 ${isDark ? 'bg-gray-900/50 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                {messages.map((msg, idx) => {
                    const isUser = msg.role === 'user';
                    return (
                        <div key={idx} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isUser ? 'bg-cyan-500 text-white' : 'bg-purple-500 text-white'}`}>
                                {isUser ? <User size={16} /> : <Bot size={16} />}
                            </div>
                            <div className={`p-3 rounded-2xl max-w-[80%] text-sm leading-relaxed shadow-sm ${
                                isUser 
                                    ? (isDark ? 'bg-cyan-500/20 text-cyan-100 rounded-tr-sm' : 'bg-cyan-100 text-cyan-900 rounded-tr-sm') 
                                    : (isDark ? 'bg-gray-800 text-gray-200 rounded-tl-sm' : 'bg-white text-gray-800 rounded-tl-sm')
                            }`}>
                                <div dangerouslySetInnerHTML={{ __html: marked(msg.content) as string }} />
                            </div>
                        </div>
                    );
                })}
                {isLoading && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
                            <Bot size={16} className="text-white" />
                        </div>
                        <div className={`p-3 rounded-2xl bg-gray-800 text-gray-400 text-sm flex items-center gap-2`}>
                            <Sparkles size={14} className="animate-pulse text-purple-400" />
                            <span>Thinking...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    placeholder={lang === 'ar' ? "اسأل عن الصيانة، قطع الغيار، أو قيمة السيارة..." : "Ask about maintenance, parts, or value..."}
                    className={`flex-1 p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-slate-300 text-slate-900'}`}
                    disabled={isLoading}
                />
                <HoloButton onClick={handleSend} disabled={isLoading || !input.trim()} variant="primary" className="!p-3 !rounded-xl">
                    {isLoading ? <Loader size={20} className="animate-spin" /> : <Send size={20} />}
                </HoloButton>
            </div>
        </div>
    );
};
