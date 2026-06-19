import React from "react";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circle" | "rect";
  width?: string | number;
  height?: string | number;
  count?: number;
}

export default function Skeleton({
  className = "",
  variant = "text",
  width,
  height,
  count = 1,
}: SkeletonProps) {
  const baseClasses =
    "bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer bg-[length:200%_100%]";

  const variantClasses = {
    text: "rounded h-4",
    circle: "rounded-full",
    rect: "rounded-lg",
  };

  const style: React.CSSProperties = {
    width: width || (variant === "circle" ? height : "100%"),
    height: height || (variant === "text" ? "1rem" : variant === "circle" ? width : "3rem"),
  };

  const elements = [];
  for (let i = 0; i < count; i++) {
    elements.push(
      <div
        key={i}
        className={`${baseClasses} ${variantClasses[variant]} ${className}`}
        style={style}
      />
    );
  }

  return <>{elements}</>;
}

export function KpiSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <Skeleton variant="rect" width={36} height={36} className="rounded-xl" />
        <Skeleton variant="text" width={40} height={12} />
      </div>
      <Skeleton variant="text" width={60} height={36} className="mb-1" />
      <Skeleton variant="text" width={80} height={14} />
    </div>
  );
}

export function TableRowSkeleton({ columns = 6 }: { columns?: number }) {
  return (
    <tr className="border-b border-gray-100">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton variant="text" height={16} />
        </td>
      ))}
    </tr>
  );
}

export function ActivitySkeleton() {
  return (
    <div className="px-5 py-3 border-b border-gray-50">
      <div className="flex items-start gap-3">
        <Skeleton variant="circle" width={40} height={40} />
        <div className="flex-1">
          <Skeleton variant="text" width="70%" height={14} className="mb-2" />
          <Skeleton variant="text" width="50%" height={12} />
        </div>
        <Skeleton variant="text" width={60} height={12} />
      </div>
    </div>
  );
}

export function CaseCardSkeleton() {
  return (
    <div className="px-5 py-3.5 border-b border-gray-50">
      <div className="flex items-center gap-4">
        <Skeleton variant="text" width={80} height={14} />
        <Skeleton variant="text" width="30%" height={16} />
        <Skeleton variant="rect" width={60} height={20} className="rounded-full" />
        <Skeleton variant="rect" width={80} height={20} className="rounded-full" />
        <Skeleton variant="text" width={40} height={14} />
        <Skeleton variant="circle" width={16} height={16} />
      </div>
    </div>
  );
}
