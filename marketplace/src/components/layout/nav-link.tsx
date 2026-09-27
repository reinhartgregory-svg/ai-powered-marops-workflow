"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function isActivePath(pathname: string, href: string, exclude: string[] = []) {
  if (href === "/") return pathname === "/";
  if (exclude.some((path) => pathname === path || pathname.startsWith(`${path}/`))) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLink({
  href,
  children,
  exact = false,
  exclude,
  className,
  onNavigate,
}: {
  href: string;
  children: ReactNode;
  exact?: boolean;
  /** Paths under `href` that shouldn't mark this link as current. */
  exclude?: string[];
  className?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : isActivePath(pathname, href, exclude);
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-brand-50 text-brand-800"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
        className,
      )}
    >
      {children}
    </Link>
  );
}
