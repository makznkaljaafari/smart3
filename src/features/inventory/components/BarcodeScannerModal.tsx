
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { X, Loader, CameraOff } from 'lucide-react';

interface BarcodeScannerModalProps {
    onClose: () => void;
    onScan: (barcode: string) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({ onClose, onScan }) => {
    const { theme, lang } = useZustandStore();
    const t = translations[lang];
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const animationFrameIdRef = useRef<number | null>(null);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }, []);

    useEffect(() => {
        const startScan = async () => {
            if (!('BarcodeDetector' in window)) {
                setError(t.barcodeApiNotSupported);
                setIsLoading(false);
                return;
            }

            try {
                streamRef.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                if (videoRef.current) {
                    videoRef.current.srcObject = streamRef.current;
                    videoRef.current.onloadedmetadata = () => {
                        videoRef.current?.play();
                        setIsLoading(false);

                        const barcodeDetector = new (window as any).BarcodeDetector({ formats: ['ean_13', 'code_128', 'qr_code', 'upc_a'] });

                        const detect = async () => {
                            if (videoRef.current && videoRef.current.readyState === 4) { // HAVE_ENOUGH_DATA
                                try {
                                    const barcodes = await barcodeDetector.detect(videoRef.current);
                                    if (barcodes.length > 0 && barcodes[0].rawValue) {
                                        onScan(barcodes[0].rawValue);
                                        stopCamera();
                                        return; // Stop the loop
                                    }
                                } catch (detectError) {
                                    console.error("Barcode detection error:", detectError);
                                }
                            }
                            animationFrameIdRef.current = requestAnimationFrame(detect);
                        };
                        detect();
                    };
                }
            } catch (err: any) {
                console.error("Camera error:", err);
                if (err.name === 'NotAllowedError') {
                    setError(t.cameraPermissionDenied);
                } else {
                    setError(t.cameraError);
                }
                setIsLoading(false);
            }
        };

        startScan();

        return () => {
            stopCamera();
            if (animationFrameIdRef.current) {
                cancelAnimationFrame(animationFrameIdRef.current);
            }
        };
    }, [onScan, stopCamera, t]);

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onMouseDown={onClose}>
            <div
                className="relative w-full max-w-2xl h-[60vh] flex flex-col rounded-2xl shadow-2xl bg-black border-2 border-cyan-500/50 overflow-hidden"
                onMouseDown={e => e.stopPropagation()}
            >
                <div className="absolute top-2 right-2 z-20">
                    <button onClick={onClose} className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70"><X size={24} /></button>
                </div>
                {isLoading && <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-white"><Loader className="animate-spin" size={48}/>{t.startingCamera}...</div>}
                {error && <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-red-400 p-8 text-center"><CameraOff size={48} />{error}</div>}
                
                <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />

                {!isLoading && !error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                        <div className="w-[80%] max-w-[400px] h-[50%] max-h-[200px] border-4 border-white/50 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]" />
                        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-red-500 animate-pulse" />
                        <p className="mt-4 text-white font-semibold text-lg drop-shadow-md">{t.placeBarcodeInFrame}</p>
                    </div>
                )}
            </div>
        </div>
    );
};