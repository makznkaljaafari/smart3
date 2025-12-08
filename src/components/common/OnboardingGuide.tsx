
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useZustandStore } from '../../store/useStore';
import { translations } from '../../lib/i18n';
import { HoloButton } from '../ui/HoloButton';
import { X } from 'lucide-react';

const TOUR_STORAGE_KEY = 'onboarding-tour-completed-v1';

export const OnboardingGuide: React.FC = () => {
    const { lang } = useZustandStore();
    const t = translations[lang];

    const steps = useMemo(() => [
        {
            target: '[data-tour-id="sidebar"]',
            title: t.onboardingSidebarTitle,
            content: t.onboardingSidebarContent,
        },
        {
            target: '[data-tour-id="sidebar-profile"]',
            title: t.onboardingProfileTitle,
            content: t.onboardingProfileContent,
        },
        {
            target: '[data-tour-id="main-content"]',
            title: t.onboardingMainContentTitle,
            content: t.onboardingMainContentContent,
        },
        {
            target: '[data-tour-id="dashboard-actions"]',
            title: t.onboardingActionsTitle,
            content: t.onboardingActionsContent,
        },
        {
            target: '[data-tour-id="dashboard-grid"]',
            title: t.onboardingGridTitle,
            content: t.onboardingGridContent,
        },
        {
            target: '[data-tour-id="ai-assistant"]',
            title: t.onboardingAiTitle,
            content: t.onboardingAiContent,
        },
    ], [t]);

    const [currentStep, setCurrentStep] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

    useEffect(() => {
        const hasCompletedTour = localStorage.getItem(TOUR_STORAGE_KEY);
        if (!hasCompletedTour) {
            // Wait for the UI to render before starting the tour
            setTimeout(() => setIsOpen(true), 1500);
        }
    }, []);

    const stopTour = useCallback(() => {
        setIsOpen(false);
        localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    }, []);

    const nextStep = useCallback(() => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            stopTour();
        }
    }, [currentStep, steps.length, stopTour]);

    const updateTargetRect = useCallback(() => {
        if (isOpen && currentStep < steps.length) {
            const step = steps[currentStep];
            const element = document.querySelector(step.target);
            if (element) {
                setTargetRect(element.getBoundingClientRect());
            } else {
                // If element is not found, skip to next step
                nextStep();
            }
        } else {
            setTargetRect(null);
        }
    }, [isOpen, currentStep, steps, nextStep]);

    useEffect(() => {
        updateTargetRect();
        window.addEventListener('resize', updateTargetRect);
        return () => window.removeEventListener('resize', updateTargetRect);
    }, [updateTargetRect]);

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    if (!isOpen || !targetRect) return null;

    const step = steps[currentStep];
    const { top, left, width, height } = targetRect;

    let tooltipTop = top + height + 20;
    let tooltipLeft = left + width / 2;

    // Basic position adjustment to prevent going off-screen
    if (tooltipTop + 220 > window.innerHeight) { // 220 is approx tooltip height
        tooltipTop = top - 240;
    }
    if (tooltipLeft + 160 > window.innerWidth) { // 160 is half of tooltip width (320)
        tooltipLeft = window.innerWidth - 170;
    }
     if (tooltipLeft - 160 < 0) {
        tooltipLeft = 170;
    }


    return (
        <div className="fixed inset-0 z-[200]" onClick={stopTour}>
            {/* This div creates both the dark overlay and the highlight "hole" using box-shadow. */}
            {/* Clicks will not pass through it, solving the interaction problem. */}
            <div
                className="absolute rounded-lg pointer-events-none transition-all duration-300"
                style={{
                    top: top - 4,
                    left: left - 4,
                    width: width + 8,
                    height: height + 8,
                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.7), 0 0 40px rgba(6, 182, 212, 0.5)',
                    border: '2px dashed #0891b2' // cyan-500
                }}
            />
            
            <div 
                className="absolute w-80 bg-gray-900 border border-cyan-500/50 rounded-xl shadow-2xl p-4 transition-all duration-300"
                style={{
                    top: `${tooltipTop}px`,
                    left: `${tooltipLeft}px`,
                    transform: 'translateX(-50%)'
                }}
                onClick={e => e.stopPropagation()} // Prevent closing tour when clicking tooltip
            >
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-lg text-white">{step.title}</h3>
                    <button onClick={stopTour} className="p-1 rounded-full hover:bg-gray-700"><X size={18}/></button>
                </div>
                <p className="text-sm text-gray-300 mb-4">{step.content}</p>
                <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">{currentStep + 1} / {steps.length}</span>
                    <div className="flex gap-2">
                        {currentStep > 0 && <HoloButton onClick={prevStep} variant="secondary" className="!py-1.5 !px-3 !text-sm">{t.onboardingPrevious}</HoloButton>}
                        <HoloButton onClick={nextStep} variant="primary" className="!py-1.5 !px-3 !text-sm">
                            {currentStep === steps.length - 1 ? t.onboardingFinish : t.onboardingNext}
                        </HoloButton>
                    </div>
                </div>
            </div>
        </div>
    );
};
