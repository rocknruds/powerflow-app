import Link from "next/link";

export default function Masthead() {
  return (
    <header className="bg-white/70 backdrop-blur border-b border-neutral-200/70">
      <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="uppercase text-[11px] tracking-[0.18em] text-neutral-800 font-medium hover:text-neutral-900 transition-colors"
        >
          SOVEREIGN ATLAS
        </Link>
        <nav className="flex items-center gap-6 text-sm text-neutral-700">
          <Link href="/" className="hover:text-neutral-900 transition-colors">
            Home
          </Link>
          <Link href="/events" className="hover:text-neutral-900 transition-colors">
            Events
          </Link>
          <Link href="/countries" className="hover:text-neutral-900 transition-colors">
            Countries
          </Link>
          <a href="#" className="hover:text-neutral-900 transition-colors">
            Briefings
          </a>
          <a href="#" className="hover:text-neutral-900 transition-colors">
            Map
          </a>
          <a href="#" className="hover:text-neutral-900 transition-colors">
            Regions
          </a>
          <a href="#" className="hover:text-neutral-900 transition-colors">
            About
          </a>
        </nav>
      </div>
    </header>
  );
}
