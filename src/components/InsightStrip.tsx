import React from "react";

interface InsightStripProps {
  message: string;
  onDismiss?: () => void;
  className?: string;
}

export default function InsightStrip({
  message,
  onDismiss,
  className = "",
}: InsightStripProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-teal-200/60 bg-teal-50/70 backdrop-blur-sm animate-slide-up ${className}`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-8 h-8 rounded-lg bg-white border border-teal-200 flex items-center justify-center shrink-0 shadow-sm">
          <SparkIcon className="w-4 h-4 text-teal-600" />
        </div>
        <p className="flex-1 text-sm text-navy-800 leading-relaxed">{message}</p>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-teal-600 hover:text-teal-800 text-xs font-medium px-2 py-1 rounded transition-colors shrink-0"
            aria-label="Dismiss insight"
          >
            Dismiss
          </button>
        )}
      </div>
      <div
        className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-teal-400 to-teal-600"
        aria-hidden
      />
    </div>
  );
}

function SparkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.4 1 1.1 1 1.8V18h6v-1.5c0-.7.4-1.4 1-1.8A7 7 0 0 0 12 2z" />
    </svg>
  );
}
