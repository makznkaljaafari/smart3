
import React, { useRef, useState, useEffect } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { X, Camera, RefreshCw, Zap } from 'lucide-react';
import { HoloButton } from '../../../components/ui/HoloButton';
import { vehicleService } from '../../../services/vehicleService';
import { VINScanResult } from '../types';

interface VinScannerModalProps {
    onClose: () => void;
    onScanSuccess: (data: VINScanResult) => void;
}

export const VinScannerModal: React.FC<VinScannerModalProps> = ({ onClose, onScanSuccess }) => {
    const { theme } = useZustandStore();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } 
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            setError("Failed to access camera. Please ensure permissions are granted.");
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    };

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, []);

    const captureAndScan = async () => {
        if (!videoRef.current || !canvasRef.current) return;
        
        setIsScanning(true);
        setError(null);

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (context) {
            // Capture frame
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Convert to base64
            const imageBase64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

            try {
                const result = await vehicleService.extractDataFromImage(imageBase64, 'image/jpeg');
                if (result && result.vin) {
                    onScanSuccess(result);
                    onClose();
                } else {
                    setError("Could not detect a valid VIN. Please try again with better lighting.");
                }
            } catch (e) {
                setError("AI Scan failed. Please try again.");
            } finally {
                setIsScanning(false);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 z-[100] flex flex-col items-center justify-center p-4">
            <div className="relative w-full max-w-md bg-gray-900 rounded-2xl overflow-hidden border border-cyan-500/30 shadow-2xl">
                {/* Header */}
                <div className="p-4 flex justify-between items-center bg-gray-800/50 border-b border-gray-700">
                    <h3 className="text-white font-bold flex items-center gap-2">
                        <Camera className="text-cyan-400" /> AI VIN Scanner
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24}/></button>
                </div>

                {/* Camera Viewport */}
                <div className="relative aspect-[3/4] bg-black">
                    {!error ? (
                        <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline 
                            className={`w-full h-full object-cover ${isScanning ? 'opacity-50' : 'opacity-100'}`} 
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-red-400 p-8 text-center border-2 border-red-500/20 m-4 rounded-xl">
                            {error}
                        </div>
                    )}

                    {/* Scanning Overlay */}
                    {isScanning && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                            <div className="w-20 h-20 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-cyan-400 font-bold bg-black/60 px-4 py-1 rounded-full animate-pulse backdrop-blur-md">Analyzing Image...</p>
                        </div>
                    )}

                    {/* Guidelines */}
                    <div className="absolute inset-0 pointer-events-none border-[2px] border-white/20 m-8 rounded-lg z-10">
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-cyan-500 -mt-1 -ml-1 rounded-tl-lg"></div>
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-cyan-500 -mt-1 -mr-1 rounded-tr-lg"></div>
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-cyan-500 -mb-1 -ml-1 rounded-bl-lg"></div>
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-cyan-500 -mb-1 -mr-1 rounded-br-lg"></div>
                        <div className="absolute top-1/2 left-0 right-0 h-px bg-red-500/50"></div>
                    </div>
                </div>

                {/* Controls */}
                <div className="p-6 bg-gray-800/50 border-t border-gray-700 flex justify-center gap-4">
                    {error ? (
                         <HoloButton variant="secondary" onClick={() => { setError(null); startCamera(); }}>
                            <RefreshCw className="mr-2" /> Retry Camera
                         </HoloButton>
                    ) : (
                        <button 
                            onClick={captureAndScan}
                            disabled={isScanning}
                            className="w-16 h-16 rounded-full bg-white border-4 border-gray-300 flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)] active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                        >
                            <div className="w-12 h-12 rounded-full bg-cyan-500 border-2 border-white flex items-center justify-center">
                                <Zap size={20} className="text-white fill-current" />
                            </div>
                        </button>
                    )}
                </div>
                
                {/* Hidden Canvas for Capture */}
                <canvas ref={canvasRef} className="hidden" />
            </div>
        </div>
    );
};
