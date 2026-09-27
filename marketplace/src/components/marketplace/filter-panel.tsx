"use client";

import { SlidersHorizontal } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/cn";

/** Sidebar on large screens; a collapsible panel on small screens. */
export function FilterPanel({
  activeCount,
  children,
}: {
  activeCount: number;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className={buttonClasses({ variant: "secondary", className: "w-full lg:hidden" })}
      >
        <SlidersHorizontal aria-hidden="true" className="size-4" />
        {open ? "Hide filters" : "Show filters"}
        {activeCount > 0 && (
          <span className="rounded-full bg-brand-700 px-2 py-0.5 text-xs text-white">
            {activeCount}
          </span>
        )}
      </button>
      <div id={panelId} className={cn(open ? "mt-4 block" : "hidden", "lg:mt-0 lg:block")}>
        {children}
      </div>
    </div>
  );
}
