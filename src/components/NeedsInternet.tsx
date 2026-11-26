import { Wifi } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

/** What the check found the app uses the internet for (server/check.mjs, NEEDS_INTERNET). */
const LABELS: Record<string, string> = { ai: 'AI', read_aloud: 'uppläsning', listen: 'taligenkänning' };

function needsInternetText(needs: string[] = []): string | null {
  const words = needs.map((n) => LABELS[n]).filter(Boolean);
  if (!words.length) return null;
  const list = words.length === 1 ? words[0] : `${words.slice(0, -1).join(', ')} och ${words[words.length - 1]}`;
  return `Använder internet för ${list}`;
}

/** A small mark on the card, or a line on the app's page – set by the automatic check, never by hand. */
export function NeedsInternet({ needs, variant = 'icon' }: { needs?: string[]; variant?: 'icon' | 'line' }) {
  const text = needsInternetText(needs);
  if (!text) return null;
  if (variant === 'line') {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Wifi className="h-4 w-4 shrink-0" aria-hidden="true" />
        {text}
      </p>
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="flex items-center text-xs" aria-label={text}>
          <Wifi className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">{text}</TooltipContent>
    </Tooltip>
  );
}
