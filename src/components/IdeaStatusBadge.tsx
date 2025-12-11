import { Badge } from '@/components/ui/badge';
import { Circle, Hammer, CheckCircle } from 'lucide-react';

interface IdeaStatusBadgeProps {
  status: 'open' | 'claimed' | 'built';
  size?: 'sm' | 'md';
}

export function IdeaStatusBadge({ status, size = 'md' }: IdeaStatusBadgeProps) {
  const config = {
    open: {
      label: 'Öppen',
      icon: Circle,
      className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    },
    claimed: {
      label: 'Byggs',
      icon: Hammer,
      className: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    },
    built: {
      label: 'Byggd',
      icon: CheckCircle,
      className: 'bg-primary/10 text-primary border-primary/20',
    },
  };

  const { label, icon: Icon, className } = config[status];
  const iconSize = size === 'sm' ? 12 : 14;

  return (
    <Badge
      variant="outline"
      className={`${className} ${size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'} gap-1.5 font-medium`}
    >
      <Icon size={iconSize} className="shrink-0" />
      {label}
    </Badge>
  );
}
