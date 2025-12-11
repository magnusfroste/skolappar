
-- Create ideas table
CREATE TABLE public.ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  target_age text,
  target_subject text,
  status text NOT NULL DEFAULT 'open',
  claimed_by uuid,
  claimed_at timestamp with time zone,
  built_app_id uuid REFERENCES public.apps(id) ON DELETE SET NULL,
  upvotes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ideas_status_check CHECK (status IN ('open', 'claimed', 'built'))
);

-- Create idea_upvotes table
CREATE TABLE public.idea_upvotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id uuid REFERENCES public.ideas(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(idea_id, user_id)
);

-- Create idea_comments table
CREATE TABLE public.idea_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id uuid REFERENCES public.ideas(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_comments ENABLE ROW LEVEL SECURITY;

-- Ideas RLS policies
CREATE POLICY "Idéer är publikt synliga" ON public.ideas
  FOR SELECT USING (true);

CREATE POLICY "Inloggade användare kan skapa idéer" ON public.ideas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Användare kan uppdatera sina egna idéer" ON public.ideas
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = claimed_by OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins kan ta bort idéer" ON public.ideas
  FOR DELETE USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- Idea upvotes RLS policies
CREATE POLICY "Idea upvotes är publikt synliga" ON public.idea_upvotes
  FOR SELECT USING (true);

CREATE POLICY "Inloggade användare kan rösta på idéer" ON public.idea_upvotes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Användare kan ta bort sina röster" ON public.idea_upvotes
  FOR DELETE USING (auth.uid() = user_id);

-- Idea comments RLS policies
CREATE POLICY "Idékommentarer är publikt synliga" ON public.idea_comments
  FOR SELECT USING (true);

CREATE POLICY "Inloggade användare kan kommentera idéer" ON public.idea_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Användare kan uppdatera sina kommentarer" ON public.idea_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Användare och admins kan ta bort kommentarer" ON public.idea_comments
  FOR DELETE USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updating idea upvotes count
CREATE OR REPLACE FUNCTION public.update_idea_upvotes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.ideas SET upvotes_count = upvotes_count + 1 WHERE id = NEW.idea_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.ideas SET upvotes_count = upvotes_count - 1 WHERE id = OLD.idea_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER update_idea_upvotes_count_trigger
  AFTER INSERT OR DELETE ON public.idea_upvotes
  FOR EACH ROW EXECUTE FUNCTION public.update_idea_upvotes_count();

-- Trigger for updating idea comments count
CREATE OR REPLACE FUNCTION public.update_idea_comments_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.ideas SET comments_count = comments_count + 1 WHERE id = NEW.idea_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.ideas SET comments_count = comments_count - 1 WHERE id = OLD.idea_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER update_idea_comments_count_trigger
  AFTER INSERT OR DELETE ON public.idea_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_idea_comments_count();

-- Trigger for updating ideas updated_at
CREATE TRIGGER update_ideas_updated_at
  BEFORE UPDATE ON public.ideas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Trigger for idea upvote notification
CREATE OR REPLACE FUNCTION public.create_idea_upvote_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  idea_owner_id UUID;
  idea_title TEXT;
  voter_name TEXT;
BEGIN
  SELECT user_id, title INTO idea_owner_id, idea_title
  FROM public.ideas WHERE id = NEW.idea_id;
  
  IF idea_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  SELECT display_name INTO voter_name
  FROM public.profiles WHERE id = NEW.user_id;
  
  INSERT INTO public.notifications (user_id, type, from_user_id, message)
  VALUES (
    idea_owner_id,
    'idea_upvote',
    NEW.user_id,
    COALESCE(voter_name, 'Någon') || ' gillade din idé "' || idea_title || '"'
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER create_idea_upvote_notification_trigger
  AFTER INSERT ON public.idea_upvotes
  FOR EACH ROW EXECUTE FUNCTION public.create_idea_upvote_notification();

-- Trigger for idea comment notification
CREATE OR REPLACE FUNCTION public.create_idea_comment_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  idea_owner_id UUID;
  idea_title TEXT;
  commenter_name TEXT;
BEGIN
  SELECT user_id, title INTO idea_owner_id, idea_title
  FROM public.ideas WHERE id = NEW.idea_id;
  
  IF idea_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  SELECT display_name INTO commenter_name
  FROM public.profiles WHERE id = NEW.user_id;
  
  INSERT INTO public.notifications (user_id, type, from_user_id, message)
  VALUES (
    idea_owner_id,
    'idea_comment',
    NEW.user_id,
    COALESCE(commenter_name, 'Någon') || ' kommenterade på din idé "' || idea_title || '"'
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER create_idea_comment_notification_trigger
  AFTER INSERT ON public.idea_comments
  FOR EACH ROW EXECUTE FUNCTION public.create_idea_comment_notification();

-- Trigger for idea claimed notification
CREATE OR REPLACE FUNCTION public.create_idea_claimed_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claimer_name TEXT;
BEGIN
  IF NEW.status = 'claimed' AND (OLD.status IS NULL OR OLD.status = 'open') AND NEW.claimed_by IS NOT NULL THEN
    SELECT display_name INTO claimer_name
    FROM public.profiles WHERE id = NEW.claimed_by;
    
    IF NEW.user_id != NEW.claimed_by THEN
      INSERT INTO public.notifications (user_id, type, from_user_id, message)
      VALUES (
        NEW.user_id,
        'idea_claimed',
        NEW.claimed_by,
        COALESCE(claimer_name, 'Någon') || ' har tagit sig an din idé "' || NEW.title || '"!'
      );
    END IF;
  END IF;
  
  IF NEW.status = 'built' AND OLD.status = 'claimed' AND NEW.built_app_id IS NOT NULL THEN
    IF NEW.user_id != NEW.claimed_by THEN
      INSERT INTO public.notifications (user_id, type, app_id, from_user_id, message)
      VALUES (
        NEW.user_id,
        'idea_built',
        NEW.built_app_id,
        NEW.claimed_by,
        'Din idé "' || NEW.title || '" har blivit en app!'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER create_idea_claimed_notification_trigger
  AFTER UPDATE ON public.ideas
  FOR EACH ROW EXECUTE FUNCTION public.create_idea_claimed_notification();

-- Enable realtime for ideas
ALTER PUBLICATION supabase_realtime ADD TABLE public.ideas;
