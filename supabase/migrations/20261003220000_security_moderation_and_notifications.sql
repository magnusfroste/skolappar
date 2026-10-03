-- ============================================================
-- Security hardening (2026-10-03)
--
-- 1. Anyone (also anonymous) could insert notifications for any user.
--    Notifications are created only by SECURITY DEFINER triggers, so the
--    open insert policy is removed.
-- 2. App owners could update every column of their own app, i.e. set
--    status = 'approved'/'featured', is_featured, and inflate counters, or
--    insert an app that is already approved. Moderation fields and counters
--    are now protected for direct writes by non-admins. Counter triggers and
--    increment_clicks run as SECURITY DEFINER (current_user is the owner) and
--    are unaffected.
-- ============================================================

drop policy if exists "System can create notifications" on public.notifications;

create or replace function public.protect_moderation_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- Only restrict direct API writes (roles anon/authenticated) by non-admins.
  if current_user not in ('anon', 'authenticated') or public.has_role(auth.uid(), 'admin') then
    return new;
  end if;

  if tg_table_name = 'apps' then
    if tg_op = 'INSERT' then
      new.status := 'pending';
      new.is_featured := false;
      new.delist_reason := null;
      new.upvotes_count := 0;
      new.comments_count := 0;
      new.clicks_count := 0;
    else
      new.status := old.status;
      new.is_featured := old.is_featured;
      new.delist_reason := old.delist_reason;
      new.upvotes_count := old.upvotes_count;
      new.comments_count := old.comments_count;
      new.clicks_count := old.clicks_count;
    end if;
  elsif tg_table_name = 'ideas' then
    if tg_op = 'INSERT' then
      new.upvotes_count := 0;
      new.comments_count := 0;
    else
      new.upvotes_count := old.upvotes_count;
      new.comments_count := old.comments_count;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists protect_moderation_fields on public.apps;
create trigger protect_moderation_fields before insert or update on public.apps
  for each row execute function public.protect_moderation_fields();

drop trigger if exists protect_moderation_fields on public.ideas;
create trigger protect_moderation_fields before insert or update on public.ideas
  for each row execute function public.protect_moderation_fields();
