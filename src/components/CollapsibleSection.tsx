"use client";

import { useState } from "react";
import Link from "next/link";

interface CollapsibleSectionProps {
  label: string;
  action?: { label: string; href: string };
  defaultOpen?: boolean;
  children: React.ReactNode;
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
          <span
            className="shrink-0 transition-all duration-200"
            style={{
              display: "block",
              width: open ? "14px" : "6px",
              height: "3px",
              borderRadius: "9999px",
              backgroundColor: "var(--accent)",
            }}
          />
          <span
            className="text-[10px] font-medium uppercase tracking-[0.14em] group-hover/toggle:opacity-70 transition-opacity"
            style={{ color: "var(--muted)" }}
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
