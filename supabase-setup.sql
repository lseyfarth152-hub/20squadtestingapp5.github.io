-- Alert Desk: shared accounts, alerts, recipient responses, and live updates.
-- Paste this entire file into Supabase Dashboard > SQL Editor > New query, then Run.

create type public.app_role as enum ('admin', 'member');
create type public.alert_response as enum ('confirmed', 'declined');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  username text not null unique check (char_length(username) between 1 and 80),
  role public.app_role not null default 'member',
  color text not null default '#d6e5a2',
  created_at timestamptz not null default now()
);

create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 70),
  message text not null check (char_length(message) between 1 and 500),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.alert_recipients (
  alert_id uuid not null references public.alerts(id) on delete cascade,
  member_id uuid not null references public.profiles(id) on delete cascade,
  response public.alert_response,
  responded_at timestamptz,
  primary key (alert_id, member_id),
  check ((response is null and responded_at is null) or (response is not null and responded_at is not null))
);

create index alert_recipients_member_id_idx on public.alert_recipients(member_id);
create index alerts_created_at_idx on public.alerts(created_at desc);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    split_part(new.email, '@', 1)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.alerts enable row level security;
alter table public.alert_recipients enable row level security;

grant usage on schema public to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert on public.alerts to authenticated;
grant select, insert, update on public.alert_recipients to authenticated;

create policy "profiles visible to signed-in users" on public.profiles
  for select to authenticated using (true);
create policy "admins can update profiles" on public.profiles
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "admins can read alerts" on public.alerts
  for select to authenticated using ((select public.is_admin()));
create policy "members can read received alerts" on public.alerts
  for select to authenticated using (exists (
    select 1 from public.alert_recipients r
    where r.alert_id = alerts.id and r.member_id = (select auth.uid())
  ));
create policy "admins can create alerts" on public.alerts
  for insert to authenticated with check ((select public.is_admin()) and created_by = (select auth.uid()));

create policy "admins can read all recipients" on public.alert_recipients
  for select to authenticated using ((select public.is_admin()));
create policy "members can read their recipient rows" on public.alert_recipients
  for select to authenticated using (member_id = (select auth.uid()));
create policy "admins can add recipients" on public.alert_recipients
  for insert to authenticated with check ((select public.is_admin()));
create policy "members can respond once to their own alerts" on public.alert_recipients
  for update to authenticated
  using (member_id = (select auth.uid()) and response is null)
  with check (member_id = (select auth.uid()) and response is not null and responded_at is not null);

alter table public.alerts replica identity full;
alter table public.alert_recipients replica identity full;
alter publication supabase_realtime add table public.alerts, public.alert_recipients;

-- Allow the Administrator to remove members from the Alert Desk profile list.
create policy "admins can delete profiles" on public.profiles
  for delete to authenticated using ((select public.is_admin()));
