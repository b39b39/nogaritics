import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "feat" | "prod" | "tag";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        {
          "bg-gray-100 text-gray-700": variant === "default",
          "bg-blue-100 text-blue-700": variant === "feat",
          "bg-purple-100 text-purple-700": variant === "prod",
          "bg-emerald-100 text-emerald-700": variant === "tag",
        },
        className
      )}
    >
      {children}
    </span>
  );
}
