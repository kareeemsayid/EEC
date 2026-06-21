/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        barlow: ["'Barlow'", "sans-serif"],
        "barlow-condensed": ["'Barlow Condensed'", "sans-serif"],
        inter: ["'Inter'", "sans-serif"],
        mono: ["'Space Mono'", "monospace"],
      },
      colors: {
        // Brand design tokens (Section 11 — single source of truth)
        navy: {
          50: "#e6f0f4",
          100: "#cce0e8",
          200: "#99c0d0",
          300: "#66a1b8",
          400: "#3382a0",
          500: "#006381",
          600: "#005470",
          700: "#004D71", // gradient partner
          800: "#003D5C", // navy-900 primary dark surface
          900: "#003D5C",
          950: "#002738",
        },
        teal: {
          50: "#e6fbf7",
          100: "#ccf6ee",
          200: "#99ecdd",
          300: "#66e3cc",
          400: "#33d9bc",
          500: "#25E2CC", // teal-accent
          600: "#0EA89B", // teal-action (buttons/links with white text)
          700: "#0b8a80",
          800: "#086c64",
          900: "#054e48",
        },
        canvas: "#F6F9F9",
        status: {
          critical: "#EF4444",
          warning: "#F59E0B",
          ok: "#0EA89B",
        },
        dark: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "glass-gradient": "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
        "gradient-teal": "linear-gradient(135deg, #0EA89B 0%, #14b8a6 55%, #25E2CC 100%)",
        "gradient-navy": "linear-gradient(160deg, #003D5C 0%, #004D71 55%, #003D5C 100%)",
        "gradient-dark": "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)",
        "gradient-mesh": "radial-gradient(at 0% 0%, hsla(190, 100%, 36%, 0.10) 0px, transparent 50%), radial-gradient(at 100% 0%, hsla(190, 100%, 36%, 0.06) 0px, transparent 50%)",
        "navy-grain":
          "linear-gradient(160deg, #003D5C 0%, #004D71 100%)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "fade-in-up": "fadeInUp 0.5s ease-out",
        "fade-in-down": "fadeInDown 0.5s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "slide-down": "slideDown 0.4s ease-out",
        "slide-left": "slideLeft 0.4s ease-out",
        "slide-right": "slideRight 0.4s ease-out",
        "scale-in": "scaleIn 0.25s ease-out",
        "scale-out": "scaleOut 0.3s ease-out",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "pulse-fast": "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow": "spin 3s linear infinite",
        "shimmer": "shimmer 1.6s linear infinite",
        "float": "float 3s ease-in-out infinite",
        "glow": "glow 3s ease-in-out infinite alternate",
        "tilt": "tilt 0.3s ease-out",
        "ripple": "ripple 0.6s linear",
        "gradient-shift": "gradientShift 6s ease infinite",
        "breathing": "breathing 6s ease-in-out infinite",
        "seam-shimmer": "seamShimmer 4s ease-in-out infinite",
        "sweep-highlight": "sweepHighlight 1.2s ease-out",
        "check-draw": "checkDraw 0.4s ease-out forwards",
        "cursor-blink": "cursorBlink 1s step-end infinite",
        "sheen": "sheen 7s ease-in-out infinite",
        "fill-sweep": "fillSweep 0.4s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeInDown: {
          "0%": { opacity: "0", transform: "translateY(-16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          "0%": { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideLeft: {
          "0%": { transform: "translateX(8px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        slideRight: {
          "0%": { transform: "translateX(-8px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.96)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        scaleOut: {
          "0%": { transform: "scale(1.04)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        glow: {
          "0%": { boxShadow: "0 0 6px rgba(37, 226, 204, 0.30), 0 0 12px rgba(37, 226, 204, 0.18)" },
          "100%": { boxShadow: "0 0 18px rgba(37, 226, 204, 0.55), 0 0 32px rgba(37, 226, 204, 0.35)" },
        },
        tilt: {
          "0%": { transform: "perspective(1000px) rotateX(0deg) rotateY(0deg)" },
          "100%": { transform: "perspective(1000px) rotateX(2deg) rotateY(-2deg)" },
        },
        ripple: {
          "0%": { transform: "scale(0)", opacity: "1" },
          "100%": { transform: "scale(4)", opacity: "0" },
        },
        gradientShift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        breathing: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.9" },
          "50%": { transform: "scale(1.015)", opacity: "1" },
        },
        seamShimmer: {
          "0%, 100%": { transform: "translateY(-100%)", opacity: "0.3" },
          "50%": { transform: "translateY(100%)", opacity: "1" },
        },
        sweepHighlight: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        checkDraw: {
          "0%": { strokeDashoffset: "100" },
          "100%": { strokeDashoffset: "0" },
        },
        cursorBlink: {
          "0%, 50%": { opacity: "1" },
          "51%, 100%": { opacity: "0" },
        },
        sheen: {
          "0%, 90%": { transform: "translateX(-150%) skewX(-20deg)", opacity: "0" },
          "40%": { opacity: "0.5" },
          "100%": { transform: "translateX(150%) skewX(-20deg)", opacity: "0" },
        },
        fillSweep: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        "glass": "0 8px 32px 0 rgba(0, 61, 92, 0.12)",
        "glass-sm": "0 4px 16px 0 rgba(0, 61, 92, 0.08)",
        "glass-lg": "0 12px 48px 0 rgba(0, 61, 92, 0.18)",
        "glow-teal": "0 0 20px rgba(37, 226, 204, 0.35)",
        "glow-teal-lg": "0 0 40px rgba(37, 226, 204, 0.45)",
        "inner-glow": "inset 0 2px 4px 0 rgba(255, 255, 255, 0.08)",
        "elevated": "0 10px 40px -10px rgba(0, 61, 92, 0.15)",
        "card": "0 1px 3px 0 rgba(0, 61, 92, 0.06), 0 1px 2px -1px rgba(0, 61, 92, 0.04)",
        "card-hover": "0 12px 24px -6px rgba(0, 61, 92, 0.12), 0 4px 8px -3px rgba(0, 61, 92, 0.06)",
      },
      transitionTimingFunction: {
        "bounce-in": "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        "smooth": "cubic-bezier(0.4, 0, 0.2, 1)",
        "spring": "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      scale: {
        "102": "1.02",
        "98": "0.98",
      },
    },
  },
  plugins: [],
};
