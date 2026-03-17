"use client";

import { useState } from "react";
import Link from "next/link";

interface CollapsibleSectionProps {
  label: string;
  action?: { label: string; href: string };
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function SectionBars({ open }: { open: boolean }) {
  const barStyle = (delay: string): React.CSSProperties => ({
    transformOrigin: "50% 50%",
    transition: `transform 200ms ease ${delay}`,
    transform: open ? "scaleY(1)" : "scaleY(0.3)",
  });

  return (
    <svg
      width="7"
      height="18"
      viewBox="0 0 18 44"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        d="M5.2 8.6C5.2 7.16406 4.03594 6 2.6 6C1.16406 6 0 7.16406 0 8.6V35.4C0 36.8359 1.16406 38 2.6 38C4.03594 38 5.2 36.8359 5.2 35.4V8.6Z"
        fill="#60A5FA"
        style={barStyle("0ms")}
      />
      <path
        d="M18 2.6C18 1.16406 16.8359 0 15.4 0C13.9641 0 12.8 1.16406 12.8 2.6V41.4C12.8 42.8359 13.9641 44 15.4 44C16.8359 44 18 42.8359 18 41.4V2.6Z"
        fill="#3B4A5C"
        style={barStyle("30ms")}
      />
    </svg>
  );
}

export default function CollapsibleSection({
  label,
  action,
  defaultOpen = true,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <div className="flex items-center gap-2 mb-5">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 group/toggle focus:outline-none"
          aria-expanded={open}
        >
          <SectionBars open={open} />
          <span
            className="text-[14px] font-medium uppercase tracking-[0.14em] group-hover/toggle:opacity-70 transition-opacity"
            style={{ color: "var(--muted-foreground)" }}
          >
            {label}
          </span>
        </button>
        {action && (
          <Link
            href={action.href}
            className="ml-auto text-[11px] transition-colors"
            style={{ color: "var(--accent)" }}
          >
            {action.label} →
          </Link>
        )}
      </div>

      <div
        className="overflow-hidden transition-all duration-200"
        style={{ maxHeight: open ? "9999px" : "0px", opacity: open ? 1 : 0 }}
      >
        {children}
      </div>
    </div>
  );
}
