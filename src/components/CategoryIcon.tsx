import { Monitor, Tablet, Smartphone, Layers, type LucideIcon } from "lucide-react";

const LUCIDE_ICONS: Record<string, LucideIcon> = {
  Monitor,
  Tablet,
  Smartphone,
  Layers,
};

/** Ritar kategoriikon: Lucide-ikon om namnet matchar, annars emoji/text. */
export function CategoryIcon({ icon, className = "h-3.5 w-3.5" }: { icon?: string | null; className?: string }) {
  if (!icon) return null;
  const Lucide = LUCIDE_ICONS[icon];
  if (Lucide) return <Lucide className={className} aria-hidden />;
  return <span aria-hidden>{icon}</span>;
}
