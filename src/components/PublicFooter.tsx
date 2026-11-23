import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useBranding } from '@/hooks/useBranding';
import kottenMark from '@/assets/kotten-mark.svg';

export function PublicFooter() {
  const currentYear = new Date().getFullYear();
  const branding = useBranding();

  return (
    <footer className="relative z-10 border-t border-border/50 bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo & Copyright */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <img src={kottenMark} alt="" className="h-6 w-6" />
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
        {/* What the gallery stands on – and where a parent can start */}
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Från Sverige{" · "}följer Lgr22{" · "}byggs i{" "}
          <a href="https://studio.shipholm.com/?utm_source=skolappar&utm_medium=referral" target="_blank" rel="noopener" className="underline underline-offset-4 hover:text-foreground">Shipholm Studio</a>
          {" · "}körs på{" "}
          <a href="https://shipholm.com/?utm_source=skolappar&utm_medium=referral" target="_blank" rel="noopener" className="underline underline-offset-4 hover:text-foreground">Shipholm</a>
          {" · "}AI-kraft från{" "}
          <a href="https://garageai.eu/?utm_source=skolappar&utm_medium=referral" target="_blank" rel="noopener" className="underline underline-offset-4 hover:text-foreground">GarageAI</a>
        </p>
      </div>
    </footer>
  );
}
