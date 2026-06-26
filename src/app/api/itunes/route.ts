import { NextRequest, NextResponse } from "next/server";

const ITUNES_BASE = "https://itunes.apple.com";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const action = sp.get("action"); // "search" | "lookup"

  let url: string;

  if (action === "lookup") {
    const id = sp.get("id");
    const entity = sp.get("entity") ?? "song";
    const country = sp.get("country") ?? "kr";
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    url = `${ITUNES_BASE}/lookup?id=${id}&entity=${entity}&country=${country}`;
  } else {
    // search
    const term = sp.get("term");
    const entity = sp.get("entity") ?? "song";
    const country = sp.get("country") ?? "kr";
    const limit = sp.get("limit") ?? "15";
    if (!term) return NextResponse.json({ error: "term required" }, { status: 400 });
    url = `${ITUNES_BASE}/search?term=${encodeURIComponent(term)}&entity=${entity}&country=${country}&limit=${limit}`;
  }

  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) return NextResponse.json({ error: "iTunes API 오류" }, { status: 502 });

  const data = await res.json();
  return NextResponse.json(data);
}
