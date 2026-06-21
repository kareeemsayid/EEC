import React from "react";

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  message?: string;
  action?: { label: string; onClick: () => void };
}

export default function EmptyState({
  icon: Icon,
  title,
  message,
  action,
}: EmptyStateProps) {
  return (
    <div className="py-12 text-center">
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center mx-auto mb-4 animate-breathing">
          <Icon className="w-7 h-7 text-teal-500" />
        </div>
      )}
      <p className="text-gray-700 font-medium">{title}</p>
      {message && (
        <p className="text-gray-400 text-sm mt-1 max-w-sm mx-auto">{message}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 bg-gradient-teal hover:opacity-90 text-white text-sm font-medium px-5 py-2 rounded-xl transition-all shadow-glow-teal"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
