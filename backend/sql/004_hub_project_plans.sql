begin;

create table if not exists public.hub_project_plans (
  entry_id uuid primary key
    references public.hub_entries(id) on delete cascade,

  objective text not null
    check (length(btrim(objective)) > 0),

  owner text not null
    check (length(btrim(owner)) > 0),

  start_date date not null,
  target_date date not null
    check (target_date >= start_date),

  budget numeric(14, 2) not null default 0
    check (budget >= 0),

  tasks jsonb not null default '[]'::jsonb
    check (jsonb_typeof(tasks) = 'array'),

  kpis jsonb not null default '[]'::jsonb
    check (jsonb_typeof(kpis) = 'array'),

  conditions jsonb not null default '[]'::jsonb
    check (jsonb_typeof(conditions) = 'array'),

  plan_state text not null default 'Attivo'
    check (plan_state in ('Attivo', 'Pronto per il test', 'In test')),

  planned_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hub_project_plans_state_idx
  on public.hub_project_plans (plan_state);

create index if not exists hub_project_plans_target_date_idx
  on public.hub_project_plans (target_date);

drop trigger if exists hub_project_plans_set_updated_at
on public.hub_project_plans;

create trigger hub_project_plans_set_updated_at
before update on public.hub_project_plans
for each row
execute function public.hub_set_updated_at();

alter table public.hub_project_plans enable row level security;

revoke all on table public.hub_project_plans from anon;
revoke all on table public.hub_project_plans from authenticated;

grant select, insert, update
on table public.hub_project_plans
to authenticated;

drop policy if exists "hub_project_plans_ceo_read"
on public.hub_project_plans;

create policy "hub_project_plans_ceo_read"
on public.hub_project_plans
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

drop policy if exists "hub_project_plans_ceo_create"
on public.hub_project_plans;

create policy "hub_project_plans_ceo_create"
on public.hub_project_plans
for insert
to authenticated
with check (
  planned_by = auth.uid()
  and exists (
    select 1
    from public.hub_profiles profile
    where profile.user_id = auth.uid()
      and profile.active = true
      and profile.role = 'ceo'
  )
);

drop policy if exists "hub_project_plans_ceo_update"
on public.hub_project_plans;

create policy "hub_project_plans_ceo_update"
on public.hub_project_plans
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

create or replace function public.hub_project_plan_is_ready(
  p_tasks jsonb,
  p_kpis jsonb,
  p_conditions jsonb
)
returns boolean
language sql
immutable
set search_path = public
as $$
  select
    coalesce(jsonb_typeof(p_tasks) = 'array', false)
    and coalesce(jsonb_typeof(p_kpis) = 'array', false)
    and coalesce(jsonb_typeof(p_conditions) = 'array', false)
    and jsonb_array_length(p_tasks) > 0
    and jsonb_array_length(p_kpis) > 0
    and jsonb_array_length(p_conditions) > 0
    and not exists (
      select 1
      from jsonb_array_elements(p_tasks) task_item
      where coalesce(task_item ->> 'status', '') <> 'Completata'
    )
    and not exists (
      select 1
      from jsonb_array_elements(p_conditions) condition_item
      where condition_item -> 'met' is distinct from 'true'::jsonb
    );
$$;

create or replace function public.hub_save_project_plan(
  p_entry_id uuid,
  p_objective text,
  p_owner text,
  p_start_date date,
  p_target_date date,
  p_budget numeric,
  p_tasks jsonb,
  p_kpis jsonb,
  p_conditions jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_is_ceo boolean;
  v_current_status text;
  v_plan_state text;
begin
  select exists (
    select 1
    from public.hub_profiles profile
    where profile.user_id = auth.uid()
      and profile.active = true
      and profile.role = 'ceo'
  ) into v_is_ceo;

  if not v_is_ceo then
    raise exception 'Solo il CEO può gestire la progettazione.';
  end if;

  select status
  into v_current_status
  from public.hub_entries
  where id = p_entry_id
  for update;

  if v_current_status is null then
    raise exception 'Iniziativa non trovata.';
  end if;

  if v_current_status not in ('Approvato', 'Progettazione') then
    raise exception 'La progettazione può essere avviata solo dopo l''approvazione.';
  end if;

  if nullif(btrim(p_objective), '') is null
     or nullif(btrim(p_owner), '') is null then
    raise exception 'Obiettivo e responsabile sono obbligatori.';
  end if;

  if p_start_date is null or p_target_date is null or p_target_date < p_start_date then
    raise exception 'Le date della progettazione non sono valide.';
  end if;

  if p_budget is null or p_budget < 0 then
    raise exception 'Il budget non può essere negativo.';
  end if;

  if coalesce(jsonb_typeof(p_tasks) = 'array', false) = false
     or jsonb_array_length(p_tasks) = 0
     or jsonb_array_length(p_tasks) > 50 then
    raise exception 'Inserisci da 1 a 50 attività.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_tasks) task_item
    where jsonb_typeof(task_item) <> 'object'
       or coalesce(btrim(task_item ->> 'id'), '') = ''
       or coalesce(btrim(task_item ->> 'title'), '') = ''
       or coalesce(btrim(task_item ->> 'owner'), '') = ''
       or coalesce(btrim(task_item ->> 'dueDate'), '') = ''
       or coalesce(task_item ->> 'status', '') not in ('Da fare', 'In corso', 'Completata', 'Bloccata')
  ) then
    raise exception 'Completa correttamente tutte le attività.';
  end if;

  if coalesce(jsonb_typeof(p_kpis) = 'array', false) = false
     or jsonb_array_length(p_kpis) = 0
     or jsonb_array_length(p_kpis) > 20 then
    raise exception 'Inserisci da 1 a 20 KPI.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_kpis) kpi_item
    where jsonb_typeof(kpi_item) <> 'object'
       or coalesce(btrim(kpi_item ->> 'id'), '') = ''
       or coalesce(btrim(kpi_item ->> 'name'), '') = ''
       or coalesce(btrim(kpi_item ->> 'target'), '') = ''
  ) then
    raise exception 'Completa correttamente tutti i KPI.';
  end if;

  if coalesce(jsonb_typeof(p_conditions) = 'array', false) = false
     or jsonb_array_length(p_conditions) = 0
     or jsonb_array_length(p_conditions) > 20 then
    raise exception 'Inserisci da 1 a 20 condizioni obbligatorie.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_conditions) condition_item
    where jsonb_typeof(condition_item) <> 'object'
       or coalesce(btrim(condition_item ->> 'id'), '') = ''
       or coalesce(btrim(condition_item ->> 'text'), '') = ''
       or (
         condition_item -> 'met' is distinct from 'true'::jsonb
         and condition_item -> 'met' is distinct from 'false'::jsonb
       )
  ) then
    raise exception 'Completa correttamente tutte le condizioni.';
  end if;

  v_plan_state := case
    when public.hub_project_plan_is_ready(p_tasks, p_kpis, p_conditions)
      then 'Pronto per il test'
    else 'Attivo'
  end;

  insert into public.hub_project_plans (
    entry_id,
    objective,
    owner,
    start_date,
    target_date,
    budget,
    tasks,
    kpis,
    conditions,
    plan_state,
    planned_by
  )
  values (
    p_entry_id,
    btrim(p_objective),
    btrim(p_owner),
    p_start_date,
    p_target_date,
    p_budget,
    p_tasks,
    p_kpis,
    p_conditions,
    v_plan_state,
    auth.uid()
  )
  on conflict (entry_id) do update set
    objective = excluded.objective,
    owner = excluded.owner,
    start_date = excluded.start_date,
    target_date = excluded.target_date,
    budget = excluded.budget,
    tasks = excluded.tasks,
    kpis = excluded.kpis,
    conditions = excluded.conditions,
    plan_state = excluded.plan_state,
    planned_by = auth.uid();

  update public.hub_entries
  set status = 'Progettazione'
  where id = p_entry_id;

  return jsonb_build_object(
    'entry_id', p_entry_id,
    'status', 'Progettazione',
    'plan_state', v_plan_state
  );
