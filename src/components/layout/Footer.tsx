import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col items-center gap-1">
        <div className="flex items-center gap-1.5 text-indigo-600 font-bold">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-indigo-600 text-white text-sm font-black" style={{ fontFamily: "serif", lineHeight: 1 }}>ℕ</span>
          Nogaritics
        </div>
        <p className="text-xs text-gray-400">wkdska311@naver.com</p>
        <Link href="/privacy" className="text-xs text-gray-400 hover:text-indigo-600 transition-colors">
          개인정보처리방침
        </Link>
      </div>
    </footer>
  );
}
