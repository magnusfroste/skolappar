import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { getPreviewUrl } from '@/hooks/useUrlPreview';
import { cn } from '@/lib/utils';
import { frameColors, type ThumbnailCategory } from '@/lib/cardFrame';

export type { ThumbnailCategory };

interface AppThumbnailProps {
  title: string;
  imageUrl?: string;
  appUrl?: string;
  /** Appens kategorier: ämnet (type "subject") väljer ramens färg. */
  categories?: ThumbnailCategory[];
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
  categories,
  className,
  imageClassName,
}: AppThumbnailProps) {
  const [frameDark, frameLight] = frameColors(categories);
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
    <div
      className={cn('app-frame relative h-full w-full overflow-hidden', className)}
      style={{ '--frame-dark': frameDark, '--frame-light': frameLight } as CSSProperties}
    >
      <div className="app-frame-inner">
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
            <span className="font-heading text-3xl font-black text-white/80" aria-hidden="true">
              {getInitials(title)}
            </span>
            <span className="sr-only">Ingen förhandsbild tillgänglig</span>
          </div>
        )}
      </div>
    </div>
  );
}
