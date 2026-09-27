import {
  BarChart3,
  Calculator,
  Clapperboard,
  Code2,
  Headphones,
  Layers,
  Megaphone,
  Palette,
  PenLine,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  development: Code2,
  design: Palette,
  writing: PenLine,
  marketing: Megaphone,
  data: BarChart3,
  video: Clapperboard,
  admin: Headphones,
  finance: Calculator,
};

export function CategoryIcon({ slug, className }: { slug: string; className?: string }) {
  const Icon = ICONS[slug] ?? Layers;
  return <Icon aria-hidden="true" className={className} />;
}
