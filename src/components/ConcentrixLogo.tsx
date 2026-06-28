import React from "react";

interface ConcentrixLogoProps {
  size?: "sm" | "md" | "lg";
  variant?: "light" | "dark";
}

const SIZE_MAP = { sm: 28, md: 36, lg: 56 };

export default function ConcentrixLogo({ size = "md", variant = "light" }: ConcentrixLogoProps) {
  const px = SIZE_MAP[size];

  return (
    <div className="flex items-center gap-2.5">
      <img
        src="/assets/images/217c0fe1-2aee-4858-ba08-8e5493ca7a16.png"
        alt="Concentrix"
        width={px}
        height={px}
        className="rounded-[22%] shrink-0 object-contain"
        style={{ width: px, height: px }}
      />
      {size !== "sm" && (
        <div className="leading-none">
          <p
            className={`font-barlow-condensed font-bold tracking-wide ${
              variant === "light" ? "text-white" : "text-[#003D5C]"
            } ${size === "lg" ? "text-2xl" : "text-base"}`}
          >
            CONCENTRIX
          </p>
          <p
            className={`text-[10px] uppercase tracking-[0.2em] ${
              variant === "light" ? "text-teal-200/70" : "text-gray-400"
            }`}
          >
            Exit Command Center
          </p>
        </div>
      )}
    </div>
  );
}
