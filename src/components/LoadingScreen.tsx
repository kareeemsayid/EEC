import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";

interface LoadingScreenProps {
  subtitle?: string;
  show?: boolean;
}

export default function LoadingScreen({ subtitle = "Loading your workspace", show = true }: LoadingScreenProps) {
  const [ellipsis, setEllipsis] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const ellipsisInterval = setInterval(() => {
      setEllipsis(prev => prev.length >= 3 ? '' : prev + '.');
    }, 400);

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 12;
      });
    }, 350);

    return () => {
      clearInterval(ellipsisInterval);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center"
          style={{ background: '#0D2B45' }}
        >
      <style>{`
        @keyframes spin-ring {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.08); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes ring-pulse {
          0%, 100% { opacity: 0.6; border-width: 2px; }
          50% { opacity: 1; border-width: 3px; }
        }
      `}</style>

      {/* Animated ring behind logo */}
      <div className="relative mb-8">
        {/* Outer glow */}
        <div
          className="absolute -inset-6 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(0,196,180,0.25) 0%, transparent 70%)',
            animation: 'pulse-glow 2.5s ease-in-out infinite',
          }}
        />
        {/* Outer spinning ring */}
        <div
          className="absolute -inset-5 rounded-full"
          style={{
            border: '2px solid transparent',
            borderTopColor: 'rgba(0,196,180,0.5)',
            borderRightColor: 'rgba(0,196,180,0.2)',
            animation: 'spin-ring 2s linear infinite',
          }}
        />
        {/* Main teal ring */}
        <div
          className="absolute -inset-3 rounded-full"
          style={{
            border: '3px solid transparent',
            borderTopColor: '#00C4B4',
            borderRightColor: '#00C4B4',
            animation: 'spin-ring 1.2s linear infinite',
          }}
        />
        {/* Inner pulse ring */}
        <div
          className="absolute -inset-1 rounded-full"
          style={{
            border: '2px solid rgba(0,196,180,0.3)',
            animation: 'ring-pulse 1.5s ease-in-out infinite',
          }}
        />

        {/* Concentrix Logo */}
        <img
          src="/assets/images/concentrix-mark.png"
          alt="Concentrix"
          className="h-12 w-auto relative z-10"
          style={{ filter: 'brightness(0) invert(1)' }}
        />
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold mb-2" style={{ color: '#FFFFFF', letterSpacing: '0.02em' }}>
        EEC
      </h1>

      {/* Subtitle with animated ellipsis */}
      <p className="text-sm mb-10" style={{ color: 'rgba(255,255,255,0.6)' }}>
        {subtitle}<span style={{ color: '#00C4B4' }}>{ellipsis}</span>
      </p>

      {/* Progress bar with gradient */}
      <div className="relative" style={{ width: 240, height: 4 }}>
        <div
          className="absolute inset-0 rounded-full"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(progress, 100)}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background: 'linear-gradient(90deg, #00C4B4, #00E6D4, #00C4B4)',
            boxShadow: '0 0 16px rgba(0,196,180,0.6)',
          }}
        />
        {/* Shimmer overlay */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.8s ease-in-out infinite',
          }}
        />
      </div>

      {/* Hint text */}
      <p className="text-[11px] mt-6" style={{ color: 'rgba(255,255,255,0.3)' }}>
        Connecting to secure gateway
      </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
