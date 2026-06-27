import React, { useState, useEffect } from 'react';

interface LoadingScreenProps {
  subtitle?: string;
}

export default function LoadingScreen({ subtitle = "Initializing" }: LoadingScreenProps) {
  const [ellipsis, setEllipsis] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const ellipsisInterval = setInterval(() => {
      setEllipsis(prev => prev.length >= 3 ? '' : prev + '.');
    }, 400);

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 300);

    return () => {
      clearInterval(ellipsisInterval);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{ background: '#0D2B45' }}>
      <style>{`
        @keyframes spin-ring {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>

      {/* Animated ring behind logo */}
      <div className="relative mb-6">
        <div
          className="absolute -inset-4 rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(0,196,180,0.3) 0%, transparent 70%)',
            animation: 'pulse-glow 2s ease-in-out infinite',
          }}
        />
        <div
          className="absolute -inset-3 rounded-full"
          style={{
            border: '2px solid transparent',
            borderTopColor: '#00C4B4',
            animation: 'spin-ring 1.2s linear infinite',
          }}
        />
        <div
          className="absolute -inset-5 rounded-full"
          style={{
            border: '1px solid transparent',
            borderTopColor: 'rgba(0,196,180,0.4)',
            animation: 'spin-ring 2s linear infinite reverse',
          }}
        />

        {/* Concentrix Logo */}
        <img
          src="/assets/images/concentrix-mark.png"
          alt="Concentrix"
          className="h-10 w-auto relative z-10"
          style={{ filter: 'brightness(0) invert(1)' }}
        />
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold mb-2" style={{ color: '#FFFFFF', letterSpacing: '0.02em' }}>
        Concentrix
      </h1>

      {/* Subtitle with animated ellipsis */}
      <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.6)' }}>
        {subtitle}<span style={{ color: '#00C4B4' }}>{ellipsis}</span>
      </p>

      {/* Progress bar */}
      <div className="relative" style={{ width: 200, height: 4 }}>
        <div
          className="absolute inset-0 rounded-full"
          style={{ background: 'rgba(255,255,255,0.1)' }}
        />
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
          style={{
            width: `${Math.min(progress, 100)}%`,
            background: 'linear-gradient(90deg, #00C4B4, #00E6D4)',
            boxShadow: '0 0 12px rgba(0,196,180,0.5)',
          }}
        />
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s ease-in-out infinite',
          }}
        />
      </div>
    </div>
  );
}
