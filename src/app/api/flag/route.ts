import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { hasFlag } from "country-flag-icons";

export async function GET(req: NextRequest) {
  const code = (req.nextUrl.searchParams.get("code") ?? "").toUpperCase();
  if (!code || !hasFlag(code)) return new NextResponse(null, { status: 404 });

  const filePath = path.join(process.cwd(), "node_modules/country-flag-icons/3x2", `${code}.svg`);
  try {
    const svg = fs.readFileSync(filePath, "utf-8");
    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
