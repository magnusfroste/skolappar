import { Trophy, Flame, Star, Sparkles, Target, Zap } from 'lucide-react';

interface MilestoneBadgeProps {
  count: number;
  type: 'clicks' | 'upvotes' | 'comments';
}

const milestones = [
  { threshold: 10, icon: Star, label: 'Bra start!', color: 'text-yellow-500' },
  { threshold: 25, icon: Flame, label: 'På gång!', color: 'text-orange-500' },
  { threshold: 50, icon: Zap, label: 'Populär!', color: 'text-blue-500' },
  { threshold: 100, icon: Trophy, label: 'Succé!', color: 'text-primary' },
  { threshold: 250, icon: Target, label: 'Viral!', color: 'text-rose' },
  { threshold: 500, icon: Sparkles, label: 'Legendar!', color: 'text-secondary' },
];

export function MilestoneBadge({ count, type }: MilestoneBadgeProps) {
  // Find the highest achieved milestone
  const achieved = milestones.filter(m => count >= m.threshold).pop();
  
  if (!achieved) return null;

  const Icon = achieved.icon;
  
  return (
    <div className={`flex items-center gap-1 ${achieved.color}`}>
      <Icon className="h-4 w-4" />
      <span className="text-xs font-medium">{achieved.label}</span>
    </div>
  );
}

export function getNextMilestone(count: number): { threshold: number; remaining: number } | null {
  const next = milestones.find(m => count < m.threshold);
  if (!next) return null;
  return { threshold: next.threshold, remaining: next.threshold - count };
}
