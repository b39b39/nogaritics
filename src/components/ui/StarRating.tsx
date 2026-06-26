"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number | null;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function StarRating({ value, onChange, readonly = false, size = "md", className }: StarRatingProps) {
  const [hover, setHover] = useState<number | null>(null);

  const starSizes = { sm: "w-4 h-4", md: "w-5 h-5", lg: "w-6 h-6" };
  const steps = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

  const display = hover ?? value ?? 0;

  return (
    <div
      className={cn("inline-flex items-center gap-0.5", className)}
      role={readonly ? undefined : "slider"}
      aria-valuenow={value ?? 0}
      aria-valuemin={0}
      aria-valuemax={5}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = display >= star;
        const half = display >= star - 0.5 && display < star;
        return (
          <div
            key={star}
            className="relative"
            onMouseLeave={readonly ? undefined : () => setHover(null)}
          >
            {/* Half-star left side */}
            <div
              className={cn("absolute left-0 top-0 w-1/2 h-full cursor-pointer z-10", readonly && "cursor-default")}
              onMouseEnter={readonly ? undefined : () => setHover(star - 0.5)}
              onClick={readonly ? undefined : () => onChange?.(star - 0.5)}
            />
            {/* Full-star right side */}
            <div
              className={cn("absolute right-0 top-0 w-1/2 h-full cursor-pointer z-10", readonly && "cursor-default")}
              onMouseEnter={readonly ? undefined : () => setHover(star)}
              onClick={readonly ? undefined : () => onChange?.(star)}
            />
            <svg
              className={cn(starSizes[size], "text-yellow-400 transition-colors")}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {/* Full fill */}
              {filled && (
                <path
                  fill="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                />
              )}
              {/* Half fill */}
              {half && !filled && (
                <>
                  <defs>
                    <linearGradient id={`half-${star}`}>
                      <stop offset="50%" stopColor="currentColor" />
                      <stop offset="50%" stopColor="transparent" />
                    </linearGradient>
                  </defs>
                  <path
                    fill={`url(#half-${star})`}
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                  />
                </>
              )}
              {/* Empty */}
              {!filled && !half && (
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  fill="none"
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                />
              )}
            </svg>
          </div>
        );
      })}
    </div>
  );
}
