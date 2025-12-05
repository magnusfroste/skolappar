-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  app_id UUID REFERENCES public.apps(id) ON DELETE CASCADE,
  from_user_id UUID,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- System can create notifications (via triggers)
CREATE POLICY "System can create notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
ON public.notifications
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Function to create upvote notification
CREATE OR REPLACE FUNCTION public.create_upvote_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  app_owner_id UUID;
  app_title TEXT;
  voter_name TEXT;
BEGIN
  -- Get app owner and title
  SELECT user_id, title INTO app_owner_id, app_title
  FROM public.apps WHERE id = NEW.app_id;
  
  -- Don't notify if user upvotes their own app
  IF app_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get voter name
  SELECT display_name INTO voter_name
  FROM public.profiles WHERE id = NEW.user_id;
  
  -- Create notification
  INSERT INTO public.notifications (user_id, type, app_id, from_user_id, message)
  VALUES (
    app_owner_id,
    'upvote',
    NEW.app_id,
    NEW.user_id,
    COALESCE(voter_name, 'Någon') || ' gillade din app "' || app_title || '"'
  );
  
  RETURN NEW;
END;
$$;

-- Function to create comment notification
CREATE OR REPLACE FUNCTION public.create_comment_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  app_owner_id UUID;
  app_title TEXT;
  commenter_name TEXT;
BEGIN
  -- Get app owner and title
  SELECT user_id, title INTO app_owner_id, app_title
  FROM public.apps WHERE id = NEW.app_id;
  
  -- Don't notify if user comments on their own app
  IF app_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get commenter name
  SELECT display_name INTO commenter_name
  FROM public.profiles WHERE id = NEW.user_id;
  
  -- Create notification
  INSERT INTO public.notifications (user_id, type, app_id, from_user_id, message)
  VALUES (
    app_owner_id,
    'comment',
    NEW.app_id,
    NEW.user_id,
    COALESCE(commenter_name, 'Någon') || ' kommenterade på din app "' || app_title || '"'
  );
  
  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER on_upvote_created
  AFTER INSERT ON public.upvotes
  FOR EACH ROW
  EXECUTE FUNCTION public.create_upvote_notification();

CREATE TRIGGER on_comment_created
  AFTER INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.create_comment_notification();