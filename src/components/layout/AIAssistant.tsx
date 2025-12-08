
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { WifiOff, Mic, X, Loader, MicOff } from 'lucide-react';
import { useZustandStore } from '../../store/useStore';
import { translations } from '../../lib/i18n';
import { Toast } from '../../types';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { useDraggableAndResizable } from '../../hooks/useDraggableAndResizable';
import { config as appConfig } from '../../lib/config';

// Types and Helper Functions
type AIAssistantStatus = 'idle' | 'listening' | 'processing' | 'error';

function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

// Audio Visualizer Component
const AudioVisualizer: React.FC<{ isActive: boolean; analyser: AnalyserNode | null }> = ({ isActive, analyser }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!isActive || !analyser || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        let animationId: number;

        const draw = () => {
            animationId = requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const barWidth = (canvas.width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i] / 2;
                // Use a neon gradient or color
                const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
                gradient.addColorStop(0, '#a855f7'); // purple-500
                gradient.addColorStop(1, '#06b6d4'); // cyan-500
                
                ctx.fillStyle = gradient;
                ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

                x += barWidth + 1;
            }
        };

        draw();

        return () => cancelAnimationFrame(animationId);
    }, [isActive, analyser]);

    return (
        <canvas 
            ref={canvasRef} 
            width={280} 
            height={60} 
            className="w-full h-16 rounded-lg bg-black/20 backdrop-blur-sm"
        />
    );
};


