import { Link } from "react-router-dom";
import { Play } from "lucide-react";
import { AppThumbnail } from "@/components/AppThumbnail";

interface AppLaunchTileProps {
  id: string;
  title: string;
  url: string;
  imageUrl?: string;
  age?: string;
  ageIcon?: string;
  ageColor?: string;
  subjectIcon?: string;
  subjectColor?: string;
  typeIcon?: string;
  typeColor?: string;
  onLaunch: () => void;
}

/** App Store-läge: ett tryck på bilden startar appen, titelraden med symboler går till detaljer. */
export function AppLaunchTile({ id, title, url, imageUrl, age, ageIcon, ageColor, subjectIcon, subjectColor, typeIcon, typeColor, onLaunch }: AppLaunchTileProps) {
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
      <Link
        to={`/app/${id}`}
        aria-label={`Läs mer om ${title}`}
        className="mt-2 flex items-center justify-between gap-2 px-1 py-1 rounded-lg group/title"
      >
        <h3 className="truncate font-heading text-base font-bold transition-colors group-hover/title:text-primary">{title}</h3>
        <span className="flex shrink-0 items-center gap-1">
          {subjectIcon && (
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full text-xs"
              style={subjectColor ? { backgroundColor: `${subjectColor}33` } : undefined}
              aria-hidden
            >
              {subjectIcon}
            </span>
          )}
          {typeIcon && (
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full text-xs"
              style={typeColor ? { backgroundColor: `${typeColor}33` } : undefined}
              aria-hidden
            >
              {typeIcon}
            </span>
          )}
          {age && (
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-semibold text-foreground"
              style={ageColor ? { backgroundColor: `${ageColor}33` } : undefined}
            >
              {age}
            </span>
          )}
        </span>
      </Link>
    </div>
  );
}
