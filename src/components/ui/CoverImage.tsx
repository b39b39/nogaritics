import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface CoverImageProps {
  src: string | null | undefined;
  alt: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  className?: string;
  type?: "square" | "circle";
}

const sizeMap: Record<string, number | null> = {
  sm: 48,
  md: 80,
  lg: 200,
  xl: 256,
  full: null,
};

export function CoverImage({ src, alt, size = "md", className, type = "square" }: CoverImageProps) {
  const px = sizeMap[size] ?? null;
  const sizeStyle: React.CSSProperties | undefined = px !== null ? { width: px, height: px } : undefined;

  if (!src) {
    return (
      <div
        className={cn(
          "bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center flex-shrink-0",
          type === "circle" ? "rounded-full" : "rounded-lg",
          className
        )}
        style={sizeStyle}
      >
        <span className="text-gray-400 text-xs font-medium truncate px-1 text-center">{alt[0]?.toUpperCase()}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden flex-shrink-0",
        type === "circle" ? "rounded-full" : "rounded-lg",
        className
      )}
      style={sizeStyle}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes={px ? `${px}px` : "100vw"}
      />
    </div>
  );
}
