"use client";

import { useEffect, useState, type ComponentType, type SVGProps } from "react";
import { hasFlag } from "country-flag-icons";

function unicodeFlag(code: string): string {
  return [...code.toUpperCase()]
    .map((c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join("");
}

interface Props {
  code: string;
  className?: string;
}

export function CountryFlag({ code, className = "w-5 h-auto inline-block align-middle" }: Props) {
  const [Flag, setFlag] = useState<ComponentType<SVGProps<SVGSVGElement>> | null>(null);
  const upper = code.toUpperCase();

  useEffect(() => {
    if (!hasFlag(upper)) return;
    import(`country-flag-icons/react/3x2/${upper}`)
      .then((mod) => setFlag(() => mod.default))
      .catch(() => {});
  }, [upper]);

  if (Flag) return <Flag className={className} />;
  return <span className="text-lg leading-none">{unicodeFlag(code)}</span>;
}
