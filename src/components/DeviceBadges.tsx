import { Monitor, Tablet, Smartphone, Layers } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface Category {
  id: string;
  name: string;
  slug?: string;
  type: string;
}

interface DeviceBadgesProps {
  categories: Category[];
  size?: 'sm' | 'md';
}

const deviceIcons: Record<string, React.ReactNode> = {
  desktop: <Monitor className="h-3.5 w-3.5" />,
  tablet: <Tablet className="h-3.5 w-3.5" />,
  mobile: <Smartphone className="h-3.5 w-3.5" />,
  'all-devices': <Layers className="h-3.5 w-3.5" />,
};

const deviceLabels: Record<string, string> = {
  desktop: 'Desktop',
  tablet: 'Platta',
  mobile: 'Mobil',
  'all-devices': 'Alla enheter',
};

export function DeviceBadges({ categories, size = 'sm' }: DeviceBadgesProps) {
  const deviceCategories = categories.filter(cat => cat.type === 'device');
  
  if (deviceCategories.length === 0) return null;

  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  const containerSize = size === 'sm' ? 'h-6 w-6' : 'h-7 w-7';

  return (
    <div className="flex items-center gap-1">
      {deviceCategories.map((cat) => {
        const slug = cat.slug || cat.name.toLowerCase();
        const icon = deviceIcons[slug];
        const label = deviceLabels[slug] || cat.name;

        if (!icon) return null;

        return (
          <Tooltip key={cat.id}>
            <TooltipTrigger asChild>
              <div 
                className={`${containerSize} rounded-md bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors`}
              >
                {icon}
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {label}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
