import { Link } from "react-router-dom";
import { Play } from "lucide-react";
import { AppThumbnail } from "@/components/AppThumbnail";

interface AppLaunchTileProps {
  id: string;
  title: string;
  url: string;
  imageUrl?: string;
  onLaunch: () => void;
}

/** App Store-läge: ett tryck på bilden startar appen, "Läs mer" går till detaljer. */
export function AppLaunchTile({ id, title, url, imageUrl, onLaunch }: AppLaunchTileProps) {
  return (
    <div className="group">
      <button
        type="button"
        onClick={onLaunch}
        aria-label={`Starta ${title}`}
        className="relative block w-full aspect-[4/3] overflow-hidden rounded-3xl shadow-playful transition-transform duration-200 active:scale-95 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary"
      >
        <AppThumbnail title={title} imageUrl={imageUrl} appUrl={url} imageClassName="transition-transform duration-500 group-hover:scale-105" />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-playful-lg transition-transform duration-200 group-hover:scale-110">
            <Play className="h-5 w-5 sm:h-7 sm:w-7 translate-x-0.5" fill="currentColor" />
          </span>
        </span>
      </button>
      <div className="mt-2 flex items-center justify-between gap-2 px-1">
        <h3 className="truncate font-heading text-base font-bold">{title}</h3>
        <Link to={`/app/${id}`} className="shrink-0 py-2 text-sm text-muted-foreground hover:text-primary">
          Läs mer
        </Link>
      </div>
    </div>
  );
}
