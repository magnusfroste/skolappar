import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, BookOpen, Users, Rocket, Mail, Lock, User } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.string().email('Ogiltig e-postadress');
const passwordSchema = z.string().min(6, 'Lösenordet måste vara minst 6 tecken');
const nameSchema = z.string().min(2, 'Namnet måste vara minst 2 tecken').max(50, 'Namnet får vara max 50 tecken');

export default function Auth() {
  const navigate = useNavigate();
  const { user, signIn, signUp, signInWithGoogle, loading } = useAuth();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupName, setSignupName] = useState('');

  useEffect(() => {
    if (user && !loading) {
      navigate('/min-sida');
    }
  }, [user, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(loginEmail);
      passwordSchema.parse(loginPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({
          title: 'Ogiltig inmatning',
          description: err.errors[0].message,
          variant: 'destructive',
        });
        return;
      }
    }
    
    setIsSubmitting(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setIsSubmitting(false);
    
    if (error) {
      toast({
        title: 'Inloggning misslyckades',
        description: error.message === 'Invalid login credentials' 
          ? 'Fel e-postadress eller lösenord' 
          : error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      nameSchema.parse(signupName);
      emailSchema.parse(signupEmail);
      passwordSchema.parse(signupPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({
          title: 'Ogiltig inmatning',
          description: err.errors[0].message,
          variant: 'destructive',
        });
        return;
      }
    }
    
    setIsSubmitting(true);
    const { error } = await signUp(signupEmail, signupPassword, signupName);
    setIsSubmitting(false);
    
    if (error) {
      if (error.message.includes('already registered')) {
        toast({
          title: 'Kontot finns redan',
          description: 'Den här e-postadressen är redan registrerad. Prova att logga in istället.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Registrering misslyckades',
          description: error.message,
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: 'Välkommen! 🎉',
        description: 'Ditt konto har skapats. Du är nu inloggad!',
      });
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await signInWithGoogle();
    if (error) {
      toast({
        title: 'Google-inloggning misslyckades',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="animate-bounce-gentle">
          <Sparkles className="w-12 h-12 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 text-6xl animate-float opacity-20">📚</div>
        <div className="absolute top-40 right-20 text-5xl animate-bounce-gentle opacity-20" style={{ animationDelay: '0.5s' }}>🎨</div>
        <div className="absolute bottom-40 left-20 text-5xl animate-float opacity-20" style={{ animationDelay: '1s' }}>🚀</div>
        <div className="absolute bottom-20 right-10 text-6xl animate-bounce-gentle opacity-20" style={{ animationDelay: '1.5s' }}>⭐</div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <header className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2 text-2xl font-heading font-bold text-foreground hover:text-primary transition-colors">
            <span className="text-3xl">📱</span>
            skolappar.com
          </a>
        </header>

        {/* Main content */}
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-8 items-center">
          {/* Left side - Info */}
          <div className="space-y-6 text-center lg:text-left">
            <h1 className="text-4xl lg:text-5xl font-heading font-bold leading-tight">
              Välkommen till{' '}
              <span className="text-gradient">skolappar</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              En plattform där vibe-codande föräldrar delar sina hemmagjorda skolappar. 
              Delad glädje är dubbel glädje!
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              <div className="flex flex-col items-center lg:items-start gap-2 p-4 rounded-2xl bg-card/50 backdrop-blur-sm">
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <BookOpen className="w-6 h-6" />
                </div>
                <span className="font-medium">Lärande appar</span>
              </div>
              <div className="flex flex-col items-center lg:items-start gap-2 p-4 rounded-2xl bg-card/50 backdrop-blur-sm">
                <div className="p-3 rounded-xl bg-secondary/10 text-secondary">
                  <Users className="w-6 h-6" />
                </div>
                <span className="font-medium">Community</span>
              </div>
              <div className="flex flex-col items-center lg:items-start gap-2 p-4 rounded-2xl bg-card/50 backdrop-blur-sm">
                <div className="p-3 rounded-xl bg-accent/20 text-accent-foreground">
                  <Rocket className="w-6 h-6" />
                </div>
                <span className="font-medium">Innovation</span>
              </div>
            </div>
          </div>

          {/* Right side - Auth form */}
          <Card className="shadow-playful-lg border-0 bg-card/95 backdrop-blur-sm">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl font-heading">Kom igång</CardTitle>
              <CardDescription>
                Logga in eller skapa ett konto för att dela dina appar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Google Login */}
              <Button 
                variant="outline" 
                className="w-full h-12 text-base font-medium gap-3 hover:bg-muted/50"
                onClick={handleGoogleLogin}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Fortsätt med Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    eller med e-post
                  </span>
                </div>
              </div>

              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="login" className="font-medium">Logga in</TabsTrigger>
                  <TabsTrigger value="signup" className="font-medium">Registrera</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        E-postadress
                      </Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="namn@exempel.se"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Lösenord
                      </Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        className="h-11"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full h-11 text-base font-semibold"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Loggar in...' : 'Logga in'}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name" className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Ditt namn
                      </Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Anna Andersson"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        required
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        E-postadress
                      </Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="namn@exempel.se"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        required
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Lösenord
                      </Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Minst 6 tecken"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        required
                        className="h-11"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full h-11 text-base font-semibold"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Skapar konto...' : 'Skapa konto'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-muted-foreground">
          <p>© 2024 skolappar.com · Skapad med ❤️ av vibe-codande föräldrar</p>
        </footer>
      </div>
    </div>
  );
}
