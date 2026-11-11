import { Clock, LayoutGrid, Lightbulb, Tags, FileText, Palette, Settings, Bot } from 'lucide-react';

/** Adminsektioner – visas i vänsterpanelen och styr /admin?tab=… */
export const ADMIN_SECTIONS = [
  { tab: 'pending', title: 'Granska', icon: Clock },
  { tab: 'all', title: 'Alla appar', icon: LayoutGrid },
  { tab: 'ideas', title: 'Idéer', icon: Lightbulb },
  { tab: 'categories', title: 'Kategorier', icon: Tags },
  { tab: 'resources', title: 'Resurser', icon: FileText },
  { tab: 'seo', title: 'Utseende & SEO', icon: Palette },
  { tab: 'agents', title: 'AI-agenter', icon: Bot },
  { tab: 'settings', title: 'Inställningar', icon: Settings },
] as const;
