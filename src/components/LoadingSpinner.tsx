import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Activity, Zap, BarChart3, Users } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
}

const LOADING_MESSAGES = [
  "Syncing data...",
  "Loading insights...",
  "Preparing dashboard...",
  "Fetching analytics...",
  "Almost there...",
];

const PULSE_ICONS = [Shield, Activity, Zap, BarChart3, Users];

export default function LoadingSpinner({ size = "md", label }: LoadingSpinnerProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [iconIndex, setIconIndex] = useState(0);

  useEffect(() => {
    const msgInterval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
    }, 2000);
    const iconInterval = setInterval(() => {
      setIconIndex(prev => (prev + 1) % PULSE_ICONS.length);
    }, 800);
    return () => {
      clearInterval(msgInterval);
      clearInterval(iconInterval);
    };
  }, []);

  const sizeConfig = {
    sm: { ring: 40, core: 16, icons: 12 },
    md: { ring: 60, core: 24, icons: 16 },
    lg: { ring: 100, core: 40, icons: 24 },
  };

  const config = sizeConfig[size];

  const ActiveIcon = PULSE_ICONS[iconIndex];

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Main loader container */}
      <div className="relative" style={{ width: config.ring * 2 + 20, height: config.ring * 2 + 20 }}>
        {/* Outer glow ring */}
        <motion.div
          className="absolute rounded-full"
          style={{
            inset: 0,
            background: "radial-gradient(circle, rgba(20,184,166,0.15) 0%, transparent 70%)",
          }}
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Orbiting particles */}
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 6,
              height: 6,
              background: `linear-gradient(135deg, #14b8a6, #06b6d4)`,
              boxShadow: "0 0 10px rgba(20,184,166,0.5)",
              top: "50%",
              left: "50%",
            }}
            animate={{
              x: [0, Math.cos((i * Math.PI) / 2 + Math.PI / 2) * config.ring],
              y: [0, Math.sin((i * Math.PI) / 2 + Math.PI / 2) * config.ring],
              rotate: [0, 360],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "linear",
            }}
          />
        ))}

        {/* Rotating outer ring */}
        <motion.div
          className="absolute rounded-full border-2 border-transparent"
          style={{
            inset: 8,
            borderTopColor: "#14b8a6",
            borderRightColor: "rgba(20,184,166,0.3)",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />

        {/* Secondary counter-rotating ring */}
        <motion.div
          className="absolute rounded-full border border-transparent"
          style={{
            inset: 16,
            borderBottomColor: "#06b6d4",
            borderLeftColor: "rgba(6,182,212,0.3)",
          }}
          animate={{ rotate: -360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />

        {/* Inner pulse ring */}
        <motion.div
          className="absolute rounded-full border border-teal-400/30"
          style={{ inset: config.ring - config.core - 10 }}
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Core container */}
        <motion.div
          className="absolute rounded-full flex items-center justify-center"
          style={{
            top: "50%",
            left: "50%",
            width: config.core,
            height: config.core,
            transform: "translate(-50%, -50%)",
            background: "linear-gradient(135deg, #0d9488 0%, #14b8a6 50%, #06b6d4 100%)",
            boxShadow: "0 0 20px rgba(20,184,166,0.4), inset 0 0 10px rgba(255,255,255,0.2)",
          }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Animated icon in center */}
          <AnimatePresence mode="wait">
            <motion.div
              key={iconIndex}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-white"
            >
              <ActiveIcon size={config.icons} />
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Data flow lines */}
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={`line-${i}`}
            className="absolute"
            style={{
              top: "50%",
              left: "50%",
              width: 2,
              height: config.ring - config.core / 2 - 5,
              transformOrigin: "center top",
              transform: `translate(-50%, 0) rotate(${i * 90}deg)`,
            }}
          >
            <motion.div
              className="w-full rounded-full"
              style={{
                height: "40%",
                background: "linear-gradient(to bottom, #14b8a6, transparent)",
              }}
              animate={{ y: [0, 20, 0], opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.25, ease: "easeInOut" }}
            />
          </motion.div>
        ))}
      </div>

      {/* Animated label */}
      {label && (
        <motion.div
          className="text-sm font-medium text-teal-600"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {label}
        </motion.div>
      )}

      {/* Dynamic loading message */}
      <AnimatePresence mode="wait">
        <motion.p
          key={messageIndex}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.3 }}
          className="text-xs text-gray-400 mt-1"
        >
          {LOADING_MESSAGES[messageIndex]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

// Full-page loading overlay component
export function LoadingOverlay({ message }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating orbs */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-teal-500/10 blur-3xl"
            style={{
              width: 100 + i * 50,
              height: 100 + i * 50,
              left: `${20 + i * 12}%`,
              top: `${10 + i * 15}%`,
            }}
            animate={{
              x: [0, 20, -20, 0],
              y: [0, -30, 30, 0],
              scale: [1, 1.1, 0.9, 1],
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10">
        <LoadingSpinner size="lg" label={message} />
      </div>
    </div>
  );
}

// Skeleton loader for content placeholders
export function ContentSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gray-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded-lg w-3/4" />
          <div className="h-3 bg-gray-100 rounded-lg w-1/2" />
        </div>
      </div>
      <div className="h-32 bg-gray-100 rounded-2xl" />
      <div className="grid grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// Inline mini spinner for buttons
export function InlineSpinner({ className = "" }: { className?: string }) {
  return (
    <motion.div
      className={`relative ${className}`}
      style={{ width: 16, height: 16 }}
    >
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-transparent border-t-current"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute inset-1 rounded-full border border-transparent border-b-current opacity-50"
        animate={{ rotate: -360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      />
    </motion.div>
  );
}

// Card loading state
export function CardSkeleton() {
  return (
    <motion.div
      className="bg-white rounded-2xl border border-gray-100 p-5 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex items-start gap-4 mb-4">
        <motion.div
          className="w-12 h-12 rounded-xl bg-gray-100"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <div className="flex-1 space-y-2">
          <motion.div
            className="h-4 bg-gray-100 rounded-lg w-3/4"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }}
          />
          <motion.div
            className="h-3 bg-gray-50 rounded-lg w-1/2"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
          />
        </div>
      </div>
      <div className="space-y-2">
        <motion.div
          className="h-3 bg-gray-50 rounded-lg w-full"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
        />
        <motion.div
          className="h-3 bg-gray-50 rounded-lg w-5/6"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
        />
      </div>
    </motion.div>
  );
}

// Table row skeleton
export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-b border-gray-50">
      {[...Array(columns)].map((_, i) => (
        <td key={i} className="px-5 py-3">
          <motion.div
            className="h-3 bg-gray-100 rounded"
            style={{ width: `${60 + (i % 3) * 15}%` }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
          />
        </td>
      ))}
    </tr>
  );
}
