
import React, { useRef, useEffect } from 'react';
import { useZustandStore } from '../../store/useStore';
import { AppTheme } from '../../types';

interface NeuralBackgroundProps {
    theme: AppTheme;
}

const accentColorsRGB: Record<string, string> = {
  cyan: '6, 182, 212',
  purple: '168, 85, 247',
  green: '34, 197, 94',
  orange: '249, 115, 22',
  red: '239, 68, 68',
  yellow: '234, 179, 8',
};

export const NeuralBackground: React.FC<NeuralBackgroundProps> = ({ theme }) => {
  const accentColor = useZustandStore(state => state.settings.appearance.accentColor);
  const ref = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    
    let raf = 0;
    
    const resize = () => {
      const parent = c.parentElement;
      if (parent) {
        c.width = window.innerWidth;
        c.height = window.innerHeight;
      }
    };
    
    const handleMouseMove = (e: MouseEvent) => {
        mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);
    resize();

    const currentAccentRGB = accentColorsRGB[accentColor] || accentColorsRGB.cyan;
    // Optimized particle count for better performance
    const particleCount = Math.min(40, Math.floor(window.innerWidth / 40));
    
    const particles = Array.from({ length: particleCount }).map(() => ({
      x: Math.random() * c.width,
      y: Math.random() * c.height,
      vx: (Math.random() - 0.5) * 0.2, // Slower for smoother feel
      vy: (Math.random() - 0.5) * 0.2,
      r: Math.random() * 1.5 + 0.5,
    }));

    const draw = () => {
      // Clear with full transparency
      ctx.clearRect(0, 0, c.width, c.height);
      
      const mouseRadius = 150;

      particles.forEach((p, i) => {
        // Basic Movement
        p.x += p.vx;
        p.y += p.vy;

        // Boundary bounce
        if (p.x < 0 || p.x > c.width) p.vx *= -1;
        if (p.y < 0 || p.y > c.height) p.vy *= -1;

        // Mouse repulsion/attraction (Simplified math)
        const dxMouse = p.x - mouseRef.current.x;
        const dyMouse = p.y - mouseRef.current.y;
        
        // Optimization: Squared distance check avoids Math.sqrt for far particles
        const distMouseSq = dxMouse * dxMouse + dyMouse * dyMouse;
        const mouseRadiusSq = mouseRadius * mouseRadius;

        if (distMouseSq < mouseRadiusSq) {
            const distMouse = Math.sqrt(distMouseSq);
            const forceDirectionX = dxMouse / distMouse;
            const forceDirectionY = dyMouse / distMouse;
            const force = (mouseRadius - distMouse) / mouseRadius;
            p.vx += forceDirectionX * force * 0.05;
            p.vy += forceDirectionY * force * 0.05;
        }

        // Draw Particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${currentAccentRGB}, 0.3)`;
        ctx.fill();

        // Draw Connections (Limit checks)
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const distSq = dx * dx + dy * dy;
          
          // Connect nearby particles (distance < 150) -> 150^2 = 22500
          if (distSq < 22500) {
            const dist = Math.sqrt(distSq);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            const opacity = 0.12 * (1 - dist / 150);
            ctx.strokeStyle = `rgba(${currentAccentRGB}, ${opacity})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
        
        // Connect to Mouse
        if (distMouseSq < 22500) {
            const distMouse = Math.sqrt(distMouseSq);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouseRef.current.x, mouseRef.current.y);
            const opacity = 0.15 * (1 - distMouse / 150);
            ctx.strokeStyle = `rgba(${currentAccentRGB}, ${opacity})`;
            ctx.stroke();
        }
      });

      raf = requestAnimationFrame(draw);
    };
    
    draw();
    
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [theme, accentColor]);

  // Only render on dark themes
  if (theme.startsWith('light')) return null;

  return <canvas ref={ref} className="fixed inset-0 pointer-events-none z-0" aria-hidden="true" />;
};
