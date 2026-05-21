import Link from "next/link";
import { BookOpen, Target, RefreshCw, Home } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navbar */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold text-gray-900">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <span>自适应学习</span>
          </Link>

          <nav className="flex items-center gap-1">
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <Home className="h-4 w-4" />
              首页
            </Link>
            <Link
              href="/goals/new"
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <Target className="h-4 w-4" />
              新目标
            </Link>
            <Link
              href="/reviews"
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              复习
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