export const AIAssistant = () => {
  const { lang, isOffline, settings } = useZustandStore(state => ({
    lang: state.lang,
    isOffline: state.isOffline,
    settings: state.settings,
  }));
  const setState = useZustandStore.setState;

  const [status, setStatus] = useState<AIAssistantStatus>('idle');
  const [feedback, setFeedback] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const t = translations[lang];
  
  // Draggable logic for the button
  const { modalRef, position, handleDragStart } = useDraggableAndResizable({ 
      initialSize: { width: 64, height: 64 }
  });

  // sessionPromise holds the live session connection
  const sessionPromise = useRef<Promise<any> | null>(null);
  const inputAudioContext = useRef<AudioContext | null>(null);
  const outputAudioContext = useRef<AudioContext | null>(null);
  const audioSources = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef(0);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  
  // Visualizer State
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const newToast: Toast = { id: crypto.randomUUID(), message, type, duration: 5000 };
    setState(s => ({ ...s, toasts: [...s.toasts, newToast] }));
  }, [setState]);

  const cleanupAudio = () => {
      if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(track => track.stop());
          mediaStreamRef.current = null;
      }
      if (scriptProcessorRef.current) {
          scriptProcessorRef.current.disconnect();
          scriptProcessorRef.current = null;
      }
      if (mediaStreamSourceRef.current) {
          mediaStreamSourceRef.current.disconnect();
          mediaStreamSourceRef.current = null;
      }
      if (inputAudioContext.current && inputAudioContext.current.state !== 'closed') {
          inputAudioContext.current.close().catch(console.error);
          inputAudioContext.current = null;
      }
      audioSources.current.forEach(source => source.stop());
      audioSources.current.clear();
      if (outputAudioContext.current && outputAudioContext.current.state !== 'closed') {
          outputAudioContext.current.close().catch(console.error);
          outputAudioContext.current = null;
      }
      nextStartTimeRef.current = 0;
      setAnalyser(null);
  };

  const closeSession = useCallback(async () => {
    if (sessionPromise.current) {
        try {
            const session = await sessionPromise.current;
            session.close();
        } catch (e) {
            console.error("Error closing session:", e);
        } finally {
            cleanupAudio();
            sessionPromise.current = null;
            setStatus('idle');
            setFeedback('');
            setIsExpanded(false);
        }
    } else {
        cleanupAudio();
        setStatus('idle');
        setFeedback('');
        setIsExpanded(false);
    }
  }, []);

  const handleToggle = useCallback(async () => {
    if (status === 'listening' || status === 'processing') {
      await closeSession();
      return;
    }

    if (isOffline) {
      addToast(t.aiAssistantRequiresInternet || 'AI Assistant requires an internet connection.', 'error');
      return;
    }
    
    // NOTE: Live API currently requires a direct client connection via WebSocket.
    const apiKey = appConfig.gemini.apiKey;
    
    if (!apiKey) {
         addToast(lang === 'ar' ? 'مفتاح الذكاء الاصطناعي غير متوفر للمحادثة المباشرة.' : 'AI Key not configured for Live API.', 'error');
         return;
    }
    
    // Check permissions
    try {
        const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        if (permission.state === 'denied') {
            addToast(lang === 'ar' ? 'تم رفض الوصول للميكروفون.' : 'Microphone access denied.', 'error');
            return;
        }
    } catch(e) { console.warn("Could not query microphone permission:", e); }

    setStatus('listening');
    setFeedback(t.listening);
    setIsExpanded(true);

    const ai = new GoogleGenAI({ apiKey });
    
    // Setup Audio Contexts
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    inputAudioContext.current = new AudioContextClass({ sampleRate: 16000 });
    outputAudioContext.current = new AudioContextClass({ sampleRate: 24000 });
    nextStartTimeRef.current = 0;
    
    // Setup Visualizer Analyser
    const newAnalyser = inputAudioContext.current.createAnalyser();
    newAnalyser.fftSize = 256;
    setAnalyser(newAnalyser);

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaStreamRef.current = stream;
    
    sessionPromise.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction: `You are a voice-activated financial assistant. Respond briefly. Language: ${lang}. Base Currency: ${settings.baseCurrency}.`,
        },
        callbacks: {
            onopen: () => {
                if (!inputAudioContext.current || inputAudioContext.current.state === 'closed') return;
                const source = inputAudioContext.current.createMediaStreamSource(stream);
                mediaStreamSourceRef.current = source;
                const processor = inputAudioContext.current.createScriptProcessor(4096, 1, 1);
                scriptProcessorRef.current = processor;
                
                // Connect source to analyser for visualization
                source.connect(newAnalyser);
                
                processor.onaudioprocess = (event) => {
                    const inputData = event.inputBuffer.getChannelData(0);
                    const pcmBlob = createBlob(inputData);
                    sessionPromise.current?.then((session) => {
                        if (session) session.sendRealtimeInput({ media: pcmBlob });
                    });
                };
                source.connect(processor);
                processor.connect(inputAudioContext.current.destination);
            },
            onmessage: async (message: LiveServerMessage) => {
                const parts = message.serverContent?.modelTurn?.parts;
                const audioData = parts?.[0]?.inlineData?.data;
                if (audioData && outputAudioContext.current && outputAudioContext.current.state !== 'closed') {
                    const outCtx = outputAudioContext.current;
                    nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outCtx.currentTime);

                    const audioBuffer = await decodeAudioData(decode(audioData), outCtx, 24000, 1);
                    const source = outCtx.createBufferSource();
                    source.buffer = audioBuffer;
                    source.connect(outCtx.destination);
                    source.addEventListener('ended', () => { audioSources.current.delete(source); });
                    source.start(nextStartTimeRef.current);
                    nextStartTimeRef.current += audioBuffer.duration;
                    audioSources.current.add(source);
                }
            },
            onerror: (e: ErrorEvent) => {
                console.error('Live session error:', e);
                addToast('AI assistant connection error.', 'error');
                closeSession();
            },
            onclose: (e: CloseEvent) => {
                closeSession();
            }
        }
    });
  }, [closeSession, isOffline, addToast, t, lang, settings.baseCurrency, status]);

  useEffect(() => {
    return () => {
        closeSession();
    };
  }, [closeSession]);


  // Button classes logic
  const isActive = status === 'listening' || status === 'processing';
  const glowColor = status === 'error' ? 'red' : (isActive ? 'cyan' : 'purple');
  
  return (
    <div 
        ref={modalRef}
        className="fixed z-[60] touch-none"
        style={{ 
            // Default position (bottom right) if not dragged
            right: position.x === 0 ? '1.5rem' : 'auto', 
            bottom: position.y === 0 ? '5rem' : 'auto',
            left: position.x > 0 ? `${position.x}px` : 'auto',
            top: position.y > 0 ? `${position.y}px` : 'auto',
        }}
    >
      <div className="relative flex flex-col items-end">
        {/* Expanded Panel */}
        {isExpanded && (
             <div className="mb-4 w-80 p-4 rounded-2xl bg-[rgba(15,23,42,0.9)] border border-cyan-500/50 backdrop-blur-xl shadow-[0_0_40px_rgba(6,182,212,0.3)] animate-modal-enter origin-bottom-right">
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${status === 'listening' ? 'bg-red-500 animate-pulse' : 'bg-cyan-500'}`}></div>
                        <span className="text-cyan-300 font-semibold text-sm">{status === 'listening' ? 'Listening...' : 'Processing...'}</span>
                    </div>
                    <button onClick={closeSession} className="text-gray-400 hover:text-white"><X size={16} /></button>
                </div>
                
                <AudioVisualizer isActive={status === 'listening'} analyser={analyser} />
                
                <p className="mt-3 text-xs text-gray-400 text-center">{feedback || 'Say "Add expense 50 riyals for fuel"...'}</p>
            </div>
        )}

        {/* Main Button */}
        <button
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          onClick={handleToggle}
          disabled={isOffline}
          className={`
            w-16 h-16 rounded-full flex items-center justify-center 
            transition-all duration-300 relative overflow-hidden cursor-pointer
            shadow-lg hover:scale-105 active:scale-95
            ${isOffline ? 'bg-gray-700 cursor-not-allowed' : 'bg-black'}
          `}
          style={{
              boxShadow: isActive 
                ? `0 0 30px rgba(${glowColor === 'cyan' ? '6,182,212' : '239,68,68'}, 0.6), inset 0 0 20px rgba(255,255,255,0.2)` 
                : `0 0 20px rgba(168,85,247, 0.4)`
          }}
        >
            {/* Button Background Animation */}
            <div className={`absolute inset-0 bg-gradient-to-br from-purple-600 to-blue-600 opacity-80 transition-opacity ${isActive ? 'opacity-100' : ''}`}></div>
            
            {/* Content Icon */}
            <div className="relative z-10 text-white">
                 {isOffline ? <WifiOff size={24} /> : (
                     isActive ? <Mic size={28} className="animate-pulse" /> : <MicOff size={24} />
                 )}
            </div>
            
            {/* Rings Animation */}
            {!isOffline && !isActive && (
                 <div className="absolute inset-0 border-2 border-purple-500/50 rounded-full animate-ping" style={{ animationDuration: '3s' }}></div>
            )}
        </button>
      </div>
    </div>
  );
};
