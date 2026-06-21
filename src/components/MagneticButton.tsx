import React, { useRef } from "react";

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}

export default function MagneticButton({
  children,
  strength = 0.25,
  className = "",
  onMouseMove,
  onMouseLeave,
  ...rest
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onMouseMove?.(e);
      return;
    }
    const el = ref.current;
    if (!el) {
      onMouseMove?.(e);
      return;
    }
    const rect = el.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
    onMouseMove?.(e);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    const el = ref.current;
    if (el) el.style.transform = "translate(0px, 0px)";
    onMouseLeave?.(e);
  };

  return (
    <button
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`transition-transform duration-200 ease-out ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
