import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { NotificationBell } from '@/components/NotificationBell';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useAdmin';

interface PublicNavProps {
  variant?: 'transparent' | 'solid';
}

export function PublicNav({ variant = 'transparent' }: PublicNavProps) {
  const { user, signOut, loading } = useAuth();
  const { data: isAdmin } = useIsAdmin();

  const navClasses = variant === 'solid' 
    ? 'sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50'
    : 'relative z-20';

  return (
    <nav className={navClasses}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-2 text-xl font-heading font-bold text-foreground hover:text-primary transition-colors"
          >
            <span className="text-2xl">📱</span>
            <span className="hidden sm:inline">skolappar.com</span>
          </Link>
          
          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Explore link */}
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
              <Link to="/apps">Utforska</Link>
            </Button>

            {loading ? (
              <Skeleton className="w-20 h-9" />
            ) : user ? (
              <>
                {isAdmin && (
                  <Button variant="ghost" size="sm" asChild className="gap-1">
                    <Link to="/admin">
                      <Shield className="w-4 h-4" />
                      <span className="hidden md:inline">Admin</span>
                    </Link>
                  </Button>
                )}
                <NotificationBell />
                <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
                  <Link to="/min-sida">Min sida</Link>
                </Button>
                <Button size="sm" asChild className="gap-1.5">
                  <Link to="/min-sida/ny">
                    <Sparkles className="w-4 h-4" />
                    <span className="hidden sm:inline">Lägg till</span>
                  </Link>
                </Button>
                <Button variant="outline" size="sm" onClick={signOut} className="hidden sm:inline-flex">
                  Logga ut
                </Button>
              </>
            ) : (
              <Button size="sm" asChild className="gap-1.5">
                <Link to="/auth">
                  Logga in
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
