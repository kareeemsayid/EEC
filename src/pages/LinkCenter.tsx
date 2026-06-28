import React, { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ExternalLink,
  GraduationCap,
  Briefcase,
  BookOpen,
  Globe,
  Users,
  Shield,
  Wrench,
  Search,
  Sparkles,
  Star,
} from "lucide-react";

interface LinkItem {
  id: string;
  title: string;
  description: string;
  url: string;
  icon: React.ElementType;
  color: string;
  gradient: string;
  category: string;
}

const LINKS: LinkItem[] = [
  {
    id: "workday",
    title: "Workday",
    description: "HR management, time tracking, payroll, and employee self-service portal",
    url: "https://www.myworkday.com/cnx/d/home.htmld",
    icon: Briefcase,
    color: "#2563EB",
    gradient: "from-blue-500 to-indigo-600",
    category: "HR Systems",
  },
  {
    id: "tms",
    title: "TMS",
    description: "Training Management System for learning paths and course assignments",
    url: "http://TMS.CONCENTRIX.COM",
    icon: GraduationCap,
    color: "#00C4B4",
    gradient: "from-teal-500 to-emerald-600",
    category: "Training",
  },
  {
    id: "servicehub",
    title: "Service Hub",
    description: "IT service desk and support ticket management",
    url: "#",
    icon: Wrench,
    color: "#F59E0B",
    gradient: "from-amber-500 to-orange-600",
    category: "IT Support",
  },
  {
    id: "learning",
    title: "Learning Portal",
    description: "Access training materials, certifications, and skill development resources",
    url: "#",
    icon: BookOpen,
    color: "#7C3AED",
    gradient: "from-violet-500 to-purple-600",
    category: "Training",
  },
  {
    id: "hrportal",
    title: "HR Portal",
    description: "Employee policies, benefits information, and HR documentation",
    url: "#",
    icon: Users,
    color: "#EF4444",
    gradient: "from-red-500 to-rose-600",
    category: "HR Systems",
  },
  {
    id: "security",
    title: "Security Hub",
    description: "Report security incidents and access security awareness training",
    url: "#",
    icon: Shield,
    color: "#0D2B45",
    gradient: "from-slate-700 to-slate-900",
    category: "IT Support",
  },
];

const CATEGORIES = ["All", "HR Systems", "Training", "IT Support"];

