import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Phone, MessageCircle, Send, Copy, CircleCheck as CheckCircle, Clock, CircleAlert as AlertCircle, ArrowLeft, ExternalLink, Headphones as HeadphonesIcon } from "lucide-react";

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low", description: "General inquiry or feedback", color: "#22C55E" },
  { value: "medium", label: "Medium", description: "Issue affecting workflow", color: "#F59E0B" },
  { value: "high", label: "High", description: "Critical issue requiring immediate attention", color: "#EF4444" },
];

export default function SupportPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    subject: "",
    message: "",
    priority: "medium",
  });
  const [copied, setCopied] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would send to backend
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ subject: "", message: "", priority: "medium" });
    }, 3000);
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
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
            <div className="flex items-center gap-2 mb-1">
              <HeadphonesIcon className="w-5 h-5" style={{ color: "#00C4B4" }} />
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "#00C4B4" }}>
                Get in Touch
              </span>
            </div>
            <h1 className="text-3xl font-bold" style={{ color: "#0D2B45", letterSpacing: "0.02em" }}>
              SUPPORT CENTER
            </h1>
            <p className="text-sm mt-1" style={{ color: "#64748B" }}>
              We're Here for You – Reach Out
            </p>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <MessageCircle className="w-4 h-4" style={{ color: "#00C4B4" }} />
            <h3 className="font-semibold text-sm" style={{ color: "#0D2B45" }}>Contact Form</h3>
          </div>

          {submitted ? (
            <div className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4"
                style={{ background: "rgba(34,197,94,0.1)" }}
              >
                <CheckCircle className="w-8 h-8" style={{ color: "#22C55E" }} />
              </motion.div>
              <h4 className="text-lg font-semibold" style={{ color: "#0D2B45" }}>Message Sent!</h4>
              <p className="text-sm mt-2" style={{ color: "#64748B" }}>
                We'll get back to you within 24 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              {/* Subject */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#0D2B45" }}>Subject</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Brief description of your inquiry"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border outline-none transition-colors focus:border-teal-500"
                  style={{ borderColor: "#E2E8F0", color: "#0D2B45" }}
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#0D2B45" }}>Priority</label>
                <div className="flex gap-2">
                  {PRIORITY_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, priority: option.value })}
                      className={`flex-1 px-3 py-2.5 rounded-xl border-2 text-xs font-medium transition-all ${
                        formData.priority === option.value ? "border-current" : "border-gray-100 hover:border-gray-200"
                      }`}
                      style={{
                        background: formData.priority === option.value ? `${option.color}15` : "transparent",
                        borderColor: formData.priority === option.value ? option.color : "#E2E8F0",
                        color: formData.priority === option.value ? option.color : "#64748B",
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#0D2B45" }}>Message</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Describe your issue or question in detail..."
                  required
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl border outline-none resize-none transition-colors focus:border-teal-500"
                  style={{ borderColor: "#E2E8F0", color: "#0D2B45" }}
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-all hover:shadow-md"
                style={{ background: "#00C4B4", color: "white" }}
              >
                <Send className="w-4 h-4" />
                Send Message
              </button>
            </form>
          )}
        </motion.div>

        {/* Contact Info & Quick Actions */}
        <div className="space-y-6">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Mail className="w-4 h-4" style={{ color: "#00C4B4" }} />
              <h3 className="font-semibold text-sm" style={{ color: "#0D2B45" }}>Contact Information</h3>
            </div>

            <div className="p-5 space-y-4">
              {/* Email */}
              <div className="flex items-center justify-between p-4 rounded-xl transition-colors hover:bg-gray-50" style={{ background: "rgba(0,196,180,0.03)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,196,180,0.1)" }}>
                    <Mail className="w-5 h-5" style={{ color: "#00C4B4" }} />
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: "#94A3B8" }}>Email Support</p>
                    <p className="text-sm font-medium" style={{ color: "#0D2B45" }}>kareem.alihamza@concentrix.com</p>
                  </div>
                </div>
                <button
                  onClick={() => handleCopy("kareem.alihamza@concentrix.com", "email")}
                  className="p-2 rounded-lg transition-colors hover:bg-gray-100"
                  style={{ color: copied === "email" ? "#22C55E" : "#94A3B8" }}
                >
                  {copied === "email" ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* Phone */}
              <div className="flex items-center justify-between p-4 rounded-xl transition-colors hover:bg-gray-50" style={{ background: "rgba(37,99,235,0.03)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(37,99,235,0.1)" }}>
                    <Phone className="w-5 h-5" style={{ color: "#2563EB" }} />
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: "#94A3B8" }}>Phone Support</p>
                    <p className="text-sm font-medium" style={{ color: "#0D2B45" }}>+1 (555) 123-4567</p>
                  </div>
                </div>
                <button
                  onClick={() => handleCopy("+1 (555) 123-4567", "phone")}
                  className="p-2 rounded-lg transition-colors hover:bg-gray-100"
                  style={{ color: copied === "phone" ? "#22C55E" : "#94A3B8" }}
                >
                  {copied === "phone" ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* Response Time */}
              <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)" }}>
                <Clock className="w-5 h-5 shrink-0" style={{ color: "#F59E0B" }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: "#0D2B45" }}>Average Response Time</p>
                  <p className="text-xs" style={{ color: "#94A3B8" }}>Within 24 hours on business days</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Live Chat Placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <MessageCircle className="w-4 h-4" style={{ color: "#00C4B4" }} />
              <h3 className="font-semibold text-sm" style={{ color: "#0D2B45" }}>Live Chat</h3>
            </div>

            <div className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,196,180,0.1)" }}>
                  <HeadphonesIcon className="w-6 h-6" style={{ color: "#00C4B4" }} />
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
            transition={{ delay: 0.25, duration: 0.4 }}
          >
            <button
              onClick={() => navigate("/help")}
              className="w-full flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5" style={{ color: "#00C4B4" }} />
                <span className="text-sm font-medium" style={{ color: "#0D2B45" }}>Visit Help Center</span>
              </div>
              <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" style={{ color: "#94A3B8" }} />
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
