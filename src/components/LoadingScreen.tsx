import React, { useState, useEffect, useMemo, useRef } from 'react';
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
    return Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 4 + 3,
      delay: Math.random() * 2,
    }));
  }, []);

  // Shooting stars
  const shootingStars = useMemo(() => {
    return Array.from({ length: 6 }).map((_, i) => ({
      id: i,
      startX: Math.random() * 100,
      startY: Math.random() * 50,
      duration: 1.5 + Math.random() * 1,
      delay: i * 0.8 + Math.random() * 2,
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
          {/* Hexagonal grid background */}
          <HexagonalGrid />

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
                  background: 'rgba(0,196,180,0.4)',
                }}
                animate={{
                  y: [0, -40, 0],
                  opacity: [0.2, 0.8, 0.2],
                  scale: [1, 1.8, 1],
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

          {/* Shooting stars */}
          {shootingStars.map((star) => (
            <motion.div
              key={star.id}
              className="absolute w-1 h-1 rounded-full bg-white"
              style={{
                left: `${star.startX}%`,
                top: `${star.startY}%`,
                boxShadow: '0 0 6px 2px rgba(255,255,255,0.8), -20px 0 15px 1px rgba(0,196,180,0.4)',
              }}
              initial={{ x: 0, y: 0, opacity: 0 }}
              animate={{
                x: [0, 150, 300],
                y: [0, 100, 200],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: star.duration,
                delay: star.delay,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
          ))}

          {/* Data stream lines */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-px"
                style={{
                  left: `${15 + i * 18}%`,
                  top: 0,
                  width: 2,
                  background: 'linear-gradient(180deg, transparent, rgba(0,196,180,0.6), transparent)',
                }}
                animate={{
                  y: ['-100%', '100vh'],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 3,
                  delay: i * 0.5,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
            ))}
          </div>

          {/* Orbiting rings with pulsing core */}
          <div className="relative mb-10">
            {/* Outer glow pulse */}
            <motion.div
              className="absolute -inset-16 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(0,196,180,0.2) 0%, transparent 70%)',
              }}
              animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Outermost ring - slowest */}
            <motion.div
              className="absolute -inset-12 rounded-full"
              style={{
                border: '1px solid rgba(0,196,180,0.1)',
                borderTopColor: 'rgba(0,196,180,0.5)',
                borderRightColor: 'rgba(0,196,180,0.2)',
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            />

            {/* Outer ring */}
            <motion.div
              className="absolute -inset-8 rounded-full"
              style={{
                border: '1px solid rgba(0,196,180,0.15)',
                borderTopColor: 'rgba(0,196,180,0.7)',
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
                borderRightColor: 'rgba(0,196,180,0.5)',
              }}
              animate={{ rotate: -360 }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            />

            {/* Inner ring */}
            <motion.div
              className="absolute -inset-2 rounded-full"
              style={{
                border: '1.5px solid rgba(0,196,180,0.3)',
                borderBottomColor: 'rgba(0,196,180,0.8)',
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />

            {/* Dotted ring */}
            <motion.div
              className="absolute -inset-4 rounded-full"
              style={{
                border: '2px dotted rgba(0,196,180,0.2)',
              }}
              animate={{ rotate: -360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            />

            {/* Glowing orbs orbiting */}
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  background: '#00E6D4',
                  boxShadow: '0 0 12px rgba(0,196,180,0.8)',
                  top: '50%',
                  left: '50%',
                }}
                animate={{
                  x: [0, Math.cos(i * (Math.PI * 2 / 3)) * 50],
                  y: [0, Math.sin(i * (Math.PI * 2 / 3)) * 50],
                  opacity: [0.4, 1, 0.4],
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ))}

            {/* Logo container with breathing effect */}
            <motion.div
              className="relative z-10 w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(0,196,180,0.25) 0%, rgba(0,196,180,0.08) 100%)',
                border: '1px solid rgba(0,196,180,0.4)',
                boxShadow: '0 0 40px rgba(0,196,180,0.3), inset 0 0 20px rgba(0,196,180,0.1)',
              }}
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <motion.img
                src="/assets/images/217c0fe1-2aee-4858-ba08-8e5493ca7a16.png"
                alt="Concentrix"
                className="w-12 h-12 object-contain"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
          </div>

          {/* Title with letter stagger and glow */}
          <motion.h1
            className="text-4xl font-black mb-4 tracking-tight relative"
            style={{ color: '#FFFFFF' }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="absolute inset-0 blur-xl" style={{ color: 'rgba(0,196,180,0.5)' }}>
              EEC
            </span>
            {"EEC".split("").map((char, i) => (
              <motion.span
                key={i}
                className="inline-block relative"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
                style={{
                  textShadow: '0 0 30px rgba(0,196,180,0.5)',
                }}
              >
                {char}
              </motion.span>
            ))}
          </motion.h1>

          {/* Phase text / custom message with fade transition */}
          <div className="h-6 mb-10">
            <AnimatePresence mode="wait">
              <motion.p
                key={message || subtitle ? displayMessage : phase}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="text-sm font-medium"
                style={{ color: 'rgba(255,255,255,0.6)' }}
              >
                {message || subtitle ? displayMessage : phases[phase]}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Progress bar with glow */}
          <div className="relative" style={{ width: 320, height: 6 }}>
            {/* Background track */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'rgba(255,255,255,0.08)',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)',
              }}
            />
            {/* Animated gradient fill */}
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                background: 'linear-gradient(90deg, #008B7A, #00C4B4, #00E6D4, #00F5E1, #00C4B4)',
                backgroundSize: '300% 100%',
                boxShadow: '0 0 30px rgba(0,196,180,0.6), 0 0 60px rgba(0,196,180,0.3)',
              }}
              animate={{
                width: `${Math.min(progress, 100)}%`,
                backgroundPosition: ['0% 0%', '300% 0%'],
              }}
              transition={{
                width: { duration: 0.4, ease: "easeOut" },
                backgroundPosition: { duration: 2.5, repeat: Infinity, ease: "linear" },
              }}
            />
            {/* Glow dot at progress tip */}
            <motion.div
              className="absolute top-1/2 w-4 h-4 rounded-full"
              style={{
                left: `${Math.min(progress, 100)}%`,
                transform: 'translate(-50%, -50%)',
                background: 'radial-gradient(circle, #fff 0%, #00E6D4 50%, transparent 100%)',
                boxShadow: '0 0 15px rgba(0,196,180,1), 0 0 30px rgba(0,196,180,0.6)',
              }}
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          </div>

          {/* Percentage with pulse */}
          <motion.p
            className="text-xs mt-5 font-mono font-bold tracking-widest"
            style={{ color: 'rgba(255,255,255,0.4)' }}
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {Math.round(Math.min(progress, 100))}%
          </motion.p>

          {/* Loading dots animation */}
          <div className="flex gap-2 mt-6">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{ background: '#00C4B4' }}
                animate={{ y: [0, -8, 0], opacity: [0.4, 1, 0.4] }}
                transition={{
                  duration: 0.8,
                  delay: i * 0.15,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hexagonal grid background component
function HexagonalGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    let t = 0;
    const hexSize = 30;
    const hexHeight = hexSize * Math.sqrt(3);
    const hexWidth = hexSize * 2;

    const drawHex = (x: number, y: number, size: number, alpha: number) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const hx = x + size * Math.cos(angle);
        const hy = y + size * Math.sin(angle);
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.strokeStyle = `rgba(0,196,180,${alpha})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    };

    const animate = () => {
      t += 0.01;
      const W = window.innerWidth;
      const H = window.innerHeight;
      ctx.clearRect(0, 0, W, H);

      // Draw hexagonal grid
      for (let row = -1; row < H / hexHeight + 1; row++) {
        for (let col = -1; col < W / (hexWidth * 0.75) + 1; col++) {
          const x = col * hexWidth * 0.75;
          const y = row * hexHeight + (col % 2 === 1 ? hexHeight / 2 : 0);

          // Distance from center for wave effect
          const cx = W / 2;
          const cy = H / 2;
          const dist = Math.hypot(x - cx, y - cy);
          const wave = Math.sin(t * 2 - dist * 0.01) * 0.5 + 0.5;
          const alpha = 0.03 + wave * 0.04;

          drawHex(x, y, hexSize, alpha);
        }
      }

      requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.6 }}
    />
  );
}
