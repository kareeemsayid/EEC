import React, { useMemo } from "react";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
  strokeWidth?: number;
  className?: string;
}

export default function Sparkline({
  data,
  width = 72,
  height = 28,
  stroke = "#0EA89B",
  fill = "rgba(14, 168, 155, 0.12)",
  strokeWidth = 1.5,
  className = "",
}: SparklineProps) {
  const { path, area } = useMemo(() => {
    if (!data.length) return { path: "", area: "" };
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const step = data.length > 1 ? width / (data.length - 1) : 0;

    const points = data.map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return [x, y] as const;
    });

    const path = points
      .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`)
      .join(" ");

    const area = `${path} L${width},${height} L0,${height} Z`;

    return { path, area };
  }, [data, width, height]);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden="true"
    >
      {area && <path d={area} fill={fill} />}
      {path && (
        <path
          d={path}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}
