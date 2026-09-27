import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";

/** Page links. `hrefFor(page)` returns the URL for a given page number. */
export function Pagination({
  page,
  pageCount,
  hrefFor,
}: {
  page: number;
  pageCount: number;
  hrefFor: (page: number) => string;
}) {
  if (pageCount <= 1) return null;

  const pages = Array.from({ length: pageCount }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === pageCount || Math.abs(p - page) <= 1,
  );

  const linkClass =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-medium";

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={cn(linkClass, "text-slate-700 hover:bg-slate-100")}>
          <ChevronLeft aria-hidden="true" className="size-4" />
          <span>Previous</span>
        </Link>
      ) : (
        <span className={cn(linkClass, "text-slate-400")} aria-hidden="true">
          <ChevronLeft className="size-4" />
          Previous
        </span>
      )}
      <ul className="hidden items-center gap-1 sm:flex">
        {pages.map((p, index) => (
          <li key={p} className="flex items-center gap-1">
            {index > 0 && pages[index - 1] !== p - 1 && (
              <span className="px-1 text-slate-400" aria-hidden="true">
                …
              </span>
            )}
            <Link
              href={hrefFor(p)}
              aria-current={p === page ? "page" : undefined}
              aria-label={`Page ${p}`}
              className={cn(
                linkClass,
                p === page ? "bg-brand-700 text-white" : "text-slate-700 hover:bg-slate-100",
              )}
            >
              {p}
            </Link>
          </li>
        ))}
      </ul>
      <span className="px-2 text-sm text-slate-600 sm:hidden">
        Page {page} of {pageCount}
      </span>
      {page < pageCount ? (
        <Link href={hrefFor(page + 1)} className={cn(linkClass, "text-slate-700 hover:bg-slate-100")}>
          <span>Next</span>
          <ChevronRight aria-hidden="true" className="size-4" />
        </Link>
      ) : (
        <span className={cn(linkClass, "text-slate-400")} aria-hidden="true">
          Next
          <ChevronRight className="size-4" />
        </span>
      )}
    </nav>
  );
}
