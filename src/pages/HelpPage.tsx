import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Search, ChevronRight, CircleHelp as HelpCircle, Users, TriangleAlert as AlertTriangle, Shield, Clock, ArrowLeft, Mail, MessageCircle, ExternalLink } from "lucide-react";

const FAQ_DATA = [
  {
    category: "Getting Started",
    icon: BookOpen,
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
    icon: Clock,
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

export default function HelpPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

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
              <HelpCircle className="w-5 h-5" style={{ color: "#00C4B4" }} />
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "#00C4B4" }}>
                How Can We Assist You?
              </span>
            </div>
            <h1 className="text-3xl font-bold" style={{ color: "#0D2B45", letterSpacing: "0.02em" }}>
              HELP CENTER
            </h1>
            <p className="text-sm mt-1" style={{ color: "#64748B" }}>
              Knowledge Base – Find Your Answers
            </p>
          </div>
        </div>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="relative"
      >
        <div className="flex items-center gap-3 px-5 py-4 rounded-2xl border border-gray-100 shadow-sm bg-white">
          <Search className="w-5 h-5 shrink-0" style={{ color: "#00C4B4" }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for answers..."
            className="flex-1 text-sm outline-none"
            style={{ color: "#0D2B45" }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs px-2 py-1 rounded-lg transition-colors hover:bg-gray-100"
              style={{ color: "#94A3B8" }}
            >
              Clear
            </button>
          )}
        </div>
      </motion.div>

      {/* FAQ Accordion */}
      <div className="space-y-4">
        {filteredFAQs.map((category, categoryIndex) => (
          <motion.div
            key={category.category}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + categoryIndex * 0.05, duration: 0.4 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
          >
            {/* Category Header */}
            <div className="px-5 py-4 flex items-center gap-3 border-b border-gray-100">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,196,180,0.1)" }}>
                <category.icon className="w-5 h-5" style={{ color: "#00C4B4" }} />
              </div>
              <div>
                <h3 className="font-semibold text-sm" style={{ color: "#0D2B45" }}>{category.category}</h3>
                <p className="text-xs" style={{ color: "#94A3B8" }}>{category.questions.length} question{category.questions.length !== 1 ? "s" : ""}</p>
              </div>
            </div>

            {/* Questions */}
            <div className="divide-y divide-gray-50">
              {category.questions.map((faq, faqIndex) => {
                const faqId = `${categoryIndex}-${faqIndex}`;
                const isExpanded = expandedFAQ === faqId;

                return (
                  <div key={faqIndex} className="overflow-hidden">
                    <button
                      onClick={() => toggleFAQ(faqId)}
                      className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <motion.div
                          animate={{ rotate: isExpanded ? 90 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "#94A3B8" }} />
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
                          <div className="px-5 pb-4 pl-12">
                            <p className="text-sm leading-relaxed" style={{ color: "#64748B" }}>{faq.answer}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>

      {/* No Results */}
      {filteredFAQs.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <HelpCircle className="w-12 h-12 mx-auto mb-3" style={{ color: "#CBD5E1" }} />
          <p className="font-medium" style={{ color: "#64748B" }}>No results found</p>
          <p className="text-sm mt-1" style={{ color: "#94A3B8" }}>Try a different search term or browse the categories above.</p>
        </motion.div>
      )}

      {/* Quick Links */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        <button
          onClick={() => navigate("/support")}
          className="flex items-center justify-between p-5 rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,196,180,0.1)" }}>
              <Mail className="w-5 h-5" style={{ color: "#00C4B4" }} />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold" style={{ color: "#0D2B45" }}>Contact Support</p>
              <p className="text-xs" style={{ color: "#94A3B8" }}>Get personalized help</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" style={{ color: "#94A3B8" }} />
        </button>

        <a
          href="mailto:kareem.alihamza@concentrix.com?subject=EEC%20Feature%20Request"
          className="flex items-center justify-between p-5 rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(37,99,235,0.1)" }}>
              <MessageCircle className="w-5 h-5" style={{ color: "#2563EB" }} />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold" style={{ color: "#0D2B45" }}>Request a Feature</p>
              <p className="text-xs" style={{ color: "#94A3B8" }}>Suggest improvements</p>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" style={{ color: "#94A3B8" }} />
        </a>
      </motion.div>
    </div>
  );
}
