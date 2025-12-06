import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useMyProfile, useUpdateProfile, useUploadAvatar } from "@/hooks/useProfile";
import { AuthenticatedLayout } from "@/components/AuthenticatedLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Camera, Loader2 } from "lucide-react";

const EditProfile = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setBio(profile.bio || "");
      setAvatarUrl(profile.avatar_url);
    }
  }, [profile]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Fel filtyp",
        description: "Vänligen välj en bildfil.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Filen är för stor",
        description: "Max 5MB.",
        variant: "destructive",
      });
      return;
    }

    try {
      const url = await uploadAvatar.mutateAsync(file);
      setAvatarUrl(url);
      await updateProfile.mutateAsync({ avatar_url: url });
      toast({ title: "Profilbild uppdaterad" });
    } catch (error) {
      toast({
        title: "Kunde inte ladda upp bilden",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateProfile.mutateAsync({
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
      });
      toast({ title: "Profil uppdaterad" });
      navigate("/min-sida");
    } catch (error) {
      toast({
        title: "Kunde inte spara",
        variant: "destructive",
      });
    }
  };

  if (authLoading || profileLoading) {
    return (
      <AuthenticatedLayout>
        <div className="p-4 md:p-8 max-w-4xl space-y-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AuthenticatedLayout>
    );
  }

  const initials = displayName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || user?.email?.[0]?.toUpperCase() || "?";

  return (
    <AuthenticatedLayout>
      <div className="p-4 md:p-8 max-w-4xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold">Redigera profil</h1>
          <p className="text-muted-foreground text-sm">Uppdatera din profilinformation</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-20 w-20 border-2 border-border">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className="text-xl bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-primary-foreground cursor-pointer hover:bg-primary/90 transition-colors"
              >
                {uploadAvatar.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Camera className="h-3.5 w-3.5" />
                )}
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
                disabled={uploadAvatar.isPending}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Klicka på kameran för att byta bild
            </p>
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">Visningsnamn</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ditt namn"
              maxLength={100}
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Om dig</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Berätta lite om dig själv..."
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {bio.length}/500
            </p>
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/min-sida")}
            >
              Avbryt
            </Button>
            <Button
              type="submit"
              disabled={updateProfile.isPending}
            >
              {updateProfile.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sparar...
                </>
              ) : (
                "Spara ändringar"
              )}
            </Button>
          </div>
        </form>
      </div>
    </AuthenticatedLayout>
  );
};

export default EditProfile;