end;
$$;

create or replace function public.hub_advance_entry_to_test(
  p_entry_id uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_is_ceo boolean;
  v_current_status text;
  v_plan public.hub_project_plans%rowtype;
begin
  select exists (
    select 1
    from public.hub_profiles profile
    where profile.user_id = auth.uid()
      and profile.active = true
      and profile.role = 'ceo'
  ) into v_is_ceo;

  if not v_is_ceo then
    raise exception 'Solo il CEO può autorizzare il passaggio al Test.';
  end if;

  select status
  into v_current_status
  from public.hub_entries
  where id = p_entry_id
  for update;

  if v_current_status is null then
    raise exception 'Iniziativa non trovata.';
  end if;

  if v_current_status <> 'Progettazione' then
    raise exception 'L''iniziativa non è nello stato Progettazione.';
  end if;

  select *
  into v_plan
  from public.hub_project_plans
  where entry_id = p_entry_id
  for update;

  if v_plan.entry_id is null then
    raise exception 'Completa prima il piano di progettazione.';
  end if;

  if not public.hub_project_plan_is_ready(
    v_plan.tasks,
    v_plan.kpis,
    v_plan.conditions
  ) then
    raise exception 'Completa tutte le attività e le condizioni obbligatorie prima del Test.';
  end if;

  update public.hub_project_plans
  set plan_state = 'In test'
  where entry_id = p_entry_id;

  update public.hub_entries
  set status = 'Test'
  where id = p_entry_id;

  return jsonb_build_object(
    'entry_id', p_entry_id,
    'status', 'Test',
    'plan_state', 'In test'
  );
end;
$$;

revoke all
on function public.hub_project_plan_is_ready(jsonb, jsonb, jsonb)
from public;

grant execute
on function public.hub_project_plan_is_ready(jsonb, jsonb, jsonb)
to authenticated;

revoke all
on function public.hub_save_project_plan(uuid, text, text, date, date, numeric, jsonb, jsonb, jsonb)
from public;

grant execute
on function public.hub_save_project_plan(uuid, text, text, date, date, numeric, jsonb, jsonb, jsonb)
to authenticated;

revoke all
on function public.hub_advance_entry_to_test(uuid)
from public;

grant execute
on function public.hub_advance_entry_to_test(uuid)
to authenticated;

comment on table public.hub_project_plans is
  'Piano operativo, attività, KPI e condizioni della fase Progettazione ECCOMI HUB.';

commit;

select
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename = 'hub_project_plans';
