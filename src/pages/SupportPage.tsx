import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Phone, MessageCircle, Send, Copy, CircleCheck as CheckCircle, Clock, CircleAlert as AlertCircle, ArrowLeft, ExternalLink, Headphones as HeadphonesIcon, Sparkles, Zap, MessageSquare, Loader as Loader2 } from "lucide-react";
import { useAuth } from "../auth/useAuth";

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low", description: "General inquiry or feedback", color: "#22C55E" },
  { value: "medium", label: "Medium", description: "Issue affecting workflow", color: "#F59E0B" },
  { value: "high", label: "High", description: "Critical issue requiring immediate attention", color: "#EF4444" },
];

const SUPPORT_TIMELINE = [
  { step: 1, title: "Submit Request", desc: "Fill out the form or contact us directly", icon: MessageSquare },
  { step: 2, title: "We Review", desc: "Our team triages and assigns your ticket", icon: Clock },
  { step: 3, title: "Get Updates", desc: "Receive real-time status notifications", icon: Zap },
  { step: 4, title: "Resolution", desc: "Your issue is resolved and confirmed", icon: CheckCircle },
];

const DEVELOPER_EMAIL = "kareem.alihamza@concentrix.com";
const SUPPORT_PHONE = "+20 01270793411";

export default function SupportPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    subject: "",
    message: "",
    priority: "medium",
    name: user?.displayName || "",
    email: user?.email || "",
  });
  const [copied, setCopied] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Animated background particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number }[] =
      Array.from({ length: 30 }, () => ({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: 2 + Math.random() * 3,
        alpha: 0.1 + Math.random() * 0.2,
      }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.offsetWidth) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.offsetHeight) p.vy *= -1;

        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
        glow.addColorStop(0, `rgba(0,196,180,${p.alpha})`);
        glow.addColorStop(1, "transparent");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
        ctx.fill();
      });

      requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("resize", resize);
    };
  }, []);

  // Timeline animation
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep(s => (s + 1) % SUPPORT_TIMELINE.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Update form data when user loads
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.displayName || prev.name,
        email: user.email || prev.email,
      }));
    }
  }, [user]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // Create mailto link with pre-filled email to developer
    const mailtoSubject = encodeURIComponent(`[EEC Support - ${formData.priority.toUpperCase()}] ${formData.subject}`);
    const mailtoBody = encodeURIComponent(
      `Name: ${formData.name}\n` +
      `Email: ${formData.email}\n` +
      `Priority: ${formData.priority}\n\n` +
      `Message:\n${formData.message}\n\n` +
      `---\nSent from EEC Support Center`
    );

    // Open email client
    window.location.href = `mailto:${DEVELOPER_EMAIL}?subject=${mailtoSubject}&body=${mailtoBody}`;

    // Simulate success after short delay
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setFormData({
          subject: "",
          message: "",
          priority: "medium",
          name: user?.displayName || "",
          email: user?.email || "",
        });
      }, 3000);
    }, 1000);
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in space-y-6 relative">
      {/* Animated background canvas */}
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 opacity-40" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10"
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm font-medium mb-4 transition-colors hover:opacity-80"
          style={{ color: "#64748B" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <div className="flex items-start justify-between gap-4">
          <div>
            <motion.div
              className="flex items-center gap-2 mb-1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center relative" style={{ background: "linear-gradient(135deg, #00C4B4, #0D2B45)" }}>
                <HeadphonesIcon className="w-5 h-5 text-white" />
                <motion.div
                  className="absolute inset-0 rounded-xl"
                  style={{ border: "2px solid rgba(0,196,180,0.4)" }}
                  animate={{ scale: [1, 1.2, 1], opacity: [0.8, 0, 0.8] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#00C4B4" }}>
                Premium Support
              </span>
            </motion.div>
            <motion.h1
              className="text-3xl font-bold"
              style={{ color: "#0D2B45", letterSpacing: "0.02em" }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              SUPPORT CENTER
            </motion.h1>
            <motion.p
              className="text-sm mt-1"
              style={{ color: "#64748B" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Expert help when you need it most
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full"
            style={{ background: "linear-gradient(135deg, rgba(0,196,180,0.1), rgba(13,43,69,0.1))" }}
          >
            <Sparkles className="w-4 h-4" style={{ color: "#00C4B4" }} />
            <span className="text-xs font-semibold" style={{ color: "#0D2B45" }}>24/7 Available</span>
          </motion.div>
        </div>
      </motion.div>

      {/* Support Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="relative z-10 rounded-2xl p-6 border"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.7))",
          backdropFilter: "blur(20px)",
          borderColor: "rgba(0,196,180,0.2)",
          boxShadow: "0 8px 32px rgba(0,196,180,0.1)",
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4" style={{ color: "#00C4B4" }} />
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#64748B" }}>How It Works</span>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {SUPPORT_TIMELINE.map((item, idx) => {
            const Icon = item.icon;
            const isActive = idx === activeStep;
            const isPast = idx < activeStep;
            return (
              <motion.div
                key={item.step}
                className="relative"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
              >
                {idx < SUPPORT_TIMELINE.length - 1 && (
                  <div
                    className="absolute top-6 left-1/2 w-full h-0.5"
                    style={{
                      background: isPast || isActive
                        ? "linear-gradient(90deg, #00C4B4, rgba(0,196,180,0.3))"
                        : "rgba(0,0,0,0.1)",
                    }}
                  />
                )}
                <div className="relative flex flex-col items-center text-center">
                  <motion.div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-all duration-300 ${
                      isActive ? "text-white" : isPast ? "text-white" : ""
                    }`}
                    style={{
                      background: isActive
                        ? "linear-gradient(135deg, #00C4B4, #0D2B45)"
                        : isPast
                          ? "#00C4B4"
                          : "rgba(0,0,0,0.05)",
                      boxShadow: isActive ? "0 8px 24px rgba(0,196,180,0.3)" : "none",
                    }}
                    animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.5 }}
                  >
                    <Icon className="w-5 h-5" />
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 rounded-xl"
                        style={{ border: "2px solid rgba(0,196,180,0.5)" }}
                        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    )}
                  </motion.div>
                  <span
                    className="text-xs font-semibold mb-1"
                    style={{ color: isActive || isPast ? "#0D2B45" : "#94A3B8" }}
                  >
                    {item.title}
                  </span>
                  <span
                    className="text-[10px]"
                    style={{ color: "#94A3B8" }}
                  >
                    {item.desc}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
        {/* Contact Form - Glassmorphism */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="rounded-2xl border overflow-hidden relative"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.8))",
            backdropFilter: "blur(20px)",
            borderColor: "rgba(255,255,255,0.5)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
          }}
        >
          {/* Animated gradient border effect */}
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none opacity-50"
            style={{
              background: "linear-gradient(135deg, rgba(0,196,180,0.1), transparent, rgba(13,43,69,0.1))",
            }}
          />

          <div className="relative px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: "rgba(0,196,180,0.1)" }}>
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <MessageCircle className="w-4 h-4" style={{ color: "#00C4B4" }} />
            </motion.div>
            <h3 className="font-semibold text-sm" style={{ color: "#0D2B45" }}>Contact Form</h3>
          </div>

          {submitted ? (
            <motion.div
              className="p-8 text-center relative"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4 relative"
                style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.1))" }}
              >
                <CheckCircle className="w-10 h-10" style={{ color: "#22C55E" }} />
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{ border: "2px solid rgba(34,197,94,0.3)" }}
                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>
              <h4 className="text-lg font-semibold" style={{ color: "#0D2B45" }}>Email Client Opened!</h4>
              <p className="text-sm mt-2" style={{ color: "#64748B" }}>
                Your email client has been opened with your message pre-filled. Just hit send!
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="p-5 space-y-5 relative">
              {/* Name */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 }}
              >
                <label className="block text-sm font-medium mb-2" style={{ color: "#0D2B45" }}>Your Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your name"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border outline-none transition-all focus:ring-2"
                  style={{
                    borderColor: "rgba(0,196,180,0.2)",
                    color: "#0D2B45",
                    background: "rgba(255,255,255,0.8)",
                  }}
                />
              </motion.div>

              {/* Email */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.38 }}
              >
                <label className="block text-sm font-medium mb-2" style={{ color: "#0D2B45" }}>Your Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your.email@concentrix.com"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border outline-none transition-all focus:ring-2"
                  style={{
                    borderColor: "rgba(0,196,180,0.2)",
                    color: "#0D2B45",
                    background: "rgba(255,255,255,0.8)",
                  }}
                />
              </motion.div>

              {/* Subject */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <label className="block text-sm font-medium mb-2" style={{ color: "#0D2B45" }}>Subject</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Brief description of your inquiry"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border outline-none transition-all focus:ring-2"
                  style={{
                    borderColor: "rgba(0,196,180,0.2)",
                    color: "#0D2B45",
                    background: "rgba(255,255,255,0.8)",
                  }}
                />
              </motion.div>

              {/* Priority */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45 }}
              >
                <label className="block text-sm font-medium mb-2" style={{ color: "#0D2B45" }}>Priority</label>
                <div className="flex gap-2">
                  {PRIORITY_OPTIONS.map((option, idx) => (
                    <motion.button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, priority: option.value })}
                      className={`flex-1 px-3 py-2.5 rounded-xl border-2 text-xs font-medium transition-all relative overflow-hidden ${
                        formData.priority === option.value ? "border-current" : "border-gray-100 hover:border-gray-200"
                      }`}
                      style={{
                        background: formData.priority === option.value ? `${option.color}15` : "rgba(255,255,255,0.5)",
                        borderColor: formData.priority === option.value ? option.color : "#E2E8F0",
                        color: formData.priority === option.value ? option.color : "#64748B",
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {formData.priority === option.value && (
                        <motion.div
                          className="absolute inset-0"
                          style={{ background: `linear-gradient(135deg, ${option.color}20, transparent)` }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        />
                      )}
                      <span className="relative z-10">{option.label}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Message */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <label className="block text-sm font-medium mb-2" style={{ color: "#0D2B45" }}>Message</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Describe your issue or question in detail..."
                  required
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl border outline-none resize-none transition-all focus:ring-2"
                  style={{
                    borderColor: "rgba(0,196,180,0.2)",
                    color: "#0D2B45",
                    background: "rgba(255,255,255,0.8)",
                  }}
                />
              </motion.div>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-all relative overflow-hidden disabled:opacity-70"
                style={{
                  background: "linear-gradient(135deg, #00C4B4, #0D2B45)",
                  color: "white",
                  boxShadow: "0 8px 24px rgba(0,196,180,0.25)",
                }}
                whileHover={{ scale: submitting ? 1 : 1.02, boxShadow: "0 12px 32px rgba(0,196,180,0.35)" }}
                whileTap={{ scale: submitting ? 1 : 0.98 }}
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <motion.span
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Send className="w-4 h-4" />
                  </motion.span>
                )}
                {submitting ? "Opening Email..." : "Send Message"}
              </motion.button>
            </form>
          )}
        </motion.div>

        {/* Contact Info & Quick Actions */}
        <div className="space-y-6 relative z-10">
          {/* Contact Info - Glassmorphism */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="rounded-2xl border overflow-hidden relative"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.8))",
              backdropFilter: "blur(20px)",
              borderColor: "rgba(255,255,255,0.5)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
            }}
          >
            <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: "rgba(0,196,180,0.1)" }}>
              <Mail className="w-4 h-4" style={{ color: "#00C4B4" }} />
              <h3 className="font-semibold text-sm" style={{ color: "#0D2B45" }}>Contact Information</h3>
            </div>

            <div className="p-5 space-y-4">
              {/* Email */}
              <motion.a
                href={`mailto:${DEVELOPER_EMAIL}`}
                className="flex items-center justify-between p-4 rounded-xl transition-all relative overflow-hidden group cursor-pointer block"
                style={{ background: "linear-gradient(135deg, rgba(0,196,180,0.08), rgba(0,196,180,0.02))" }}
                whileHover={{ scale: 1.02 }}
                onClick={() => handleCopy(DEVELOPER_EMAIL, "email")}
              >
                <motion.div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: "radial-gradient(circle at center, rgba(0,196,180,0.15), transparent)" }}
                />
                <div className="flex items-center gap-3 relative z-10">
                  <motion.div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, rgba(0,196,180,0.2), rgba(0,196,180,0.1))" }}
                    whileHover={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <Mail className="w-5 h-5" style={{ color: "#00C4B4" }} />
                  </motion.div>
                  <div>
                    <p className="text-xs" style={{ color: "#94A3B8" }}>Email Support</p>
                    <p className="text-sm font-medium" style={{ color: "#0D2B45" }}>{DEVELOPER_EMAIL}</p>
                  </div>
                </div>
                <motion.div
                  className="p-2 rounded-lg transition-colors relative z-10"
                  style={{ color: copied === "email" ? "#22C55E" : "#94A3B8" }}
                  whileTap={{ scale: 0.9 }}
                >
                  {copied === "email" ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </motion.div>
              </motion.a>

              {/* Phone */}
              <motion.a
                href={`tel:${SUPPORT_PHONE.replace(/\s/g, "")}`}
                className="flex items-center justify-between p-4 rounded-xl transition-all relative overflow-hidden group cursor-pointer block"
                style={{ background: "linear-gradient(135deg, rgba(37,99,235,0.08), rgba(37,99,235,0.02))" }}
                whileHover={{ scale: 1.02 }}
                onClick={() => handleCopy(SUPPORT_PHONE, "phone")}
              >
                <motion.div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: "radial-gradient(circle at center, rgba(37,99,235,0.15), transparent)" }}
                />
                <div className="flex items-center gap-3 relative z-10">
                  <motion.div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, rgba(37,99,235,0.2), rgba(37,99,235,0.1))" }}
                    whileHover={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <Phone className="w-5 h-5" style={{ color: "#2563EB" }} />
                  </motion.div>
                  <div>
                    <p className="text-xs" style={{ color: "#94A3B8" }}>Phone Support</p>
                    <p className="text-sm font-medium" style={{ color: "#0D2B45" }}>{SUPPORT_PHONE}</p>
                  </div>
                </div>
                <motion.div
                  className="p-2 rounded-lg transition-colors relative z-10"
                  style={{ color: copied === "phone" ? "#22C55E" : "#94A3B8" }}
                  whileTap={{ scale: 0.9 }}
                >
                  {copied === "phone" ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </motion.div>
              </motion.a>

              {/* Response Time */}
              <motion.div
                className="flex items-center gap-3 p-4 rounded-xl relative overflow-hidden"
                style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.02))", border: "1px solid rgba(245,158,11,0.2)" }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                >
                  <Clock className="w-5 h-5 shrink-0" style={{ color: "#F59E0B" }} />
                </motion.div>
                <div>
                  <p className="text-sm font-medium" style={{ color: "#0D2B45" }}>Average Response Time</p>
                  <p className="text-xs" style={{ color: "#94A3B8" }}>Within 24 hours on business days</p>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Live Chat Placeholder - Glassmorphism */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="rounded-2xl border overflow-hidden relative"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.8))",
              backdropFilter: "blur(20px)",
              borderColor: "rgba(255,255,255,0.5)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
            }}
          >
            <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: "rgba(0,196,180,0.1)" }}>
              <MessageCircle className="w-4 h-4" style={{ color: "#00C4B4" }} />
              <h3 className="font-semibold text-sm" style={{ color: "#0D2B45" }}>Live Chat</h3>
            </div>

            <div className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center relative" style={{ background: "linear-gradient(135deg, rgba(0,196,180,0.2), rgba(0,196,180,0.1))" }}>
                  <HeadphonesIcon className="w-6 h-6" style={{ color: "#00C4B4" }} />
                  <motion.div
                    className="absolute inset-0 rounded-xl"
                    animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{ border: "2px solid rgba(0,196,180,0.3)" }}
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: "#0D2B45" }}>Chat with a Support Agent</p>
                  <p className="text-xs" style={{ color: "#94A3B8" }}>Available Mon-Fri, 9 AM - 6 PM EST</p>
                </div>
                <button
                  disabled
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-not-allowed opacity-60"
                  style={{ background: "#E2E8F0", color: "#64748B" }}
                >
                  Coming Soon
                </button>
              </div>
            </div>
          </motion.div>

          {/* Quick Link */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.5 }}
          >
            <motion.button
              onClick={() => navigate("/help")}
              className="w-full flex items-center justify-between p-4 rounded-2xl border relative overflow-hidden group"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.8))",
                backdropFilter: "blur(20px)",
                borderColor: "rgba(0,196,180,0.2)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
              }}
              whileHover={{ scale: 1.02, boxShadow: "0 12px 40px rgba(0,196,180,0.15)" }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: "radial-gradient(circle at left center, rgba(0,196,180,0.1), transparent)" }}
              />
              <div className="flex items-center gap-3 relative z-10">
                <AlertCircle className="w-5 h-5" style={{ color: "#00C4B4" }} />
                <span className="text-sm font-medium" style={{ color: "#0D2B45" }}>Visit Help Center</span>
              </div>
              <motion.div
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <ExternalLink className="w-4 h-4" style={{ color: "#94A3B8" }} />
              </motion.div>
            </motion.button>
          </motion.div>
        </div>
      </div>

      {/* Floating Contact Button */}
      <motion.a
        href={`mailto:${DEVELOPER_EMAIL}`}
        className="fixed bottom-8 right-8 w-16 h-16 rounded-full flex items-center justify-center z-50 shadow-2xl cursor-pointer"
        style={{
          background: "linear-gradient(135deg, #00C4B4, #0D2B45)",
          boxShadow: "0 8px 32px rgba(0,196,180,0.4)",
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 200 }}
        whileHover={{ scale: 1.1, boxShadow: "0 12px 48px rgba(0,196,180,0.5)" }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <Send className="w-6 h-6 text-white" />
        </motion.div>
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ border: "2px solid rgba(255,255,255,0.3)" }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.a>
    </div>
  );
}
