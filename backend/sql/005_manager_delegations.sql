create table if not exists public.hub_manager_delegations (
  user_id uuid primary key references public.hub_profiles(user_id) on delete cascade,
  ecosystem_key text not null,
  permissions jsonb not null default '{}'::jsonb,
  updated_by uuid references public.hub_profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hub_manager_delegations_ecosystem_idx
  on public.hub_manager_delegations(ecosystem_key);

alter table public.hub_manager_delegations enable row level security;

revoke all on table public.hub_manager_delegations from anon;
revoke all on table public.hub_manager_delegations from authenticated;

grant select on table public.hub_manager_delegations to authenticated;

drop policy if exists "hub_manager_delegations_read_self" on public.hub_manager_delegations;
create policy "hub_manager_delegations_read_self"
on public.hub_manager_delegations
for select
to authenticated
using (auth.uid() = user_id);

comment on table public.hub_manager_delegations is
  'Deleghe operative assegnate dal CEO ai Responsabili ECCOMI HUB. I permessi sono verificati lato backend.';
