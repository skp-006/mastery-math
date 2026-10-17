-- Mastery Math progress sync (one row per student; state holds all courses/topics). Run in Supabase Dashboard > SQL Editor.
create table if not exists public.progress (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  state      jsonb  not null,
  updated_at bigint not null,
  constraint progress_state_size check (pg_column_size(state) < 200000)
);
alter table public.progress enable row level security;
drop policy if exists "own row select" on public.progress;
drop policy if exists "own row insert" on public.progress;
drop policy if exists "own row update" on public.progress;
create policy "own row select" on public.progress for select to authenticated using ((select auth.uid()) = user_id);
create policy "own row insert" on public.progress for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "own row update" on public.progress for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
grant select, insert, update on public.progress to authenticated;
