import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, X, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { AppCardVisual } from '@/components/AppCardVisual';
import { PublicNav } from '@/components/PublicNav';
import { PublicFooter } from '@/components/PublicFooter';
import { useAuth } from '@/hooks/useAuth';
import { useApps, useCategories, useUserUpvotes, useToggleUpvote } from '@/hooks/useApps';
import { useSetting } from '@/hooks/useSettings';
import { useToast } from '@/hooks/use-toast';

export default function Apps() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: showFilters } = useSetting('show_filters');
  
  const [search, setSearch] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedAges, setSelectedAges] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [sort, setSort] = useState<'newest' | 'popular' | 'comments'>('popular');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: apps, isLoading: appsLoading } = useApps({
    search,
    subjects: selectedSubjects,
    ages: selectedAges,
    types: selectedTypes,
    sort,
  });
  const { data: userUpvotes = [] } = useUserUpvotes();
  const toggleUpvote = useToggleUpvote();

  const subjectCategories = categories?.filter(c => c.type === 'subject') || [];
  const ageCategories = categories?.filter(c => c.type === 'age') || [];
  const typeCategories = categories?.filter(c => c.type === 'app_type') || [];

  const activeFiltersCount = selectedSubjects.length + selectedAges.length + selectedTypes.length;

  const handleUpvote = (appId: string) => {
    if (!user) {
      toast({
        title: 'Logga in för att rösta',
        description: 'Du behöver ett konto för att rösta på appar.',
        variant: 'destructive',
      });
      return;
    }

    const hasUpvoted = userUpvotes.includes(appId);
    toggleUpvote.mutate({ appId, hasUpvoted });
  };

  const clearFilters = () => {
    setSelectedSubjects([]);
    setSelectedAges([]);
    setSelectedTypes([]);
    setSearch('');
  };

  const toggleFilter = (
    value: string,
    selected: string[],
    setSelected: (values: string[]) => void
  ) => {
    if (selected.includes(value)) {
      setSelected(selected.filter(v => v !== value));
    } else {
      setSelected([...selected, value]);
    }
  };

  const FilterSection = ({ title, items, selected, setSelected }: {
    title: string;
    items: typeof categories;
    selected: string[];
    setSelected: (values: string[]) => void;
  }) => (
    <div className="space-y-3">
      <h4 className="font-heading font-semibold text-sm text-foreground">{title}</h4>
      <div className="space-y-2">
        {items?.map(item => (
          <div key={item.id} className="flex items-center space-x-2">
            <Checkbox
              id={item.slug}
              checked={selected.includes(item.slug)}
              onCheckedChange={() => toggleFilter(item.slug, selected, setSelected)}
            />
            <Label
              htmlFor={item.slug}
              className="text-sm font-medium cursor-pointer flex items-center gap-1.5"
            >
              <span>{item.icon}</span>
              {item.name}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );

  const FiltersContent = () => (
    <div className="space-y-6">
      <FilterSection
        title="Ämne"
        items={subjectCategories}
        selected={selectedSubjects}
        setSelected={setSelectedSubjects}
      />
      <FilterSection
        title="Ålder"
        items={ageCategories}
        selected={selectedAges}
        setSelected={setSelectedAges}
      />
      <FilterSection
        title="Typ"
        items={typeCategories}
        selected={selectedTypes}
        setSelected={setSelectedTypes}
      />
      {activeFiltersCount > 0 && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full">
          <X className="w-4 h-4 mr-1" />
          Rensa filter
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Navigation */}
      <PublicNav variant="solid" />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/10 text-secondary text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Upptäck skolappar
          </div>
          <h1 className="text-3xl md:text-4xl font-heading font-bold mb-2">
            App-galleri
          </h1>
          <p className="text-muted-foreground">
            Utforska appar skapade av engagerade föräldrar
          </p>
        </div>

        {/* Search & Sort Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Sök appar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-11"
            />
          </div>
          
          {showFilters && (
            <div className="flex gap-2">
              {/* Mobile filter button */}
              <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden h-11 gap-2">
                    <Filter className="w-4 h-4" />
                    Filter
                    {activeFiltersCount > 0 && (
                      <Badge variant="secondary" className="ml-1">{activeFiltersCount}</Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80">
                  <SheetHeader>
                    <SheetTitle>Filter</SheetTitle>
                    <SheetDescription>
                      Filtrera appar efter ämne, ålder och typ
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-6">
                    <FiltersContent />
                  </div>
                </SheetContent>
              </Sheet>

              <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
                <SelectTrigger className="w-[160px] h-11">
                  <SelectValue placeholder="Sortera" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Populärast</SelectItem>
                  <SelectItem value="newest">Nyast</SelectItem>
                  <SelectItem value="comments">Mest diskuterade</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Active filters */}
        {showFilters && activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {[...selectedSubjects, ...selectedAges, ...selectedTypes].map(slug => {
              const cat = categories?.find(c => c.slug === slug);
              if (!cat) return null;
              return (
                <Badge
                  key={slug}
                  variant="secondary"
                  className="pl-2 pr-1 py-1 gap-1 cursor-pointer hover:bg-destructive/10"
                  onClick={() => {
                    if (cat.type === 'subject') toggleFilter(slug, selectedSubjects, setSelectedSubjects);
                    if (cat.type === 'age') toggleFilter(slug, selectedAges, setSelectedAges);
                    if (cat.type === 'app_type') toggleFilter(slug, selectedTypes, setSelectedTypes);
                  }}
                >
                  {cat.icon} {cat.name}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              );
            })}
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 text-xs">
              Rensa alla
            </Button>
          </div>
        )}

        <div className={showFilters ? "flex gap-8" : ""}>
          {/* Desktop Sidebar */}
          {showFilters && (
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-24 p-5 rounded-2xl bg-card/80 backdrop-blur-sm shadow-playful">
                <h3 className="font-heading font-bold text-lg mb-4">Filter</h3>
                {categoriesLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <FiltersContent />
                )}
              </div>
            </aside>
          )}

          {/* App Grid */}
          <main className="flex-1">
            {appsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="rounded-2xl bg-card/80 overflow-hidden">
                    <Skeleton className="aspect-video w-full" />
                    <div className="p-4 space-y-3">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <div className="flex gap-2">
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-5 w-16" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : apps && apps.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {apps.map(app => (
                  <AppCardVisual
                    key={app.id}
                    id={app.id}
                    title={app.title}
                    description={app.description}
                    url={app.url}
                    imageUrl={app.image_url || undefined}
                    upvotesCount={app.upvotes_count}
                    commentsCount={app.comments_count}
                    clicksCount={app.clicks_count}
                    creatorId={app.user_id}
                    creatorName={app.profile?.display_name || undefined}
                    categories={app.categories}
                    hasUpvoted={userUpvotes.includes(app.id)}
                    onUpvote={() => handleUpvote(app.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-heading font-bold mb-2">
                  Inga appar hittades
                </h3>
                <p className="text-muted-foreground mb-6">
                  {search || activeFiltersCount > 0
                    ? 'Prova att ändra dina filter eller sökord'
                    : 'Bli först med att dela en app!'
                  }
                </p>
                {(search || activeFiltersCount > 0) ? (
                  <Button variant="outline" onClick={clearFilters}>
                    Rensa filter
                  </Button>
                ) : (
                  <Button asChild>
                    <Link to={user ? "/min-sida/ny" : "/auth"}>
                      Dela din första app
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Footer */}
      <PublicFooter />
    </div>
  );
}
