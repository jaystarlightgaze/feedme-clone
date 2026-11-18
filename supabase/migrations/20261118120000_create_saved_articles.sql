-- Converted articles a signed-in user keeps. One row per (user, source URL).
create table public.saved_articles (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  url text not null,
  title text not null,
  author text not null default '',
  domain text not null,
  markdown text not null,
  saved_at timestamptz not null default now(),

  primary key (id),
  unique (user_id, url)
);

-- The list reads one user's rows, newest first.
create index saved_articles_user_saved_at_idx
  on public.saved_articles (user_id, saved_at desc);

-- Owner-only access: signed-in users may read, add, change, and delete only their rows.
grant select, insert, update, delete on public.saved_articles to authenticated;
grant select, insert, update, delete on public.saved_articles to service_role;

alter table public.saved_articles enable row level security;

create policy "Users can view their own saved articles"
  on public.saved_articles for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can save their own articles"
  on public.saved_articles for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own saved articles"
  on public.saved_articles for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own saved articles"
  on public.saved_articles for delete
  to authenticated
  using ((select auth.uid()) = user_id);
