import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useBranding } from '@/hooks/useBranding';

export function PublicFooter() {
  const currentYear = new Date().getFullYear();
  const branding = useBranding();

  return (
    <footer className="relative z-10 border-t border-border/50 bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo & Copyright */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="text-lg">{branding.brand_primary_emoji}</span>
            <span>© {currentYear} {branding.brand_domain}</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline-flex items-center gap-1">
              Skapad med <Heart className="w-3 h-3 text-primary fill-primary" /> av vibe-codande föräldrar
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-4 sm:gap-6 text-sm">
            <Link to="/apps" className="text-muted-foreground hover:text-foreground transition-colors">
              Appar
            </Link>
            <Link to="/resurser" className="text-muted-foreground hover:text-foreground transition-colors">
              Resurser
            </Link>
            <Link to="/villkor" className="text-muted-foreground hover:text-foreground transition-colors">
              Villkor
            </Link>
            <Link to="/integritet" className="text-muted-foreground hover:text-foreground transition-colors">
              Integritet
            </Link>
            <span className="text-muted-foreground"># Magnus Froste</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
