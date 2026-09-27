import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export function LogoMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <rect width="32" height="32" rx="9" className="fill-brand-700" />
      <path
        d="M9 11.5h14M9 16h14M9 20.5h8"
        stroke="white"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="22" cy="20.5" r="2.2" className="fill-amber-300" />
    </svg>
  );
}

export function Logo() {
  return (
    <Link
      href="/"
      className="flex shrink-0 items-center gap-2 rounded-lg text-lg font-semibold tracking-tight text-slate-900"
    >
      <LogoMark />
      <span>{APP_NAME}</span>
      <span className="sr-only">home</span>
    </Link>
  );
}
