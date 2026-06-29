import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from "framer-motion";

interface LoadingScreenProps {
  subtitle?: string;
  message?: string;
  show?: boolean;
}

export default function LoadingScreen({ subtitle, message, show = true }: LoadingScreenProps) {
  const displayMessage = message || subtitle || "Loading your workspace";
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState(0);

  const phases = useMemo(() => [
    "Initializing secure connection",
    "Authenticating session",
    "Fetching user profile",
    "Loading case data",
    "Preparing dashboard",
    "Ready"
  ], []);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 8 + 2;
      });
    }, 300);

    const phaseInterval = setInterval(() => {
      setPhase(prev => (prev + 1) % phases.length);
    }, 900);

    return () => {
      clearInterval(progressInterval);
      clearInterval(phaseInterval);
    };
  }, [phases.length]);

  const particles = useMemo(() => {
    return Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 4 + 3,
      delay: Math.random() * 2,
    }));
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0D2B45 0%, #0B1F33 50%, #071C2E 100%)' }}
        >
          {/* Animated background particles */}
          <div className="absolute inset-0 pointer-events-none">
            {particles.map((p) => (
              <motion.div
                key={p.id}
                className="absolute rounded-full"
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  width: p.size,
                  height: p.size,
                  background: 'rgba(0,196,180,0.3)',
                }}
                animate={{
                  y: [0, -30, 0],
                  opacity: [0.2, 0.6, 0.2],
                  scale: [1, 1.5, 1],
                }}
                transition={{
                  duration: p.duration,
                  delay: p.delay,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>

          {/* Orbiting rings */}
          <div className="relative mb-10">
            {/* Outer glow pulse */}
            <motion.div
              className="absolute -inset-10 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(0,196,180,0.15) 0%, transparent 70%)',
              }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Outer ring */}
            <motion.div
              className="absolute -inset-8 rounded-full"
              style={{
                border: '1px solid rgba(0,196,180,0.15)',
                borderTopColor: 'rgba(0,196,180,0.6)',
                borderRightColor: 'rgba(0,196,180,0.3)',
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            />

            {/* Middle ring */}
            <motion.div
              className="absolute -inset-5 rounded-full"
              style={{
                border: '2px solid transparent',
                borderTopColor: '#00C4B4',
                borderRightColor: 'rgba(0,196,180,0.4)',
              }}
              animate={{ rotate: -360 }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            />

            {/* Inner ring */}
            <motion.div
              className="absolute -inset-2 rounded-full"
              style={{
                border: '1.5px solid rgba(0,196,180,0.25)',
                borderBottomColor: 'rgba(0,196,180,0.6)',
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />

            {/* Logo container with breathing effect */}
            <motion.div
              className="relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(0,196,180,0.2) 0%, rgba(0,196,180,0.05) 100%)',
                border: '1px solid rgba(0,196,180,0.3)',
              }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <img
                src="/assets/images/217c0fe1-2aee-4858-ba08-8e5493ca7a16.png"
                alt="Concentrix"
                className="w-10 h-10 object-contain"
              />
            </motion.div>
          </div>

          {/* Title with letter stagger */}
          <motion.h1
            className="text-3xl font-bold mb-3 tracking-tight"
            style={{ color: '#FFFFFF' }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {"EEC".split("").map((char, i) => (
              <motion.span
                key={i}
                className="inline-block"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
              >
                {char}
              </motion.span>
            ))}
          </motion.h1>

          {/* Phase text / custom message with fade transition */}
          <div className="h-6 mb-8">
            <AnimatePresence mode="wait">
              <motion.p
                key={message || subtitle ? displayMessage : phase}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="text-sm"
                style={{ color: 'rgba(255,255,255,0.5)' }}
              >
                {message || subtitle ? displayMessage : phases[phase]}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Progress bar */}
          <div className="relative" style={{ width: 280, height: 5 }}>
            <div
              className="absolute inset-0 rounded-full"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            />
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                background: 'linear-gradient(90deg, #008B7A, #00C4B4, #00E6D4, #00C4B4)',
                backgroundSize: '200% 100%',
                boxShadow: '0 0 20px rgba(0,196,180,0.4)',
              }}
              animate={{
                width: `${Math.min(progress, 100)}%`,
                backgroundPosition: ['0% 0%', '200% 0%'],
              }}
              transition={{
                width: { duration: 0.4, ease: "easeOut" },
                backgroundPosition: { duration: 2, repeat: Infinity, ease: "linear" },
              }}
            />
            {/* Glow dot at progress tip */}
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white"
              style={{
                left: `${Math.min(progress, 100)}%`,
                transform: 'translate(-50%, -50%)',
                boxShadow: '0 0 12px rgba(0,196,180,0.8), 0 0 24px rgba(0,196,180,0.4)',
              }}
            />
          </div>

          {/* Percentage */}
          <motion.p
            className="text-[11px] mt-4 font-mono"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            {Math.round(Math.min(progress, 100))}%
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
