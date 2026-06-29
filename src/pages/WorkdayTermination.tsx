import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CircleCheck as CheckCircle2, Circle as XCircle, ExternalLink, CircleAlert as AlertCircle, Sparkles } from "lucide-react";

const WORKDAY_URL = "https://nam10.safelinks.protection.outlook.com/?url=https%3A%2F%2Fmyworkday.com%2Fcnx%2Fd%2Fhome.htmld&data=05%7C02%7C%7C%7C%7C";

export default function WorkdayTermination() {
  const navigate = useNavigate();
  const [selection, setSelection] = useState<"yes" | "no" | null>(null);

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(circle, #F97316 0%, transparent 70%)" }}
        />
        <motion.div
          animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full opacity-[0.03]"
          style={{ background: "radial-gradient(circle, #2563EB 0%, transparent 70%)" }}
        />
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </motion.button>

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="bg-white rounded-3xl shadow-2xl overflow-hidden relative"
        >
          {/* Header with gradient */}
          <div
            className="px-8 py-10 text-center relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #0D2B45 0%, #1E3A5F 50%, #0D2B45 100%)" }}
          >
            <motion.div
              animate={{ x: [0, 20, 0], y: [0, -15, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-20"
              style={{ background: "radial-gradient(circle, #F97316 0%, transparent 70%)" }}
            />

            {/* Workday Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5, rotate: -180 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, duration: 0.6, type: "spring", stiffness: 100 }}
              className="relative inline-flex items-center justify-center mb-4"
            >
              <WorkdayLogo />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center justify-center gap-2 mb-2"
            >
              <Sparkles className="w-4 h-4 text-orange-400/60" />
              <span className="text-xs font-medium text-orange-300/70 uppercase tracking-wider">Workday Verification</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              className="text-2xl md:text-3xl font-bold text-white"
            >
              Was the action taken on Workday?
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-sm text-white/60 mt-2"
            >
              Please confirm the termination action status in Workday before proceeding
            </motion.p>
          </div>

          {/* Selection area */}
          <div className="p-8">
            <AnimatePresence mode="wait">
              {selection === null && (
                <motion.div
                  key="selection"
                  exit={{ opacity: 0, y: -20 }}
                  className="grid grid-cols-2 gap-5"
                >
                  {/* YES card */}
                  <motion.button
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 120 }}
                    whileHover={{ scale: 1.04, y: -4 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSelection("yes")}
                    className="relative group rounded-2xl p-6 text-center overflow-hidden border-2 transition-all"
                    style={{
                      background: "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)",
                      borderColor: "#10B981",
                    }}
                  >
                    <motion.div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: "radial-gradient(circle at center, rgba(16,185,129,0.15) 0%, transparent 70%)" }}
                    />
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="relative w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg, #10B981 0%, #059669 100%)" }}
                    >
                      <CheckCircle2 className="w-8 h-8 text-white" />
                    </motion.div>
                    <span className="relative text-lg font-bold text-emerald-700">Yes</span>
                    <p className="relative text-xs text-emerald-600/70 mt-1">Action completed in Workday</p>
                  </motion.button>

                  {/* NO card */}
                  <motion.button
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4, type: "spring", stiffness: 120 }}
                    whileHover={{ scale: 1.04, y: -4 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSelection("no")}
                    className="relative group rounded-2xl p-6 text-center overflow-hidden border-2 transition-all"
                    style={{
                      background: "linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)",
                      borderColor: "#EF4444",
                    }}
                  >
                    <motion.div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: "radial-gradient(circle at center, rgba(239,68,68,0.15) 0%, transparent 70%)" }}
                    />
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                      className="relative w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)" }}
                    >
                      <XCircle className="w-8 h-8 text-white" />
                    </motion.div>
                    <span className="relative text-lg font-bold text-red-600">No</span>
                    <p className="relative text-xs text-red-500/70 mt-1">Action not yet submitted</p>
                  </motion.button>
                </motion.div>
              )}

              {/* YES result - proceed to form */}
              {selection === "yes" && (
                <motion.div
                  key="yes-result"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="text-center py-4"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 150, delay: 0.1 }}
                    className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #10B981 0%, #059669 100%)" }}
                  >
                    <CheckCircle2 className="w-10 h-10 text-white" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Great! Let's proceed</h3>
                  <p className="text-sm text-gray-500 mb-6">You'll now fill out the termination sheet form with the employee details.</p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => setSelection(null)}
                      className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                      Go Back
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate("/termination/sheet")}
                      className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
                      style={{ background: "linear-gradient(135deg, #0D2B45 0%, #1E3A5F 100%)" }}
                    >
                      Continue to Form
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* NO result - show Workday link */}
              {selection === "no" && (
                <motion.div
                  key="no-result"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="py-2"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 150, delay: 0.1 }}
                    className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}
                  >
                    <AlertCircle className="w-8 h-8 text-white" />
                  </motion.div>

                  <div
                    className="rounded-2xl p-5 mb-5 border"
                    style={{ background: "#FFFBEB", borderColor: "#FCD34D" }}
                  >
                    <h3 className="text-base font-bold text-amber-800 mb-2 text-center">Action Required First</h3>
                    <p className="text-sm text-amber-700 text-center leading-relaxed">
                      You need to submit the termination action on Workday before proceeding with the termination sheet.
                      Please click the link below to access Workday and complete the action first.
                    </p>
                  </div>

                  {/* Workday link card */}
                  <motion.a
                    href={WORKDAY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-4 rounded-2xl p-5 transition-all border-2 cursor-pointer group"
                    style={{
                      background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)",
                      borderColor: "#EA580C",
                    }}
                  >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/20 shrink-0">
                      <ExternalLink className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white">Open Workday - Concentrix</p>
                      <p className="text-xs text-white/80 truncate mt-0.5">myworkday.com/cnx/d/home.htmld</p>
                    </div>
                    <motion.div
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <ExternalLink className="w-5 h-5 text-white/80" />
                    </motion.div>
                  </motion.a>

                  <div className="flex gap-3 justify-center mt-5">
                    <button
                      onClick={() => setSelection(null)}
                      className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                      Go Back
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function WorkdayLogo() {
  return (
    <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" fill="white" />
      <circle cx="50" cy="50" r="46" fill="#F97316" />
      {/* Sun petals */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * 30) * (Math.PI / 180);
        const x1 = 50 + Math.cos(angle) * 22;
        const y1 = 50 + Math.sin(angle) * 22;
        const x2 = 50 + Math.cos(angle) * 38;
        const y2 = 50 + Math.sin(angle) * 38;
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.9"
          />
        );
      })}
      {/* Inner circle */}
      <circle cx="50" cy="50" r="20" fill="white" />
      <text
        x="50"
        y="56"
        textAnchor="middle"
        fontSize="14"
        fontWeight="bold"
        fill="#F97316"
        fontFamily="Arial, sans-serif"
      >
        W
      </text>
    </svg>
  );
}
