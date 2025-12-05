-- Skapa enum för roller
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Skapa enum för app-status
CREATE TYPE public.app_status AS ENUM ('pending', 'approved', 'rejected', 'featured');

-- Profiler-tabell
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiler är publikt synliga"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Användare kan uppdatera sin egen profil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Användare kan skapa sin egen profil"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- User roles tabell (separat från profiles för säkerhet)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer funktion för rollkontroll
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE POLICY "Användare kan se sina egna roller"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins kan hantera roller"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Kategorier-tabell
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('subject', 'age', 'app_type')),
  description TEXT,
  icon TEXT,
  color TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Kategorier är publikt synliga"
  ON public.categories FOR SELECT
  USING (true);

CREATE POLICY "Admins kan hantera kategorier"
  ON public.categories FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Appar-tabell
CREATE TABLE public.apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  long_description TEXT,
  url TEXT NOT NULL,
  image_url TEXT,
  status app_status DEFAULT 'pending' NOT NULL,
  is_featured BOOLEAN DEFAULT FALSE,
  upvotes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Godkända appar är publikt synliga"
  ON public.apps FOR SELECT
  USING (status = 'approved' OR status = 'featured' OR auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Användare kan skapa appar"
  ON public.apps FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Användare kan uppdatera sina egna appar"
  ON public.apps FOR UPDATE
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins kan ta bort appar"
  ON public.apps FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- App-kategorier kopplingstabell
CREATE TABLE public.app_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID REFERENCES public.apps(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
  UNIQUE (app_id, category_id)
);

ALTER TABLE public.app_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "App-kategorier är publikt synliga"
  ON public.app_categories FOR SELECT
  USING (true);

CREATE POLICY "Användare kan hantera sina app-kategorier"
  ON public.app_categories FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.apps WHERE id = app_id AND user_id = auth.uid()));

CREATE POLICY "Användare kan ta bort sina app-kategorier"
  ON public.app_categories FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.apps WHERE id = app_id AND user_id = auth.uid()));

-- Upvotes-tabell
CREATE TABLE public.upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  app_id UUID REFERENCES public.apps(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE (user_id, app_id)
);

ALTER TABLE public.upvotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Upvotes är publikt synliga"
  ON public.upvotes FOR SELECT
  USING (true);

CREATE POLICY "Inloggade användare kan rösta"
  ON public.upvotes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Användare kan ta bort sina röster"
  ON public.upvotes FOR DELETE
  USING (auth.uid() = user_id);

-- Kommentarer-tabell
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  app_id UUID REFERENCES public.apps(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Kommentarer är publikt synliga"
  ON public.comments FOR SELECT
  USING (true);

CREATE POLICY "Inloggade användare kan kommentera"
  ON public.comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Användare kan uppdatera sina kommentarer"
  ON public.comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Användare och admins kan ta bort kommentarer"
  ON public.comments FOR DELETE
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Trigger för att skapa profil vid registrering
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger för uppdaterad timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_apps_updated_at
  BEFORE UPDATE ON public.apps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Trigger för att uppdatera upvotes_count
CREATE OR REPLACE FUNCTION public.update_app_upvotes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.apps SET upvotes_count = upvotes_count + 1 WHERE id = NEW.app_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.apps SET upvotes_count = upvotes_count - 1 WHERE id = OLD.app_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER on_upvote_change
  AFTER INSERT OR DELETE ON public.upvotes
  FOR EACH ROW EXECUTE FUNCTION public.update_app_upvotes_count();

-- Trigger för att uppdatera comments_count
CREATE OR REPLACE FUNCTION public.update_app_comments_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.apps SET comments_count = comments_count + 1 WHERE id = NEW.app_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.apps SET comments_count = comments_count - 1 WHERE id = OLD.app_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER on_comment_change
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_app_comments_count();

-- Lägg till initiala kategorier
INSERT INTO public.categories (name, slug, type, icon, color, sort_order) VALUES
-- Ämnen
('Matematik', 'matte', 'subject', '🔢', '#FF6B6B', 1),
('Svenska', 'svenska', 'subject', '📚', '#4ECDC4', 2),
('Engelska', 'engelska', 'subject', '🌍', '#45B7D1', 3),
('NO', 'no', 'subject', '🔬', '#96CEB4', 4),
('SO', 'so', 'subject', '🗺️', '#FFEAA7', 5),
('Musik', 'musik', 'subject', '🎵', '#DDA0DD', 6),
('Bild', 'bild', 'subject', '🎨', '#FF9F43', 7),
('Idrott', 'idrott', 'subject', '⚽', '#26de81', 8),
('Programmering', 'programmering', 'subject', '💻', '#a55eea', 9),
-- Åldrar
('Förskoleklass', 'forskoleklass', 'age', '🌱', '#FFEAA7', 1),
('Lågstadiet (1-3)', 'lagstadiet', 'age', '🌿', '#96CEB4', 2),
('Mellanstadiet (4-6)', 'mellanstadiet', 'age', '🌲', '#45B7D1', 3),
('Högstadiet (7-9)', 'hogstadiet', 'age', '🎓', '#4ECDC4', 4),
-- App-typer
('Quiz', 'quiz', 'app_type', '❓', '#FF6B6B', 1),
('Spel', 'spel', 'app_type', '🎮', '#45B7D1', 2),
('Verktyg', 'verktyg', 'app_type', '🛠️', '#96CEB4', 3),
('Övning', 'ovning', 'app_type', '✏️', '#FFEAA7', 4),
('Läsning', 'lasning', 'app_type', '📖', '#DDA0DD', 5);