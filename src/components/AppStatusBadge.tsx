import { Badge } from '@/components/ui/badge';
import { Clock, Check, Star, X, EyeOff } from 'lucide-react';

interface AppStatusBadgeProps {
  status: 'pending' | 'approved' | 'rejected' | 'featured' | 'delisted';
}

const statusConfig = {
  pending: {
    label: 'Väntar på granskning',
    icon: Clock,
    className: 'bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20'
  },
  approved: {
    label: 'Godkänd',
    icon: Check,
    className: 'bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20'
  },
  featured: {
    label: 'Utvald',
    icon: Star,
    className: 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'
  },
  rejected: {
    label: 'Ej godkänd',
    icon: X,
    className: 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20'
  },
  delisted: {
    label: 'Avlistad',
    icon: EyeOff,
    className: 'bg-slate-500/10 text-slate-600 border-slate-500/20 hover:bg-slate-500/20'
  }
};

export function AppStatusBadge({ status }: AppStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`gap-1 ${config.className}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
