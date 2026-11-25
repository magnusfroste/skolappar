import { Clock, FilePen, LayoutGrid, Lightbulb, Tags, FileText, Palette, Settings, Bot, BarChart3, Mail, Flag } from 'lucide-react';

/** Adminsektioner – visas i vänsterpanelen och styr /admin?tab=… */
export const ADMIN_SECTIONS = [
  { tab: 'pending', title: 'Granska', icon: Clock },
  { tab: 'changes', title: 'Ändringar', icon: FilePen },
  { tab: 'reports', title: 'Rapporter', icon: Flag },
  { tab: 'all', title: 'Alla appar', icon: LayoutGrid },
  { tab: 'analytics', title: 'Statistik', icon: BarChart3 },
  { tab: 'mailings', title: 'Utskick', icon: Mail },
  { tab: 'ideas', title: 'Idéer', icon: Lightbulb },
  { tab: 'categories', title: 'Kategorier', icon: Tags },
  { tab: 'resources', title: 'Resurser', icon: FileText },
  { tab: 'seo', title: 'Utseende & SEO', icon: Palette },
  { tab: 'agents', title: 'AI-agent (MCP)', icon: Bot },
  { tab: 'agent-usage', title: 'Agenter på /mcp', icon: Bot },
  { tab: 'settings', title: 'Inställningar', icon: Settings },
] as const;
