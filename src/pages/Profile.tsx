import { useParams, Link } from "react-router-dom";
import { usePublicProfile, usePublicProfileApps } from "@/hooks/usePublicProfile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar, ExternalLink, Heart, MessageCircle, User } from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

const Profile = () => {
  const { id } = useParams<{ id: string }>();
  const { data: profile, isLoading: profileLoading } = usePublicProfile(id);
  const { data: apps, isLoading: appsLoading } = usePublicProfileApps(id);

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-8" />
          <div className="flex items-center gap-6 mb-8">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Profil hittades inte</h1>
          <p className="text-muted-foreground mb-4">
            Användaren finns inte eller har tagits bort.
          </p>
          <Button asChild>
            <Link to="/apps">Tillbaka till appar</Link>
          </Button>
        </div>
      </div>
    );
  }

  const initials = profile.display_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "?";

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/apps">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tillbaka
          </Link>
        </Button>

        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-10">
          <Avatar className="h-24 w-24 border-4 border-border">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="text-2xl bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="text-center sm:text-left">
            <h1 className="text-3xl font-bold mb-2">
              {profile.display_name || "Anonym användare"}
            </h1>
            {profile.bio && (
              <p className="text-muted-foreground mb-3 max-w-md">{profile.bio}</p>
            )}
            <div className="flex items-center justify-center sm:justify-start gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Medlem sedan {format(new Date(profile.created_at), "MMMM yyyy", { locale: sv })}
              </span>
              <span>{apps?.length || 0} appar</span>
            </div>
          </div>
        </div>

        {/* Apps Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Publicerade appar</h2>
          
          {appsLoading ? (
            <div className="grid gap-4">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : apps && apps.length > 0 ? (
            <div className="grid gap-4">
              {apps.map((app) => (
                <Card key={app.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row">
                      {app.image_url && (
                        <div className="sm:w-48 h-32 sm:h-auto flex-shrink-0">
                          <img
                            src={app.image_url}
                            alt={app.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="p-4 flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg mb-1 truncate">
                              {app.title}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                              {app.description}
                            </p>
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {app.categories.slice(0, 4).map((cat) => (
                                <Badge
                                  key={cat.id}
                                  variant="secondary"
                                  className="text-xs"
                                  style={{
                                    backgroundColor: cat.color ? `${cat.color}20` : undefined,
                                    color: cat.color || undefined,
                                  }}
                                >
                                  {cat.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <Button size="sm" variant="outline" asChild>
                            <a href={app.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Heart className="h-4 w-4" />
                            {app.upvotes_count || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-4 w-4" />
                            {app.comments_count || 0}
                          </span>
                          <span>
                            {format(new Date(app.created_at), "d MMM yyyy", { locale: sv })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  Inga publicerade appar ännu.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
