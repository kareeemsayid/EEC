import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
}

export default function LoadingSpinner({ size = "md", label }: LoadingSpinnerProps) {
  const sizeMap = { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-10 w-10" };
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`${sizeMap[size]} animate-spin rounded-full border-2 border-gray-200 border-t-teal-600`}
      />
      {label && <p className="text-sm text-gray-500">{label}</p>}
    </div>
  );
}
