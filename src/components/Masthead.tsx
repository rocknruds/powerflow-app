"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import LogoMark from "@/components/LogoMark";

const NAV_LINKS = [
  { label: "Actors", href: "/actors" },
  { label: "Conflicts", href: "/conflicts" },
  { label: "Analysis", href: "/analysis" },
  { label: "Briefs", href: "/briefs" },
];

export default function Masthead() {
  const pathname = usePathname();

  return (
    <header
      className="sticky top-0 z-50 border-b backdrop-blur-md"
      style={{
        backgroundColor: "color-mix(in srgb, #0d1117 95%, transparent)",
        borderColor: "var(--border)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-[68px] flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-3 group"
          aria-label="PowerFlow home"
        >
          <LogoMark size={26} />
          <span
            className="font-sans text-base"
            style={{ letterSpacing: "0.13em", lineHeight: 1 }}
          >
            <span
              className="font-normal"
              style={{ color: "#e8eaf0", opacity: 0.9 }}
            >
              Power
            </span>
            <span
              className="font-semibold"
              style={{ color: "#60a5fa" }}
            >
              Flow
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-1">
            {NAV_LINKS.map(({ label, href }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className="px-3 py-1.5 text-sm font-medium rounded transition-colors"
                  style={{
                    color: active ? "#e8eaf0" : "#8b92a0",
                  }}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <Link
            href="/sign-in"
            className="px-4 py-1.5 text-sm font-medium rounded text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#60a5fa" }}
          >
            Sign In
          </Link>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
