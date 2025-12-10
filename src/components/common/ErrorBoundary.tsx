import React, { Component, ErrorInfo, ReactNode } from 'react';
import { HoloButton } from '../ui/HoloButton';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { translations } from '../../lib/i18n';
import { useZustandStore } from '../../store/useStore';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// Mock Logger Service
const logger = {
    error: (message: string, meta?: any) => {
        // In production, send to Sentry/LogRocket
        console.error(`[AppError]: ${message}`, meta);
    }
};

const FallbackComponent: React.FC<{ onRefresh: () => void, onHome: () => void, error: Error | null }> = ({ onRefresh, onHome, error }) => {
    const { lang, theme } = useZustandStore(state => ({ lang: state.lang, theme: state.theme }));
    const t = translations[lang] || translations['ar'];
    const isDark = theme.startsWith('dark');

    return (
        <div className={`min-h-screen flex items-center justify-center p-4 ${isDark ? 'bg-gray-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
            <div className={`max-w-md w-full rounded-2xl border-2 border-dashed p-8 text-center flex flex-col items-center shadow-2xl ${isDark ? 'border-red-500/30 bg-red-900/10' : 'border-red-200 bg-white'}`}>
                <div className="p-4 rounded-full bg-red-500/10 mb-6">
                    <AlertTriangle className="w-16 h-16 text-red-500" />
                </div>
                
                <h2 className="text-2xl font-bold mb-2">{t.somethingWentWrong || 'Something went wrong'}</h2>
                <p className={`mb-6 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t.unexpectedError || 'An unexpected error occurred. We have logged this issue.'}
                </p>
                
                {error && (
                    <div className="w-full mb-6 p-4 rounded-lg bg-black/20 text-left overflow-auto max-h-32 text-xs font-mono text-red-300 border border-red-500/20">
                        {error.toString()}
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <HoloButton variant="danger" icon={RefreshCw} onClick={onRefresh} className="flex-1 justify-center">
                        {t.tryAgain || 'Try Again'}
                    </HoloButton>
                    <HoloButton variant="secondary" icon={Home} onClick={onHome} className="flex-1 justify-center">
                         {t.dashboard || 'Home'}
                    </HoloButton>
                </div>
            </div>
        </div>
    );
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    // Log error to service
    logger.error(error.message, { stack: error.stack, componentStack: errorInfo.componentStack });
  }
  
  private handleRefresh = () => {
    window.location.reload();
  }

  private handleHome = () => {
      window.location.href = '/';
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return <FallbackComponent onRefresh={this.handleRefresh} onHome={this.handleHome} error={this.state.error} />;
    }
    
    return this.props.children;
  }
}
