import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Search, ChevronRight, CircleHelp as HelpCircle, Users, TriangleAlert as AlertTriangle, Shield, Clock, ArrowLeft, Mail, MessageCircle, ExternalLink, Sparkles, Zap, Lightbulb, TrendingUp } from "lucide-react";

const FAQ_DATA = [
  {
    category: "Getting Started",
    icon: BookOpen,
    color: "#22C55E",
    gradient: "from-green-500 to-emerald-600",
    questions: [
      {
        question: "How do I submit a new attrition case?",
        answer: "Navigate to the 'Submit Case' page from the sidebar or Quick Actions. Fill in the required fields including trainee information, reason for attrition, and supporting details. The case will be automatically routed to your supervisor for review."
      },
      {
        question: "What is the case lifecycle?",
        answer: "Cases progress through stages: Submitted → Under Review → PS Clearance → TA Clearance → Final Decision → Closed. Each stage has specific SLA requirements and approval workflows."
      },
      {
        question: "How do I update an existing case?",
        answer: "Go to 'Update Case' from the sidebar, search for the case by number or trainee name, and make your updates. All changes are logged in the case timeline."
      }
    ]
  },
  {
    category: "Relocations",
    icon: Users,
    color: "#2563EB",
    gradient: "from-blue-500 to-indigo-600",
    questions: [
      {
        question: "How do I request a relocation?",
        answer: "Submit a relocation request from the 'Submit Relocation' page. Provide the employee's current location, requested destination, and business justification. PS and TA teams will review the request."
      },
      {
        question: "What is the relocation approval process?",
        answer: "Relocations require clearance from both People Solutions (PS) and Talent Acquisition (TA). Each team has specific SLA targets to ensure timely processing."
      }
    ]
  },
  {
    category: "High Risk Cases",
    icon: AlertTriangle,
    color: "#EF4444",
    gradient: "from-red-500 to-orange-600",
    questions: [
      {
        question: "What qualifies as a high-risk case?",
        answer: "Cases flagged with risk status 'Critical' or 'High Risk' based on attendance patterns, performance metrics, or supervisor escalations. These cases require immediate attention and follow expedited workflows."
      },
      {
        question: "How do I escalate a case?",
        answer: "Use the 'Request Investigation' button on the case timeline or from Quick Actions. Provide escalation reasons and supporting documentation. The PS team will be notified automatically."
      }
    ]
  },
  {
    category: "Security & Access",
    icon: Shield,
    color: "#7C3AED",
    gradient: "from-violet-500 to-purple-600",
    questions: [
      {
        question: "How do I reset my password?",
        answer: "EEC uses Azure AD for authentication. Reset your password through the Microsoft 365 portal or contact your IT administrator. Password changes sync automatically with EEC."
      },
      {
        question: "Why can't I access certain features?",
        answer: "Feature access is role-based. Trainers can submit and view their own cases; Supervisors manage their teams; PS/TA handle clearances; Admins have full access. Contact your manager if you need additional permissions."
      }
    ]
  },
  {
    category: "Performance & SLA",
    icon: TrendingUp,
    color: "#F59E0B",
    gradient: "from-amber-500 to-yellow-600",
    questions: [
      {
        question: "What are the SLA targets?",
        answer: "PS Clearance: 90% within target time. TA Clearance: 95% within target time. Relocation Rate: 75% approval rate. SLA performance is tracked on your home dashboard."
      },
      {
        question: "How is my performance measured?",
        answer: "Your dashboard shows case throughput, SLA compliance, and accuracy metrics. Supervisors and managers have additional analytics for team performance."
      }
    ]
  }
];

const QUICK_TIPS = [
  { icon: Zap, text: "Press ? anywhere to open quick commands", color: "#00C4B4" },
  { icon: Lightbulb, text: "Use filters to find cases faster on dashboards", color: "#F59E0B" },
  { icon: Clock, text: "SLA timers auto-update every 5 minutes", color: "#2563EB" },
];