export default function LinkCenter() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Animated background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    // Floating particles
    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number; hue: number }[] =
      Array.from({ length: 50 }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: 2 + Math.random() * 4,
        alpha: 0.1 + Math.random() * 0.3,
        hue: 170 + Math.random() * 30,
      }));

    let t = 0;
    const animate = () => {
      t += 0.01;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      particles.forEach((p) => {
        p.x += p.vx + Math.sin(t + p.y * 0.01) * 0.1;
        p.y += p.vy + Math.cos(t + p.x * 0.01) * 0.1;

        if (p.x < 0) p.x = window.innerWidth;
        if (p.x > window.innerWidth) p.x = 0;
        if (p.y < 0) p.y = window.innerHeight;
        if (p.y > window.innerHeight) p.y = 0;

        const alpha = p.alpha * (0.6 + 0.4 * Math.sin(t * 2 + p.x * 0.005));

        // Glow
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 8);
        glow.addColorStop(0, `hsla(${p.hue}, 70%, 60%, ${alpha * 0.4})`);
        glow.addColorStop(1, "transparent");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 8, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.fillStyle = `hsla(${p.hue}, 80%, 70%, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Connection lines
      ctx.strokeStyle = "rgba(0,196,180,0.04)";
      ctx.lineWidth = 1;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dist = Math.hypot(particles[j].x - particles[i].x, particles[j].y - particles[i].y);
          if (dist < 180) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("resize", resize);
    };
  }, []);

  // Filter links
  const filteredLinks = LINKS.filter((link) => {
    const matchesSearch =
      !searchQuery ||
      link.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "All" || link.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen relative animate-fade-in pb-12">
      {/* Animated background canvas */}
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" style={{ opacity: 0.5 }} />

      <div className="relative z-10 max-w-6xl mx-auto space-y-8 pt-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm font-medium mb-4 transition-colors hover:opacity-80"
            style={{ color: "#64748B" }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <motion.div
                className="flex items-center gap-2 mb-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <motion.div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center relative"
                  style={{ background: "linear-gradient(135deg, #00C4B4, #0D2B45)" }}
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <Globe className="w-6 h-6 text-white" />
                  <motion.div
                    className="absolute inset-0 rounded-2xl"
                    animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                    style={{ border: "2px solid rgba(0,196,180,0.4)" }}
                  />
                </motion.div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider block" style={{ color: "#00C4B4" }}>
                    Resources & Tools
                  </span>
                  <span className="text-[10px] text-slate-400">Quick access to essential platforms</span>
                </div>
              </motion.div>

              <motion.h1
                className="text-4xl font-black mb-2"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                style={{ color: "#0D2B45", letterSpacing: "-0.02em" }}
              >
                Training & Resources Hub
              </motion.h1>
              <motion.p
                className="text-sm max-w-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                style={{ color: "#64748B" }}
              >
                Your gateway to essential company tools, training platforms, and HR resources.
                Everything you need, just one click away.
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 }}
              className="flex items-center gap-3"
            >
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-full"
                style={{ background: "linear-gradient(135deg, rgba(0,196,180,0.1), rgba(13,43,69,0.08))" }}
              >
                <Sparkles className="w-4 h-4" style={{ color: "#00C4B4" }} />
                <span className="text-xs font-semibold" style={{ color: "#0D2B45" }}>
                  {LINKS.length} Resources
                </span>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Search & Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search resources..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl border text-sm outline-none focus:ring-2 transition-all"
              style={{
                background: "rgba(255,255,255,0.9)",
                borderColor: "rgba(0,196,180,0.2)",
                color: "#0D2B45",
              }}
            />
          </div>

          {/* Category filters */}
          <div className="flex gap-2">
            {CATEGORIES.map((cat) => (
              <motion.button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  background:
                    activeCategory === cat
                      ? "linear-gradient(135deg, #00C4B4, #0D2B45)"
                      : "rgba(0,0,0,0.03)",
                  color: activeCategory === cat ? "white" : "#64748B",
                  border:
                    activeCategory === cat ? "none" : "1px solid rgba(0,0,0,0.08)",
                }}
              >
                {cat}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Links Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredLinks.map((link, index) => {
            const Icon = link.icon;
            const isHovered = hoveredCard === link.id;

            return (
              <motion.div
                key={link.id}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.45 + index * 0.08, duration: 0.4 }}
                onMouseEnter={() => setHoveredCard(link.id)}
                onMouseLeave={() => setHoveredCard(null)}
                whileHover={{ y: -8 }}
                className="relative group"
              >
                {/* Glow effect on hover */}
                <motion.div
                  className="absolute -inset-2 rounded-3xl pointer-events-none transition-opacity duration-300"
                  style={{
                    background: `radial-gradient(circle, ${link.color}20, transparent)`,
                    opacity: isHovered ? 1 : 0,
                    filter: "blur(20px)",
                  }}
                />

                {/* Card */}
                <div
                  className="relative rounded-2xl p-6 transition-all duration-300 overflow-hidden cursor-pointer h-full"
                  style={{
                    background: isHovered
                      ? "linear-gradient(145deg, rgba(255,255,255,0.98), rgba(248,250,252,0.95))"
                      : "linear-gradient(145deg, rgba(255,255,255,0.9), rgba(248,250,252,0.85))",
                    backdropFilter: "blur(20px)",
                    border: isHovered ? `2px solid ${link.color}` : "2px solid rgba(0,196,180,0.15)",
                    boxShadow: isHovered
                      ? `0 20px 40px ${link.color}20, 0 0 0 1px ${link.color}20`
                      : "0 10px 30px rgba(0,0,0,0.06)",
                  }}
                >
                  {/* Animated gradient border effect */}
                  <motion.div
                    className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{
                      background: `linear-gradient(135deg, ${link.color}10, transparent, ${link.color}05)`,
                    }}
                  />

                  {/* Icon */}
                  <motion.div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 bg-gradient-to-br ${link.gradient}`}
                    whileHover={{ rotate: [0, -5, 5, 0], scale: 1.1 }}
                    transition={{ duration: 0.4 }}
                    style={{
                      boxShadow: `0 8px 24px ${link.color}30`,
                    }}
                  >
                    <Icon className="w-7 h-7 text-white" />
                  </motion.div>

                  {/* Content */}
                  <h3
                    className="text-lg font-bold mb-2 transition-colors"
                    style={{ color: isHovered ? link.color : "#0D2B45" }}
                  >
                    {link.title}
                  </h3>
                  <p className="text-sm mb-5 leading-relaxed" style={{ color: "#64748B" }}>
                    {link.description}
                  </p>

                  {/* Category badge */}
                  <span
                    className="inline-block px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider mb-4"
                    style={{
                      background: `${link.color}10`,
                      color: link.color,
                    }}
                  >
                    {link.category}
                  </span>

                  {/* Visit button */}
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all w-fit"
                    style={{
                      background: isHovered
                        ? `linear-gradient(135deg, ${link.color}, ${link.color}DD)`
                        : `${link.color}10`,
                      color: isHovered ? "white" : link.color,
                      boxShadow: isHovered ? `0 8px 20px ${link.color}30` : "none",
                    }}
                    onClick={(e) => {
                      if (link.url === "#") {
                        e.preventDefault();
                      }
                    }}
                  >
                    <ExternalLink className="w-4 h-4" />
                    {link.url === "#" ? "Coming Soon" : "Visit"}
                    <motion.div
                      animate={isHovered ? { x: [0, 3, 0] } : {}}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <ArrowLeft className="w-3 h-3 rotate-180" />
                    </motion.div>
                  </a>

                  {/* Star decoration */}
                  <motion.div
                    className="absolute top-4 right-4"
                    animate={{ rotate: [0, 15, -15, 0], opacity: isHovered ? [0.3, 0.7, 0.3] : 0.2 }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Star className="w-4 h-4" style={{ color: link.color }} />
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* No results */}
        {filteredLinks.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(0,196,180,0.1)" }}
            >
              <Search className="w-8 h-8" style={{ color: "#00C4B4" }} />
            </motion.div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: "#0D2B45" }}>
              No resources found
            </h3>
            <p className="text-sm" style={{ color: "#64748B" }}>
              Try adjusting your search or filter criteria
            </p>
            <motion.button
              onClick={() => {
                setSearchQuery("");
                setActiveCategory("All");
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="mt-4 px-5 py-2.5 rounded-xl text-sm font-medium"
              style={{ background: "rgba(0,196,180,0.1)", color: "#00C4B4" }}
            >
              Clear filters
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
