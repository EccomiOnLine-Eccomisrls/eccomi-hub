begin;

create table if not exists public.hub_evaluations (
  entry_id uuid primary key
    references public.hub_entries(id) on delete cascade,

  need_score smallint not null
    check (need_score between 1 and 5),
  dna_score smallint not null
    check (dna_score between 1 and 5),
  revenue_score smallint not null
    check (revenue_score between 1 and 5),
  feasibility_score smallint not null
    check (feasibility_score between 1 and 5),
  risk_control_score smallint not null
    check (risk_control_score between 1 and 5),

  total_score smallint not null
    check (total_score between 0 and 100),
  traffic_light text not null
    check (traffic_light in ('Verde', 'Giallo', 'Rosso')),

  strengths text[] not null default '{}'::text[],
  criticalities text[] not null default '{}'::text[],
  conditions text[] not null default '{}'::text[],

  analysis_source text not null default 'hub_rules'
    check (analysis_source in ('hub_rules', 'openai')),
  analysis_model text,

  decision_state text not null default 'Da decidere'
    check (decision_state in (
      'Da decidere',
      'Dettagli richiesti',
      'Approvato',
      'Sospeso'
    )),
  decision_note text,

  evaluated_by uuid not null references auth.users(id),
  decided_by uuid references auth.users(id),
  evaluated_at timestamptz not null default now(),
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hub_evaluations_traffic_light_idx
  on public.hub_evaluations (traffic_light);

create index if not exists hub_evaluations_decision_state_idx
  on public.hub_evaluations (decision_state);

drop trigger if exists hub_evaluations_set_updated_at
on public.hub_evaluations;

create trigger hub_evaluations_set_updated_at
before update on public.hub_evaluations
for each row
execute function public.hub_set_updated_at();

alter table public.hub_evaluations enable row level security;

revoke all on table public.hub_evaluations from anon;
revoke all on table public.hub_evaluations from authenticated;
grant select, insert, update on table public.hub_evaluations to authenticated;

drop policy if exists "hub_evaluations_ceo_read"
on public.hub_evaluations;

create policy "hub_evaluations_ceo_read"
on public.hub_evaluations
for select
to authenticated
using (
  exists (
    select 1
    from public.hub_profiles profile
    where profile.user_id = auth.uid()
      and profile.active = true
      and profile.role = 'ceo'
  )
);

drop policy if exists "hub_evaluations_ceo_create"
on public.hub_evaluations;

create policy "hub_evaluations_ceo_create"
on public.hub_evaluations
for insert
to authenticated
with check (
  evaluated_by = auth.uid()
  and exists (
    select 1
    from public.hub_profiles profile
    where profile.user_id = auth.uid()
      and profile.active = true
      and profile.role = 'ceo'
  )
);

drop policy if exists "hub_evaluations_ceo_update"
on public.hub_evaluations;

create policy "hub_evaluations_ceo_update"
on public.hub_evaluations
for update
to authenticated
using (
  exists (
    select 1
    from public.hub_profiles profile
    where profile.user_id = auth.uid()
      and profile.active = true
      and profile.role = 'ceo'
  )
)
with check (
  exists (
    select 1
    from public.hub_profiles profile
    where profile.user_id = auth.uid()
      and profile.active = true
      and profile.role = 'ceo'
  )
);

create or replace function public.hub_decide_entry(
  p_entry_id uuid,
  p_action text,
  p_note text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_is_ceo boolean;
  v_current_status text;
  v_next_status text;
  v_decision_state text;
  v_default_note text;
begin
  select exists (
    select 1
    from public.hub_profiles profile
    where profile.user_id = auth.uid()
      and profile.active = true
      and profile.role = 'ceo'
  ) into v_is_ceo;

  if not v_is_ceo then
    raise exception 'Solo il CEO può decidere l''esito della valutazione.';
  end if;

  if p_action not in ('request_details', 'suspend', 'approve') then
    raise exception 'Azione di valutazione non valida.';
  end if;

  select status
  into v_current_status
  from public.hub_entries
  where id = p_entry_id
  for update;

  if v_current_status is null then
    raise exception 'Iniziativa non trovata.';
  end if;

  if v_current_status <> 'Valutazione' then
    raise exception 'L''iniziativa non è nello stato Valutazione.';
  end if;

  if not exists (
    select 1
    from public.hub_evaluations
    where entry_id = p_entry_id
  ) then
    raise exception 'Genera prima la valutazione dell''iniziativa.';
  end if;

  if p_action = 'approve' then
    v_next_status := 'Approvato';
    v_decision_state := 'Approvato';
    v_default_note := 'Valutazione approvata dal CEO.';
  elsif p_action = 'suspend' then
    v_next_status := 'Sospeso';
    v_decision_state := 'Sospeso';
    v_default_note := 'Valutazione sospesa dal CEO.';
  else
    v_next_status := 'Valutazione';
    v_decision_state := 'Dettagli richiesti';
    v_default_note := 'Richiesti ulteriori dettagli prima della decisione.';
  end if;

  update public.hub_evaluations
  set decision_state = v_decision_state,
      decision_note = coalesce(nullif(btrim(p_note), ''), v_default_note),
      decided_by = auth.uid(),
      decided_at = now()
  where entry_id = p_entry_id;

  update public.hub_entries
  set status = v_next_status
  where id = p_entry_id;

  return jsonb_build_object(
    'entry_id', p_entry_id,
    'status', v_next_status,
    'decision_state', v_decision_state
  );
end;
$$;

revoke all on function public.hub_decide_entry(uuid, text, text) from public;
grant execute on function public.hub_decide_entry(uuid, text, text) to authenticated;

comment on table public.hub_evaluations is
  'Punteggio, semaforo, analisi e decisione CEO per le iniziative ECCOMI HUB.';

commit;

select
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename = 'hub_evaluations';
