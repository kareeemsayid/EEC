import React, { useState, useRef, useEffect } from "react";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  delay?: number;
  maxWidth?: number;
}

export default function Tooltip({
  content,
  children,
  position = "top",
  delay = 300,
  maxWidth = 240,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => setIsVisible(true), delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-white border-x-transparent border-b-transparent",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-white border-x-transparent border-t-transparent",
    left: "left-full top-1/2 -translate-y-1/2 border-l-white border-y-transparent border-r-transparent",
    right: "right-full top-1/2 -translate-y-1/2 border-r-white border-y-transparent border-l-transparent",
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`absolute ${positionClasses[position]} z-[60] pointer-events-none`}
          style={{
            animation: "fadeInUp 200ms ease-out both",
          }}
        >
          <div
            className="bg-white text-gray-900 text-xs px-3 py-2.5 rounded-lg shadow-xl border border-gray-100"
            style={{
              maxWidth,
              boxShadow: "0 8px 24px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,196,180,0.1)",
            }}
          >
            {content}
          </div>
          <div
            className={`absolute w-0 h-0 border-[5px] ${arrowClasses[position]}`}
          />
        </div>
      )}
    </div>
  );
}
