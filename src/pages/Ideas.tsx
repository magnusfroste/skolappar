import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PublicNav } from '@/components/PublicNav';
import { PublicFooter } from '@/components/PublicFooter';
import { IdeaCard } from '@/components/IdeaCard';
import { SEO } from '@/components/SEO';
import { useIdeas, useUserIdeaUpvotes, useToggleIdeaUpvote } from '@/hooks/useIdeas';
import { useAuth } from '@/hooks/useAuth';
import { Lightbulb, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const AGE_OPTIONS = [
  { value: 'all', label: 'Alla åldrar' },
  { value: 'Förskola', label: 'Förskola' },
  { value: 'Lågstadiet', label: 'Lågstadiet' },
  { value: 'Mellanstadiet', label: 'Mellanstadiet' },
  { value: 'Högstadiet', label: 'Högstadiet' },
  { value: 'Gymnasiet', label: 'Gymnasiet' },
];

const SUBJECT_OPTIONS = [
  { value: 'all', label: 'Alla ämnen' },
  { value: 'Matte', label: 'Matte' },
  { value: 'Svenska', label: 'Svenska' },
  { value: 'Engelska', label: 'Engelska' },
  { value: 'NO', label: 'NO' },
  { value: 'SO', label: 'SO' },
  { value: 'Musik', label: 'Musik' },
  { value: 'Bild', label: 'Bild' },
  { value: 'Idrott', label: 'Idrott' },
  { value: 'Annat', label: 'Annat' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'Alla' },
  { value: 'open', label: 'Öppna' },
  { value: 'claimed', label: 'Under utveckling' },
  { value: 'built', label: 'Byggda' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Nyaste först' },
  { value: 'popular', label: 'Populäraste' },
];

export default function Ideas() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [targetAge, setTargetAge] = useState('all');
  const [targetSubject, setTargetSubject] = useState('all');
  const [status, setStatus] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'popular'>('popular');

  const { data: ideas, isLoading } = useIdeas({
    search: search || undefined,
    target_age: targetAge !== 'all' ? targetAge : undefined,
    target_subject: targetSubject !== 'all' ? targetSubject : undefined,
    status: status !== 'all' ? status : undefined,
    sortBy,
  });

  const { data: userUpvotes } = useUserIdeaUpvotes();
  const toggleUpvote = useToggleIdeaUpvote();

  const handleUpvote = (ideaId: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const hasUpvoted = userUpvotes?.includes(ideaId) || false;
    toggleUpvote.mutate(
      { ideaId, hasUpvoted },
      {
        onError: () => toast.error('Kunde inte rösta'),
      }
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="App-idéer | Skolappar"
        description="Föreslå appar du behöver eller bygg någon annans idé. Tillsammans skapar vi bättre pedagogiska verktyg för våra barn."
      />
      <PublicNav />

      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center p-3 bg-amber-500/10 rounded-2xl mb-4">
              <Lightbulb className="h-8 w-8 text-amber-500" />
            </div>
            <h1 className="text-4xl font-bold mb-4">App-idéer</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-6">
              Föreslå appar du behöver eller rösta på andras idéer. Vibe-coders
              kan ta sig an idéer och bygga dem till verklighet.
            </p>
            <Button asChild size="lg" className="gap-2">
              <Link to={user ? '/min-sida/ideer/ny' : '/auth'}>
                <Plus className="h-5 w-5" />
                Föreslå en app
              </Link>
            </Button>
          </div>

          {/* Filters */}
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 mb-8">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Sök idéer..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={targetSubject} onValueChange={setTargetSubject}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={targetAge} onValueChange={setTargetAge}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AGE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'newest' | 'popular')}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Ideas Grid */}
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-64 bg-muted/50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : ideas && ideas.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {ideas.map((idea) => (
                <IdeaCard
                  key={idea.id}
                  idea={idea}
                  hasUpvoted={userUpvotes?.includes(idea.id)}
                  onUpvote={() => handleUpvote(idea.id)}
                  isUpvoting={toggleUpvote.isPending}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Lightbulb className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Inga idéer hittades</h3>
              <p className="text-muted-foreground mb-6">
                {search || targetAge !== 'all' || targetSubject !== 'all'
                  ? 'Prova att ändra dina filter'
                  : 'Var först med att föreslå en app-idé!'}
              </p>
              <Button asChild>
                <Link to={user ? '/min-sida/ideer/ny' : '/auth'}>
                  Föreslå en app
                </Link>
              </Button>
            </div>
          )}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
