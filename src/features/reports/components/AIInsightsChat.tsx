
import React, { useState, useRef, useEffect } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { Brain, Send, User, AlertTriangle, WifiOff, Loader } from 'lucide-react';
import { HoloButton } from '../../../components/ui/HoloButton';
import { useQuery } from '@tanstack/react-query';
import { reportService } from '../../../services/reportService';
import { marked } from 'marked';
import { callAIProxy } from '../../../lib/aiClient';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
}

export const AIInsightsChat: React.FC = () => {
  const { theme, lang, isOffline, currentCompany } = useZustandStore(state => ({
    theme: state.theme,
    lang: state.lang,
    isOffline: state.isOffline,
    currentCompany: state.currentCompany
  }));
  const t = translations[lang];

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load Financial Context
  const { data: incomeStatement } = useQuery({
      queryKey: ['chatContext', 'income', currentCompany?.id],
      queryFn: reportService.getIncomeStatement,
      enabled: !!currentCompany?.id
  });

  const { data: balanceSheet } = useQuery({
      queryKey: ['chatContext', 'balance', currentCompany?.id],
      queryFn: reportService.getBalanceSheet,
      enabled: !!currentCompany?.id
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (query?: string) => {
    const currentInput = query || input;
    if (!currentInput.trim() || isLoading) return;

    const userMessage: ChatMessage = { id: `user-${Date.now()}`, role: 'user', content: currentInput };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);
    setInput('');

    if (isOffline) {
        setError(t.errorGeneratingResponse + " (Offline)");
        setIsLoading(false);
        return;
    }

    try {
        // Prepare simplified context
        const incomeSummary = incomeStatement?.data?.map(r => ({ type: r.account_type, name: r.account_name, amount: r.net_amount })) || [];
        const balanceSummary = balanceSheet?.data?.map(r => ({ type: r.account_type, name: r.account_name, amount: r.balance })) || [];

        const context = `
        Financial Data Context:
        - Income Statement: ${JSON.stringify(incomeSummary.slice(0, 20))}
        - Balance Sheet: ${JSON.stringify(balanceSummary.slice(0, 20))}
        `;
        
        const prompt = `You are a financial analyst AI. Answer the user's question based on the provided financial reports (Income Statement & Balance Sheet).
        Be concise, professional, and use Markdown. Language: ${lang === 'ar' ? 'Arabic' : 'English'}.

        User Question: "${currentInput}"
        
        ${context}
        `;

        const responseText = await callAIProxy(prompt);

        const modelResponse: ChatMessage = {
            id: `model-${Date.now()}`,
            role: 'model',
            content: responseText || t.errorGeneratingResponse,
        };
        setMessages(prev => [...prev, modelResponse]);

    } catch (e) {
        console.error("AI chat error:", e);
        setError(t.errorGeneratingResponse);
    } finally {
        setIsLoading(false);
    }
  };

  const Message: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isUser = message.role === 'user';
    const Icon = isUser ? User : Brain;
    const bg = isUser 
      ? (theme === 'dark' ? 'bg-cyan-500/10' : 'bg-cyan-50')
      : (theme === 'dark' ? 'bg-gray-700/50' : 'bg-slate-100');
    
    return (
      <div className={`flex items-start gap-3 ${isUser ? `flex-row-reverse` : ''}`}>
        <div className={`p-2 rounded-lg ${isUser ? 'bg-cyan-500/20 text-cyan-300' : 'bg-purple-500/20 text-purple-300'}`}><Icon size={20} /></div>
        <div className={`p-4 rounded-lg max-w-lg ${bg}`}>
            {isUser ? (
                <p className="whitespace-pre-wrap">{message.content}</p>
            ) : (
                <div 
                    className="prose prose-sm prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: marked(message.content) as string }}
                />
            )}
        </div>
      </div>
    );
  };
  
  const exampleQueries = [
    lang === 'ar' ? "ما هو صافي الربح؟" : "What is the net profit?",
    lang === 'ar' ? "هل الميزانية متوازنة؟" : "Is the balance sheet balanced?",
    lang === 'ar' ? "ما هي أكبر المصروفات؟" : "What are the biggest expenses?"
  ];

  return (
    <div className={`rounded-2xl border ${theme === 'dark' ? 'bg-slate-900 border-gray-700' : 'bg-white border-slate-200 shadow-sm'} flex flex-col h-[70vh]`}>
      <div className={`p-4 border-b ${theme === 'dark' ? 'border-gray-800' : 'border-slate-200'} flex items-center justify-between`}>
        <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} flex items-center gap-2`}>
            <Brain className="text-purple-400" /> {t.aiInsightsChat}
        </h2>
        {isOffline && <div className="flex items-center gap-2 text-red-400"><WifiOff size={16} />{t.offline}</div>}
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && !isLoading && (
            <div className="text-center text-gray-500 h-full flex flex-col justify-center">
                <Brain size={48} className="mx-auto text-gray-600 mb-4"/>
                <h3 className="font-semibold text-lg mb-2">محلل مالي ذكي</h3>
                <p>اسأل عن تقاريرك المالية، الأرباح، والميزانية.</p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {exampleQueries.map((q, i) => (
                        <button key={i} onClick={() => handleSend(q)} className="px-3 py-2 bg-gray-800 rounded-lg text-sm hover:bg-gray-700">
                            {q}
                        </button>
                    ))}
                </div>
            </div>
        )}
        {messages.map(msg => <Message key={msg.id} message={msg} />)}
        {isLoading && (
            <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-500/20 text-purple-300 rounded-lg"><Brain size={20}/></div>
                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-slate-100'}`}>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse" />
                        <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                        <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                    </div>
                </div>
            </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className={`p-4 border-t ${theme === 'dark' ? 'border-gray-800' : 'border-slate-200'}`}>
        {error && <div className="flex items-center gap-2 text-red-400 mb-2"><AlertTriangle size={16} /> {error}</div>}
        <div className="flex gap-2 items-center">
          <input 
            type="text" 
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder={t.askAboutYourData}
            disabled={isLoading || isOffline}
            className={`flex-1 px-4 py-2.5 rounded-lg border focus:outline-none transition-colors ${theme === 'dark' ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-slate-800 border-slate-300'} disabled:opacity-50`}
          />
          <HoloButton variant="primary" onClick={() => handleSend()} disabled={isLoading || !input.trim() || isOffline}>
            {isLoading ? <Loader size={18} className="animate-spin" /> : <Send size={18} />}
          </HoloButton>
        </div>
      </div>
    </div>
  );
};
