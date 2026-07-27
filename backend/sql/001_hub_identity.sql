create table if not exists public.hub_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  ec_id text unique,
  email text not null unique,
  full_name text not null,
  role text not null check (role in ('ceo', 'manager', 'operator')),
  ecosystem_keys text[] not null default '{}'::text[],
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.hub_profiles enable row level security;

revoke all on table public.hub_profiles from anon;
revoke all on table public.hub_profiles from authenticated;
grant select on table public.hub_profiles to authenticated;

drop policy if exists "hub_profiles_read_self" on public.hub_profiles;
create policy "hub_profiles_read_self"
on public.hub_profiles
for select
to authenticated
using (
  auth.uid() = user_id
  and active = true
);

comment on table public.hub_profiles is
  'Identità, ruolo e perimetro operativo degli utenti ECCOMI HUB.';
