import React from "react";

export function KpiSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 rounded-xl shimmer-bg" />
        <div className="w-6 h-6 rounded-full shimmer-bg" />
      </div>
      <div className="w-20 h-9 rounded-md shimmer-bg mb-2" />
      <div className="w-28 h-4 rounded shimmer-bg" />
      <div className="mt-4 h-1.5 w-full rounded-full shimmer-bg" />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="w-40 h-6 rounded shimmer-bg mb-6" />
      <div className="flex items-end gap-2 h-48">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-md shimmer-bg"
            style={{ height: `${30 + Math.random() * 60}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function TableRowSkeleton({ columns = 6 }: { columns?: number }) {
  return (
    <tr className="border-b border-gray-100">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-5 py-3.5">
          <div className="h-3.5 rounded shimmer-bg" style={{ width: `${60 + (i % 3) * 15}%` }} />
        </td>
      ))}
    </tr>
  );
}

export function ListRowSkeleton() {
  return (
    <div className="px-5 py-3 border-b border-gray-50">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full shimmer-bg shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 rounded shimmer-bg w-1/2" />
          <div className="h-2.5 rounded shimmer-bg w-1/3" />
        </div>
        <div className="w-12 h-5 rounded-full shimmer-bg" />
      </div>
    </div>
  );
}

export function CaseCardSkeleton() {
  return (
    <div className="px-5 py-3.5 border-b border-gray-50">
      <div className="flex items-center gap-4">
        <div className="w-20 h-4 rounded shimmer-bg" />
        <div className="flex-1 h-4 rounded shimmer-bg" />
        <div className="w-14 h-5 rounded-full shimmer-bg" />
        <div className="w-16 h-5 rounded-full shimmer-bg" />
        <div className="w-10 h-4 rounded shimmer-bg" />
        <div className="w-4 h-4 rounded-full shimmer-bg" />
      </div>
    </div>
  );
}

export function ActivitySkeleton() {
  return (
    <div className="px-5 py-3 border-b border-gray-50">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full shimmer-bg shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 rounded shimmer-bg w-2/3" />
          <div className="h-2.5 rounded shimmer-bg w-1/2" />
        </div>
        <div className="w-12 h-3 rounded shimmer-bg" />
      </div>
    </div>
  );
}

export default function Skeleton({
  variant = "text",
  width,
  height,
  className = "",
}: {
  variant?: "text" | "circle" | "rect";
  width?: number | string;
  height?: number | string;
  className?: string;
}) {
  const size =
    variant === "circle"
      ? "rounded-full"
      : variant === "rect"
      ? "rounded-lg"
      : "rounded h-4";

  const style: React.CSSProperties = {
    width: width ?? "100%",
    height: height ?? (variant === "text" ? "1rem" : variant === "circle" ? 40 : 48),
  };

  return <div className={`shimmer-bg ${size} ${className}`} style={style} />;
}
