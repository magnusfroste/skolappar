import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles, ArrowRight, Shield, Menu, X, Compass, User, BookOpen, LogOut, TestTube2, Lightbulb, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { NotificationBell } from '@/components/NotificationBell';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useAdmin';
import { cn } from '@/lib/utils';
import logoImage from '@/assets/logo.png';

interface PublicNavProps {
  variant?: 'transparent' | 'solid';
}

export function PublicNav({ variant = 'transparent' }: PublicNavProps) {
  const { user, signOut, loading } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const navClasses = variant === 'solid' 
    ? 'sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50'
    : 'relative z-20';

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <nav className={navClasses}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-2 text-xl font-heading font-bold text-foreground hover:text-primary transition-colors"
          >
            <img src={logoImage} alt="Skolappar" className="w-8 h-8 transition-transform duration-200 hover:scale-110" />
            <span className="hidden xs:inline">skolappar.com</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden sm:flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild className={cn("gap-1.5", isActive('/') && "bg-muted text-foreground")}>
              <Link to="/">
                <Home className="w-4 h-4" />
                Hem
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className={cn(isActive('/apps') && "bg-muted text-foreground")}>
              <Link to="/apps">Utforska</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className={cn("gap-1.5", isActive('/ideer') && "bg-muted text-foreground")}>
              <Link to="/ideer">
                <Lightbulb className="w-4 h-4" />
                App-idéer
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className={cn(isActive('/resurser') && "bg-muted text-foreground")}>
              <Link to="/resurser">Resurser</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className={cn(isActive('/testa-din-app') && "bg-muted text-foreground")}>
              <Link to="/testa-din-app">Testa app</Link>
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
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/min-sida">Min sida</Link>
                </Button>
                <Button size="sm" asChild className="gap-1.5">
                  <Link to="/min-sida/ny">
                    <Sparkles className="w-4 h-4" />
                    Lägg till
                  </Link>
                </Button>
                <Button variant="outline" size="sm" onClick={signOut}>
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

          {/* Mobile Navigation */}
          <div className="flex sm:hidden items-center gap-2">
            {user && <NotificationBell />}
            
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Öppna meny</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2 text-left">
                    <img src={logoImage} alt="Skolappar" className="w-6 h-6 transition-transform duration-200 hover:scale-110" />
                    skolappar.com
                  </SheetTitle>
                </SheetHeader>
                
                <div className="mt-8 flex flex-col gap-2">
                  {/* Main links */}
                  <Link 
                    to="/" 
                    onClick={closeMobileMenu}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-xl transition-colors",
                      isActive('/') ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
                    )}
                  >
                    <Home className="w-5 h-5" />
                    <span className="font-medium">Startsida</span>
                  </Link>

                  <Link 
                    to="/apps" 
                    onClick={closeMobileMenu}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-xl transition-colors",
                      isActive('/apps') ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
                    )}
                  >
                    <Compass className="w-5 h-5" />
                    <span className="font-medium">Utforska appar</span>
                  </Link>

                  <Link 
                    to="/ideer" 
                    onClick={closeMobileMenu}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-xl transition-colors",
                      isActive('/ideer') ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
                    )}
                  >
                    <Lightbulb className="w-5 h-5" />
                    <span className="font-medium">App-idéer</span>
                  </Link>
                  
                  <Link 
                    to="/resurser" 
                    onClick={closeMobileMenu}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-xl transition-colors",
                      isActive('/resurser') ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
                    )}
                  >
                    <BookOpen className="w-5 h-5" />
                    <span className="font-medium">Resurser</span>
                  </Link>

                  <Link 
                    to="/testa-din-app" 
                    onClick={closeMobileMenu}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-xl transition-colors",
                      isActive('/testa-din-app') ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
                    )}
                  >
                    <TestTube2 className="w-5 h-5" />
                    <span className="font-medium">Testa app</span>
                  </Link>

                  <div className="my-2 border-t border-border" />

                  {loading ? (
                    <Skeleton className="h-12 w-full rounded-xl" />
                  ) : user ? (
                    <>
                      <Link 
                        to="/min-sida" 
                        onClick={closeMobileMenu}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl text-foreground hover:bg-muted transition-colors"
                      >
                        <User className="w-5 h-5 text-muted-foreground" />
                        <span className="font-medium">Min sida</span>
                      </Link>

                      <Link 
                        to="/min-sida/ny" 
                        onClick={closeMobileMenu}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      >
                        <Sparkles className="w-5 h-5" />
                        <span className="font-medium">Lägg till app</span>
                      </Link>

                      {isAdmin && (
                        <Link 
                          to="/admin" 
                          onClick={closeMobileMenu}
                          className="flex items-center gap-3 px-3 py-3 rounded-xl text-foreground hover:bg-muted transition-colors"
                        >
                          <Shield className="w-5 h-5 text-muted-foreground" />
                          <span className="font-medium">Admin</span>
                        </Link>
                      )}

                      <div className="my-2 border-t border-border" />

                      <button 
                        onClick={() => {
                          signOut();
                          closeMobileMenu();
                        }}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl text-muted-foreground hover:bg-muted transition-colors w-full text-left"
                      >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Logga ut</span>
                      </button>
                    </>
                  ) : (
                    <Link 
                      to="/auth" 
                      onClick={closeMobileMenu}
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                    >
                      Logga in
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
