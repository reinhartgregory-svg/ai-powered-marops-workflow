import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";

const palettes = [
  "bg-brand-100 text-brand-800",
  "bg-amber-100 text-amber-800",
  "bg-sky-100 text-sky-800",
  "bg-violet-100 text-violet-800",
  "bg-rose-100 text-rose-800",
  "bg-emerald-100 text-emerald-800",
  "bg-orange-100 text-orange-800",
  "bg-indigo-100 text-indigo-800",
];

const sizes = {
  sm: "size-9 text-xs",
  md: "size-12 text-sm",
  lg: "size-20 text-2xl",
};

/** Initials avatar. Photo uploads are not part of the MVP. */
export function Avatar({
  name,
  seed,
  size = "md",
  className,
}: {
  name: string;
  seed: number;
  size?: keyof typeof sizes;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold select-none",
        palettes[seed % palettes.length],
        sizes[size],
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
