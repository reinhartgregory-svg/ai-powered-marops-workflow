import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Container({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}>
      {children}
    </div>
  );
}

export function Card({
  className,
  children,
  as: Tag = "div",
  ...rest
}: {
  className?: string;
  children: ReactNode;
  as?: "div" | "section" | "article" | "aside" | "li";
} & Omit<HTMLAttributes<HTMLElement>, "className" | "children">) {
  return (
    <Tag
      className={cn(
        "rounded-xl bg-white shadow-sm ring-1 ring-slate-200",
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  eyebrow?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <div className="mb-2 text-sm font-medium text-brand-700">{eyebrow}</div>}
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-base text-slate-600">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-3">{actions}</div>}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center",
        className,
      )}
    >
      {icon && (
        <div
          aria-hidden="true"
          className="mb-4 flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-700"
        >
          {icon}
        </div>
      )}
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {description && <p className="mt-1 max-w-md text-sm text-slate-600">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-md bg-slate-200", className)} />;
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <Card className="p-5">
      <dt className="text-sm font-medium text-slate-600">{label}</dt>
      <dd className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{value}</dd>
      {hint && <dd className="mt-1 text-sm text-slate-500">{hint}</dd>}
    </Card>
  );
}
