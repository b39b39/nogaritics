import fs from "fs";
import path from "path";
import { hasFlag } from "country-flag-icons";

interface Props {
  code: string;
  className?: string;
}

export function FlagIcon({ code, className = "w-6 h-auto rounded-sm" }: Props) {
  const upper = code.toUpperCase();
  if (!hasFlag(upper)) return null;

  let svg: string;
  try {
    svg = fs.readFileSync(
      path.join(process.cwd(), "node_modules/country-flag-icons/3x2", `${upper}.svg`),
      "utf-8",
    );
  } catch {
    return null;
  }

  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={dataUrl} alt={`Flag of ${upper}`} className={className} />
  );
}