export default function HelpPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [activeTip, setActiveTip] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Animated background
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

    const hexagons: { x: number; y: number; size: number; alpha: number; rotation: number }[] = [];
    for (let i = 0; i < 15; i++) {
      hexagons.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        size: 20 + Math.random() * 40,
        alpha: 0.02 + Math.random() * 0.04,
        rotation: Math.random() * Math.PI,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      hexagons.forEach(h => {
        h.rotation += 0.002;
        ctx.save();
        ctx.translate(h.x, h.y);
        ctx.rotate(h.rotation);
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i;
          const x = h.size * Math.cos(angle);
          const y = h.size * Math.sin(angle);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = `rgba(0,196,180,${h.alpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      });

      requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("resize", resize);
    };
  }, []);

  // Rotate tips
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTip(t => (t + 1) % QUICK_TIPS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Filter FAQs based on search
  const filteredFAQs = FAQ_DATA.map(category => ({
    ...category,
    questions: category.questions.filter(q =>
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in space-y-6 relative">
      {/* Animated background canvas */}
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 opacity-60" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
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
              <motion.div
                className="w-10 h-10 rounded-xl flex items-center justify-center relative"
                style={{ background: "linear-gradient(135deg, #00C4B4, #0D2B45)" }}
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <HelpCircle className="w-5 h-5 text-white" />
              </motion.div>
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#00C4B4" }}>
                Knowledge Base
              </span>
            </motion.div>
            <motion.h1
              className="text-3xl font-bold"
              style={{ color: "#0D2B45", letterSpacing: "0.02em" }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              HELP CENTER
            </motion.h1>
            <motion.p
              className="text-sm mt-1"
              style={{ color: "#64748B" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Find answers instantly — or ask our team
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="hidden md:block"
          >
            <div className="px-4 py-2 rounded-full" style={{ background: "linear-gradient(135deg, rgba(0,196,180,0.1), rgba(13,43,69,0.05))" }}>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" style={{ color: "#00C4B4" }} />
                <span className="text-xs font-semibold" style={{ color: "#0D2B45" }}>{FAQ_DATA.reduce((a, c) => a + c.questions.length, 0)} Articles</span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Quick Tips Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.5 }}
        className="relative z-10 rounded-xl p-4 border overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.7))",
          backdropFilter: "blur(20px)",
          borderColor: "rgba(0,196,180,0.2)",
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTip}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-3"
          >
            {React.createElement(QUICK_TIPS[activeTip].icon, {
              className: "w-4 h-4",
              style: { color: QUICK_TIPS[activeTip].color }
            })}
            <span className="text-sm" style={{ color: "#0D2B45" }}>{QUICK_TIPS[activeTip].text}</span>
          </motion.div>
        </AnimatePresence>
        <div className="absolute bottom-2 right-4 flex gap-1">
          {QUICK_TIPS.map((_, i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full transition-all"
              style={{
                background: i === activeTip ? "#00C4B4" : "rgba(0,196,180,0.2)",
                width: i === activeTip ? "12px" : "6px",
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* Search Bar - Glassmorphism */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="relative z-10"
      >
        <div
          className="flex items-center gap-3 px-5 py-4 rounded-2xl border relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.8))",
            backdropFilter: "blur(20px)",
            borderColor: "rgba(0,196,180,0.2)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
          }}
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Search className="w-5 h-5 shrink-0" style={{ color: "#00C4B4" }} />
          </motion.div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for answers..."
            className="flex-1 text-sm outline-none bg-transparent"
            style={{ color: "#0D2B45" }}
          />
          {searchQuery && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setSearchQuery("")}
              className="text-xs px-3 py-1.5 rounded-lg transition-colors font-medium"
              style={{ color: "#00C4B4", background: "rgba(0,196,180,0.1)" }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Clear
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* FAQ Accordion with Stagger Animations */}
      <div className="space-y-4 relative z-10">
        {filteredFAQs.map((category, categoryIndex) => (
          <motion.div
            key={category.category}
            initial={{ opacity: 0, y: 30, rotateX: -10 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{
              delay: 0.35 + categoryIndex * 0.08,
              duration: 0.5,
              type: "spring",
              stiffness: 100
            }}
            className="rounded-2xl border overflow-hidden relative group"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.8))",
              backdropFilter: "blur(20px)",
              borderColor: "rgba(255,255,255,0.5)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
            }}
          >
            {/* Gradient accent on hover */}
            <motion.div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ background: `linear-gradient(135deg, ${category.color}08, transparent)` }}
            />

            {/* Category Header */}
            <div className="px-5 py-4 flex items-center gap-3 border-b relative" style={{ borderColor: "rgba(0,196,180,0.1)" }}>
              <motion.div
                className={`w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br ${category.gradient}`}
                whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                transition={{ duration: 0.3 }}
              >
                <category.icon className="w-5 h-5 text-white" />
              </motion.div>
              <div>
                <h3 className="font-semibold text-sm" style={{ color: "#0D2B45" }}>{category.category}</h3>
                <p className="text-xs" style={{ color: "#94A3B8" }}>{category.questions.length} question{category.questions.length !== 1 ? "s" : ""}</p>
              </div>
              <div className="ml-auto">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold" style={{ background: `${category.color}15`, color: category.color }}>
                  FAQ
                </span>
              </div>
            </div>

            {/* Questions */}
            <div className="divide-y" style={{ borderColor: "rgba(0,196,180,0.05)" }}>
              {category.questions.map((faq, faqIndex) => {
                const faqId = `${categoryIndex}-${faqIndex}`;
                const isExpanded = expandedFAQ === faqId;

                return (
                  <motion.div
                    key={faqIndex}
                    className="overflow-hidden relative"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + categoryIndex * 0.08 + faqIndex * 0.05, duration: 0.4 }}
                  >
                    <button
                      onClick={() => toggleFAQ(faqId)}
                      className="w-full flex items-center justify-between px-5 py-4 text-left transition-all relative group/q"
                    >
                      <div className="absolute inset-0 opacity-0 group-hover/q:opacity-100 transition-opacity" style={{ background: "linear-gradient(90deg, rgba(0,196,180,0.05), transparent)" }} />
                      <div className="flex items-center gap-3 flex-1 min-w-0 relative z-10">
                        <motion.div
                          animate={{ rotate: isExpanded ? 90 : 0, scale: isExpanded ? 1.2 : 1 }}
                          transition={{ duration: 0.2 }}
                          className="shrink-0"
                        >
                          <ChevronRight className="w-4 h-4" style={{ color: isExpanded ? category.color : "#94A3B8" }} />
                        </motion.div>
                        <span className="text-sm font-medium" style={{ color: "#0D2B45" }}>{faq.question}</span>
                      </div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                        >
                          <motion.div
                            className="px-5 pb-4 pl-12 relative"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                          >
                            <div
                              className="p-4 rounded-xl border-l-2"
                              style={{
                                background: `${category.color}08`,
                                borderColor: category.color,
                              }}
                            >
                              <p className="text-sm leading-relaxed" style={{ color: "#64748B" }}>{faq.answer}</p>
                            </div>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>

      {/* No Results */}
      {filteredFAQs.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12 relative z-10"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <HelpCircle className="w-16 h-16 mx-auto mb-4" style={{ color: "#CBD5E1" }} />
          </motion.div>
          <p className="font-semibold text-lg" style={{ color: "#0D2B45" }}>No results found</p>
          <p className="text-sm mt-2 max-w-md mx-auto" style={{ color: "#94A3B8" }}>
            Try a different search term or browse the categories above.
          </p>
          <motion.button
            onClick={() => setSearchQuery("")}
            className="mt-4 px-5 py-2 rounded-xl text-sm font-medium"
            style={{ background: "rgba(0,196,180,0.1)", color: "#00C4B4" }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Clear search
          </motion.button>
        </motion.div>
      )}

      {/* Quick Links - Glassmorphism */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10"
      >
        <motion.button
          onClick={() => navigate("/support")}
          className="flex items-center justify-between p-5 rounded-2xl border relative overflow-hidden group"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.8))",
            backdropFilter: "blur(20px)",
            borderColor: "rgba(0,196,180,0.2)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
          }}
          whileHover={{ scale: 1.02, boxShadow: "0 12px 40px rgba(0,196,180,0.12)" }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: "radial-gradient(circle at left center, rgba(0,196,180,0.1), transparent)" }}
          />
          <div className="flex items-center gap-4 relative z-10">
            <motion.div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, rgba(0,196,180,0.2), rgba(0,196,180,0.1))" }}
              whileHover={{ rotate: [0, -10, 10, 0] }}
            >
              <Mail className="w-5 h-5" style={{ color: "#00C4B4" }} />
            </motion.div>
            <div className="text-left">
              <p className="text-sm font-semibold" style={{ color: "#0D2B45" }}>Contact Support</p>
              <p className="text-xs" style={{ color: "#94A3B8" }}>Get personalized help</p>
            </div>
          </div>
          <motion.div
            animate={{ x: [0, 4, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ChevronRight className="w-5 h-5" style={{ color: "#94A3B8" }} />
          </motion.div>
        </motion.button>

        <motion.a
          href="mailto:kareem.alihamza@concentrix.com?subject=EEC%20Feature%20Request"
          className="flex items-center justify-between p-5 rounded-2xl border relative overflow-hidden group"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.8))",
            backdropFilter: "blur(20px)",
            borderColor: "rgba(37,99,235,0.2)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
          }}
          whileHover={{ scale: 1.02, boxShadow: "0 12px 40px rgba(37,99,235,0.12)" }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: "radial-gradient(circle at left center, rgba(37,99,235,0.1), transparent)" }}
          />
          <div className="flex items-center gap-4 relative z-10">
            <motion.div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, rgba(37,99,235,0.2), rgba(37,99,235,0.1))" }}
              whileHover={{ rotate: [0, -10, 10, 0] }}
            >
              <MessageCircle className="w-5 h-5" style={{ color: "#2563EB" }} />
            </motion.div>
            <div className="text-left">
              <p className="text-sm font-semibold" style={{ color: "#0D2B45" }}>Request a Feature</p>
              <p className="text-xs" style={{ color: "#94A3B8" }}>Suggest improvements</p>
            </div>
          </div>
          <motion.div
            animate={{ x: [0, 4, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ExternalLink className="w-5 h-5" style={{ color: "#94A3B8" }} />
          </motion.div>
        </motion.a>
      </motion.div>
    </div>
  );
}
