import { useEffect, useMemo, useState } from 'react';
import { getPreviewUrl } from '@/hooks/useUrlPreview';
import { cn } from '@/lib/utils';

interface AppThumbnailProps {
  title: string;
  imageUrl?: string;
  appUrl?: string;
  className?: string;
  imageClassName?: string;
}

function getInitials(title: string) {
  const initials = title
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join('')
    .toLocaleUpperCase('sv-SE');

  return initials || 'A';
}

export function AppThumbnail({
  title,
  imageUrl,
  appUrl,
  className,
  imageClassName,
}: AppThumbnailProps) {
  const sources = useMemo(() => {
    const candidates = [imageUrl, appUrl ? getPreviewUrl(appUrl) : undefined];
    return [...new Set(candidates.filter((source): source is string => Boolean(source)))];
  }, [appUrl, imageUrl]);
  const [sourceIndex, setSourceIndex] = useState(0);

  useEffect(() => {
    setSourceIndex(0);
  }, [appUrl, imageUrl]);

  const source = sources[sourceIndex];

  return (
    <div className={cn('relative h-full w-full overflow-hidden bg-gradient-to-br from-primary/20 via-accent/25 to-secondary/25', className)}>
      {source ? (
        <img
          src={source}
          alt={title}
          className={cn('h-full w-full object-cover', imageClassName)}
          loading="lazy"
          decoding="async"
          onError={() => setSourceIndex((current) => current + 1)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center p-4">
          <span className="font-heading text-3xl font-black text-foreground/70" aria-hidden="true">
            {getInitials(title)}
          </span>
          <span className="sr-only">Ingen förhandsbild tillgänglig</span>
        </div>
      )}
    </div>
  );
}