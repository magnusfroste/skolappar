import { useEffect, useState, type CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import { frameColors, type ThumbnailCategory } from '@/lib/cardFrame';
import { Kotten } from '@/components/Kotten';

export type { ThumbnailCategory };

interface AppThumbnailProps {
  title: string;
  imageUrl?: string;
  /** Används inte längre: ett kort utan bild visar ämnets färg och symbol, inte en skärmdump. */
  appUrl?: string;
  /** Appens kategorier: ämnet (type "subject") väljer ramens färg. */
  categories?: ThumbnailCategory[];
  className?: string;
  imageClassName?: string;
}

export function AppThumbnail({
  title,
  imageUrl,
  categories,
  className,
  imageClassName,
}: AppThumbnailProps) {
  const [frameDark, frameLight] = frameColors(categories);
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    setBroken(false);
  }, [imageUrl]);

  const source = broken ? undefined : imageUrl;

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
            onError={() => setBroken(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center gap-[4cqw] p-[5cqw]">
            {/* no picture yet: Kotten holds the place, on the subject's colour */}
            <Kotten title="" attribute={false} className="h-[78%] w-auto flex-none" />
            <span className="font-heading text-[7cqw] font-bold leading-tight text-white/90 line-clamp-3 min-w-0">{title}</span>
          </div>
        )}
      </div>
    </div>
  );
}
