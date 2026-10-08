-- Supabase/PostgreSQL authoritative workspace, review, audit and reporting boundary.
-- Apply with a migration owner; clients receive SELECT and this RPC only.
begin;

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 160),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  role text not null check (role in ('owner','editor','reviewer','viewer')),
  joined_at timestamptz not null default now(),
  primary key (workspace_id,user_id)
);
create table public.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null check (email = lower(btrim(email)) and email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'),
  role text not null check (role in ('editor','reviewer','viewer')),
  invited_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_by uuid references auth.users(id),
  accepted_at timestamptz
);
create unique index workspace_pending_invitation on public.workspace_invitations(workspace_id,email) where accepted_at is null;

create table public.esg_records (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  kind text not null check (kind in ('knowledge','questions','kpis','dataRecords','reports','tasks','roadmap','topics','capa','requirements','assessmentAnswers','ghgEntries','evidence')),
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  version bigint not null default 1 check (version > 0),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id,id)
);
create index esg_records_workspace_kind on public.esg_records(workspace_id,kind,created_at desc);
create unique index esg_records_code on public.esg_records(workspace_id,kind,lower(btrim(data->>'code')))
  where kind in ('kpis','reports','tasks','roadmap','topics','capa','requirements','assessmentAnswers','evidence');
create unique index esg_data_natural_key on public.esg_records(workspace_id,
  (data->>'period'), (data->>'date'), lower(btrim(data->>'facility')), lower(btrim(data->>'kpiCode')), lower(btrim(data->>'source')))
  where kind = 'dataRecords';
create unique index esg_ghg_natural_key on public.esg_records(workspace_id,
  (data->>'period'), lower(btrim(data->>'facility')), (data->>'scope'), (data->>'scope2Method'), lower(btrim(data->>'category')), lower(btrim(data->>'source')))
  where kind = 'ghgEntries';
create index esg_records_period on public.esg_records(workspace_id,(data->>'period')) where kind in ('dataRecords','ghgEntries','reports');

create table public.period_locks (
  workspace_id uuid not null references public.workspaces(id),
  period text not null check (period ~ '^(19[0-9]{2}|[2-9][0-9]{3})(-(0[1-9]|1[0-2]|Q[1-4]))?$'),
  locked boolean not null,
  reason text not null default '',
  changed_by uuid not null references auth.users(id),
  changed_at timestamptz not null default now(),
  primary key (workspace_id,period)
);
create table public.report_snapshots (
  report_id uuid primary key,
  workspace_id uuid not null references public.workspaces(id),
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object'),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  foreign key (workspace_id,report_id) references public.esg_records(workspace_id,id)
);
create table public.audit_events (
  id bigint generated always as identity primary key,
  workspace_id uuid not null references public.workspaces(id),
  entity text not null,
  record_id text,
  operation text not null check (operation in ('INSERT','UPDATE','DELETE')),
  old_data jsonb,
  new_data jsonb,
  actor_id uuid not null references auth.users(id),
  occurred_at timestamptz not null default clock_timestamp(),
  transaction_id bigint not null default txid_current()
);
create index audit_events_workspace_time on public.audit_events(workspace_id,id desc);

-- This helper evaluates only the authenticated caller's membership, avoiding recursive RLS.
create function public.esg_member_role(p_workspace uuid) returns text
language sql stable security definer set search_path = pg_catalog, public
as $$ select m.role from public.workspace_members m where m.workspace_id = p_workspace and m.user_id = auth.uid() $$;
revoke all on function public.esg_member_role(uuid) from public, anon;
grant execute on function public.esg_member_role(uuid) to authenticated;

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.workspace_invitations enable row level security;
alter table public.esg_records enable row level security;
alter table public.period_locks enable row level security;
alter table public.report_snapshots enable row level security;
alter table public.audit_events enable row level security;
create policy workspaces_member_read on public.workspaces for select to authenticated using (public.esg_member_role(id) is not null);
create policy members_member_read on public.workspace_members for select to authenticated using (public.esg_member_role(workspace_id) is not null);
create policy invitations_owner_read on public.workspace_invitations for select to authenticated using (public.esg_member_role(workspace_id) = 'owner');
create policy records_member_read on public.esg_records for select to authenticated using (public.esg_member_role(workspace_id) is not null);
create policy periods_member_read on public.period_locks for select to authenticated using (public.esg_member_role(workspace_id) is not null);
create policy snapshots_member_read on public.report_snapshots for select to authenticated using (public.esg_member_role(workspace_id) is not null);
create policy audit_member_read on public.audit_events for select to authenticated using (public.esg_member_role(workspace_id) is not null);
revoke all on public.workspaces,public.workspace_members,public.workspace_invitations,public.esg_records,public.period_locks,public.report_snapshots,public.audit_events from public,anon,authenticated;
grant select on public.workspaces,public.workspace_members,public.workspace_invitations,public.esg_records,public.period_locks,public.report_snapshots,public.audit_events to authenticated;
revoke all on sequence public.audit_events_id_seq from public,anon,authenticated;

create function public.esg_immutable() returns trigger
language plpgsql set search_path = pg_catalog, public as $$
begin
  raise exception using errcode = '42501', message = 'Audit events and report snapshots are immutable';
end $$;
create trigger audit_immutable before update or delete on public.audit_events for each row execute function public.esg_immutable();
create trigger snapshot_immutable before update or delete on public.report_snapshots for each row execute function public.esg_immutable();
create function public.esg_final_report_immutable() returns trigger
language plpgsql set search_path = pg_catalog, public as $$
begin
  if old.kind = 'reports' and old.data->>'status' in ('approved','published') then
    if tg_op = 'DELETE' or old.data->>'status' = 'published' then
      raise exception using errcode = '42501', message = 'Approved and published reports are immutable';
    end if;
    if new.data->>'status' <> 'published' or
      (old.data - array['status','publishedAt']) is distinct from (new.data - array['status','publishedAt']) then
      raise exception using errcode = '42501', message = 'Only publishing the identical approved report is allowed';
    end if;
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end $$;
create trigger report_immutable before update or delete on public.esg_records for each row execute function public.esg_final_report_immutable();

create function public.esg_audit_change() returns trigger
language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_old jsonb; v_new jsonb; v_row jsonb; v_workspace uuid;
begin
  if tg_op <> 'INSERT' then v_old := to_jsonb(old); end if;
  if tg_op <> 'DELETE' then v_new := to_jsonb(new); end if;
  v_row := coalesce(v_new,v_old);
  v_workspace := case when tg_table_name = 'workspaces' then (v_row->>'id')::uuid else (v_row->>'workspace_id')::uuid end;
  insert into public.audit_events(workspace_id,entity,record_id,operation,old_data,new_data,actor_id)
    values (v_workspace,tg_table_name,coalesce(v_row->>'id',v_row->>'report_id',v_row->>'user_id',v_row->>'period'),tg_op,v_old,v_new,auth.uid());
  return case when tg_op = 'DELETE' then old else new end;
end $$;
create trigger audit_workspaces after insert or update or delete on public.workspaces for each row execute function public.esg_audit_change();
create trigger audit_members after insert or update or delete on public.workspace_members for each row execute function public.esg_audit_change();
create trigger audit_invitations after insert or update or delete on public.workspace_invitations for each row execute function public.esg_audit_change();
create trigger audit_records after insert or update or delete on public.esg_records for each row execute function public.esg_audit_change();
create trigger audit_periods after insert or update or delete on public.period_locks for each row execute function public.esg_audit_change();
create trigger audit_snapshots after insert on public.report_snapshots for each row execute function public.esg_audit_change();

create function public.esg_period_contains(p_parent text,p_child text) returns boolean
language plpgsql immutable set search_path = pg_catalog, public as $$
begin
  if p_parent = p_child or (length(p_parent)=4 and left(p_child,4)=p_parent) then return true; end if;
  if p_parent ~ '^[0-9]{4}-Q[1-4]$' and p_child ~ '^[0-9]{4}-(0[1-9]|1[0-2])$' and left(p_parent,4)=left(p_child,4) then
    return substring(p_child from 6 for 2)::integer between (right(p_parent,1)::integer-1)*3+1 and right(p_parent,1)::integer*3;
  end if;
  return false;
end
$$;
create function public.esg_period_is_locked(p_workspace uuid,p_period text) returns boolean
language sql stable set search_path = pg_catalog, public as $$
  select exists(select 1 from public.period_locks l where l.workspace_id = p_workspace and l.locked and
    (public.esg_period_contains(l.period,p_period) or public.esg_period_contains(p_period,l.period)))
$$;
create function public.esg_record_json(p_row public.esg_records) returns jsonb
language sql stable set search_path = pg_catalog, public as $$
  select p_row.data || case when p_row.kind = 'dataRecords' then jsonb_build_object('locked',public.esg_period_is_locked(p_row.workspace_id,p_row.data->>'period')) else '{}'::jsonb end
    || case when p_row.kind in ('dataRecords','ghgEntries') then jsonb_build_object('_locked',public.esg_period_is_locked(p_row.workspace_id,p_row.data->>'period')) else '{}'::jsonb end
    || jsonb_build_object('_id',p_row.id,'_version',p_row.version,'_createdBy',p_row.created_by,
      '_creationTime',extract(epoch from p_row.created_at)*1000,'_updatedAt',p_row.updated_at)
$$;

-- Recursively reject negative/nonfinite numbers, including otherwise unrecognized fields.
create function public.esg_validate_numbers(p_value jsonb) returns void
language plpgsql set search_path = pg_catalog, public as $$
declare v_item jsonb; v_number numeric;
begin
  if jsonb_typeof(p_value) = 'number' then
    v_number := (p_value #>> '{}')::numeric;
    if v_number < 0 or v_number > 1.7976931348623157e308 or v_number::text in ('NaN','Infinity','-Infinity') then raise exception 'Numeric values must be finite and nonnegative'; end if;
  elsif jsonb_typeof(p_value) = 'array' then
    for v_item in select value from jsonb_array_elements(p_value) loop perform public.esg_validate_numbers(v_item); end loop;
  elsif jsonb_typeof(p_value) = 'object' then
    for v_item in select value from jsonb_each(p_value) loop perform public.esg_validate_numbers(v_item); end loop;
  end if;
end $$;

create function public.esg_evidence_referenced(p_workspace uuid,p_code text) returns boolean
language sql stable set search_path = pg_catalog, public as $$
  select exists(select 1 from public.esg_records r where r.workspace_id=p_workspace and r.kind='dataRecords' and lower(btrim(r.data->>'evidenceCode'))=lower(btrim(p_code))) or
    exists(select 1 from public.report_snapshots s cross join lateral jsonb_array_elements(s.snapshot->'records') as r(data)
      where s.workspace_id=p_workspace and lower(btrim(r.data->>'evidenceCode'))=lower(btrim(p_code)))
$$;

create function public.esg_validate_data(p_kind text,p_data jsonb,p_workspace uuid,p_id uuid default null) returns jsonb
language plpgsql set search_path = pg_catalog, public as $$
declare v_data jsonb; v_fields text[]; v_key text; v_kpi jsonb; v_required_numeric text[]; v_period text;
begin
  if p_data is null or jsonb_typeof(p_data) <> 'object' then raise exception 'data must be an object'; end if;
  perform public.esg_validate_numbers(p_data);
  -- Supplied metadata never confers approval or changes identity/version/lock ownership.
  v_data := p_data - array['_id','_creationTime','_version','_createdBy','_updatedAt','_locked','reviewState','reviewStatus','reviewedBy','reviewedAt','reviewReason','snapshot','approvedBy','checkedBy','locked','publishedAt','ratioMultiplier'];
  v_fields := case p_kind
    when 'knowledge' then array['title','category','summary','content','tags','source']
    when 'questions' then array['question','answer','category','askedBy','status']
    when 'kpis' then array['code','name','pillar','unit','rule','owner','frequency','target','note']
    when 'dataRecords' then array['period','date','facility','department','kpiCode','source','unit','scope','status','evidenceCode','preparedBy','note']
    when 'reports' then array['code','title','type','period','status','summary','kpiSummary','comparison','risks','missingData','projects','decisions','preparedBy']
    when 'tasks' then array['code','department','title','frequency','evidence','owner','backup','status','due','note']
    when 'roadmap' then array['code','quarter','title','description','leads','acceptance','status','note']
    when 'topics' then array['code','name','description','owner','stakeholders','evidence','status','note']
    when 'capa' then array['code','title','source','severity','owner','due','status','rootCause','action','evidence','note']
    when 'requirements' then array['code','layer','name','clause','deadline','owner','evidence','status','note']
    when 'assessmentAnswers' then array['code','answer','note']
    when 'ghgEntries' then array['period','facility','scope','scope2Method','category','source','unit','factorSource','status','note']
    when 'evidence' then array['code','title','sourceUrl','description','sha256','filePath','fileName','mimeType']
    else null end;
  if v_fields is null then raise exception 'Unknown record kind'; end if;
  foreach v_key in array v_fields loop
    if jsonb_typeof(v_data->v_key) is distinct from 'string' then raise exception 'Required text field: %',v_key; end if;
  end loop;
  foreach v_key in array array['code','kpiCode','period','unit','date','facility','source','category'] loop
    if jsonb_typeof(v_data->v_key)='string' then v_data:=jsonb_set(v_data,array[v_key],to_jsonb(btrim(v_data->>v_key))); end if;
  end loop;
  if v_data ? 'code' then
    if length(btrim(v_data->>'code')) not between 1 and 160 then raise exception 'code is required'; end if;
    v_data := jsonb_set(v_data,'{code}',to_jsonb(btrim(v_data->>'code')));
  end if;
  if p_kind in ('dataRecords','ghgEntries','reports') then
    v_period := btrim(v_data->>'period');
    if v_period !~ '^(19[0-9]{2}|[2-9][0-9]{3})(-(0[1-9]|1[0-2]|Q[1-4]))?$' then raise exception 'period must be YYYY-MM, YYYY-Q1..Q4 or YYYY (1900..9999)'; end if;
    v_data := jsonb_set(v_data,'{period}',to_jsonb(v_period));
  end if;
  if p_kind = 'knowledge' and btrim(v_data->>'title') = '' then raise exception 'title is required'; end if;
  if p_kind = 'questions' then
    if v_data->>'status' not in ('open','answered') then raise exception 'Invalid question status'; end if;
    if jsonb_typeof(v_data->'aiGenerated') is distinct from 'boolean' or jsonb_typeof(v_data->'createdAt') is distinct from 'number' then raise exception 'Invalid question metadata'; end if;
  elsif p_kind = 'kpis' then
    if v_data->>'pillar' not in ('E','S','G') or btrim(v_data->>'unit') = '' or btrim(v_data->>'name')='' then raise exception 'Invalid KPI pillar, name or unit'; end if;
    if not (v_data ? 'aggregation') then v_data := v_data || '{"aggregation":"manual"}'::jsonb; end if;
    if jsonb_typeof(v_data->'aggregation') is distinct from 'string' or v_data->>'aggregation' not in ('sum','last','ratio','manual') then raise exception 'Invalid KPI aggregation'; end if;
    if v_data->>'aggregation'='sum' and (v_data->>'unit' ~ '[/%·]|[.]{3}' or lower(v_data->>'unit') ~ '(^|[[:space:]])(per|và|and)([[:space:]]|$)') then raise exception 'Composite, percentage and intensity units cannot be summed'; end if;
    if p_id is not null and exists(select 1 from public.esg_records r where r.workspace_id = p_workspace and r.kind = 'dataRecords' and
      lower(r.data->>'kpiCode') = (select lower(x.data->>'code') from public.esg_records x where x.id = p_id and x.workspace_id = p_workspace) and
      ((v_data->>'code') is distinct from (select x.data->>'code' from public.esg_records x where x.id = p_id) or (v_data->>'unit') is distinct from r.data->>'unit' or
       (v_data->>'aggregation') is distinct from (select x.data->>'aggregation' from public.esg_records x where x.id=p_id)))
      then raise exception 'Referenced KPI code, unit and aggregation cannot change'; end if;
  elsif p_kind = 'dataRecords' then
    if v_data->>'status' not in ('measured','estimated','missing','na') then raise exception 'Invalid data status'; end if;
    if not (v_data ? 'value') or jsonb_typeof(v_data->'value') not in ('number','null') then raise exception 'value must be a nonnegative number or null'; end if;
    if v_data->>'status' in ('measured','estimated') and jsonb_typeof(v_data->'value') <> 'number' then raise exception 'Measured or estimated data requires a value'; end if;
    if v_data->>'status' in ('missing','na') and jsonb_typeof(v_data->'value') <> 'null' then raise exception 'Missing or not applicable data must have a null value'; end if;
    foreach v_key in array array['numerator','denominator'] loop
      if v_data ? v_key and jsonb_typeof(v_data->v_key) not in ('number','null') then raise exception '% must be a nonnegative number or null',v_key; end if;
    end loop;
    if btrim(v_data->>'facility') = '' then raise exception 'Facility is required'; end if;
    if v_data->>'status' in ('measured','estimated') and (btrim(v_data->>'source')='' or btrim(v_data->>'evidenceCode')='') then raise exception 'Measured and estimated records require source and evidenceCode'; end if;
    if v_data->>'status' in ('estimated','na') and btrim(v_data->>'note')='' then raise exception 'Estimated and not applicable records require an explanatory note'; end if;
    if v_data->>'date' !~ '^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$' or to_char((v_data->>'date')::date,'YYYY-MM-DD') <> v_data->>'date' then raise exception 'Invalid date'; end if;
    if not public.esg_period_contains(v_period,left(v_data->>'date',7)) then raise exception 'Date must fall within period'; end if;
    select r.data into v_kpi from public.esg_records r where r.workspace_id = p_workspace and r.kind = 'kpis' and lower(r.data->>'code') = lower(btrim(v_data->>'kpiCode'));
    if v_kpi is null then raise exception 'KPI does not exist in this workspace'; end if;
    if v_data->>'unit' is distinct from v_kpi->>'unit' then raise exception 'Data unit must exactly match KPI unit'; end if;
    if v_kpi->>'aggregation'='ratio' and v_data->>'status' in ('measured','estimated') then
      if jsonb_typeof(v_data->'numerator') is distinct from 'number' or jsonb_typeof(v_data->'denominator') is distinct from 'number' or (v_data->>'denominator')::numeric <= 0 then raise exception 'Ratio data requires numerator and positive denominator'; end if;
      if left(btrim(v_kpi->>'unit'),1)='%' and (v_data->>'numerator')::numeric > (v_data->>'denominator')::numeric then raise exception 'Percentage numerator cannot exceed denominator'; end if;
    end if;
    v_data := jsonb_set(v_data,'{kpiCode}',v_kpi->'code') || jsonb_build_object('reviewState','pending','reviewedBy','','reviewedAt',0,'reviewReason','','approvedBy','','checkedBy','','locked',false);
  elsif p_kind = 'reports' then
    if v_data->>'type' not in ('monthly','quarterly','annual','other') or v_data->>'status' not in ('draft','review','approved','published') then raise exception 'Invalid report type or status'; end if;
    v_data := v_data || jsonb_build_object('approvedBy','','publishedAt','');
  elsif p_kind = 'tasks' and v_data->>'status' not in ('todo','doing','done','blocked') then raise exception 'Invalid task status';
  elsif p_kind = 'roadmap' and v_data->>'status' not in ('planned','doing','done','late') then raise exception 'Invalid roadmap status';
  elsif p_kind = 'topics' then
    if v_data->>'status' not in ('candidate','material','not_material') then raise exception 'Invalid topic status'; end if;
    v_required_numeric := array['severity','scopeAffected','remediability','likelihood'];
  elsif p_kind = 'capa' then
    if v_data->>'severity' not in ('low','medium','high','critical') or v_data->>'status' not in ('open','in_progress','verified','closed') then raise exception 'Invalid CAPA severity or status'; end if;
  elsif p_kind = 'requirements' then
    if v_data->>'layer' not in ('law','brand','framework') or v_data->>'status' not in ('to_check','applicable','compliant','gap','not_applicable') then raise exception 'Invalid requirement layer or status'; end if;
  elsif p_kind = 'assessmentAnswers' and v_data->>'answer' not in ('yes','partial','no','unknown') then raise exception 'Invalid assessment answer';
  elsif p_kind = 'ghgEntries' then
    if v_data->>'scope' not in ('1','2','3') or v_data->>'status' not in ('measured','estimated') then raise exception 'Invalid GHG scope or status'; end if;
    if btrim(v_data->>'facility')='' then raise exception 'GHG facility is required'; end if;
    if (v_data->>'scope'='2' and v_data->>'scope2Method' not in ('location','market')) or (v_data->>'scope'<>'2' and v_data->>'scope2Method'<>'not_applicable') then raise exception 'Scope 2 requires location or market method; scopes 1 and 3 require not_applicable'; end if;
    if btrim(v_data->>'factorSource') = '' or btrim(v_data->>'category') = '' or btrim(v_data->>'source') = '' or btrim(v_data->>'unit') = '' then raise exception 'GHG category, source, unit and factorSource are required'; end if;
    v_required_numeric := array['activity','factor','tco2e'];
  elsif p_kind = 'evidence' then
    if btrim(v_data->>'title') = '' then raise exception 'Evidence title is required'; end if;
    if v_data->>'sourceUrl' <> '' and v_data->>'sourceUrl' !~* '^https://[A-Za-z0-9][A-Za-z0-9.-]*(:[0-9]{1,5})?([/?#][^[:space:]]*)?$' then raise exception 'Evidence source must be a valid HTTPS URL'; end if;
    if v_data->>'sourceUrl' = '' and v_data->>'filePath' = '' then raise exception 'Evidence requires an HTTPS source or uploaded file'; end if;
    if jsonb_typeof(v_data->'size') is distinct from 'number' or (v_data->>'size')::numeric > 10485760 then raise exception 'Evidence size must not exceed 10 MiB'; end if;
    if v_data->>'filePath' <> '' then
      if v_data->>'filePath' !~ ('^'||p_workspace::text||'/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$') then raise exception 'Evidence file must belong to this workspace'; end if;
      if not exists(select 1 from storage.objects o where o.bucket_id='esg-evidence' and o.name=v_data->>'filePath') then raise exception 'Evidence file is not uploaded'; end if;
      if v_data->>'sha256' !~ '^[0-9a-fA-F]{64}$' then raise exception 'Uploaded evidence requires a SHA-256 checksum'; end if;
      if (v_data->>'size')::numeric <= 0 or v_data->>'mimeType' not in ('application/pdf','image/jpeg','image/png','image/webp','text/csv','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') then raise exception 'Invalid evidence file size or MIME type'; end if;
    elsif v_data->>'sha256' <> '' and v_data->>'sha256' !~ '^[0-9a-fA-F]{64}$' then raise exception 'Invalid SHA-256 checksum'; end if;
    if p_id is not null and public.esg_evidence_referenced(p_workspace,(select e.data->>'code' from public.esg_records e where e.id=p_id)) then
      if v_data is distinct from (select e.data from public.esg_records e where e.id=p_id) then raise exception 'Referenced evidence is immutable'; end if;
    end if;
  end if;
  if v_required_numeric is not null then
    foreach v_key in array v_required_numeric loop
      if jsonb_typeof(v_data->v_key) is distinct from 'number' then raise exception 'Required numeric field: %',v_key; end if;
    end loop;
  end if;
  if p_kind = 'ghgEntries' then
    -- Exact decimal scaling: kgCO2e / 1000, with no persisted display rounding.
    v_data := v_data || jsonb_build_object('tco2e',(v_data->>'activity')::numeric * (v_data->>'factor')::numeric * 0.001);
    perform public.esg_validate_numbers(v_data->'tco2e');
  end if;
  return v_data;
end $$;

-- One transaction-wide lock serializes workspace mutations, including locks/reviews/finalization.
-- Expected versions still reject a stale form or batch rather than silently overwriting it.
create function public.esg_mutate(action text,payload jsonb default '{}'::jsonb,workspace_id uuid default null) returns jsonb
language plpgsql security definer set search_path = pg_catalog, public as $$
#variable_conflict use_column
declare
  v_actor uuid := auth.uid(); v_email text := lower(btrim(auth.jwt()->>'email')); v_workspace uuid := workspace_id;
  v_role text; v_kind text; v_op text; v_row public.esg_records; v_id uuid; v_data jsonb; v_item jsonb;
  v_items jsonb; v_old_period text; v_period text; v_expected bigint; v_inserted integer := 0; v_updated integer := 0;
  v_count integer := 0; v_result jsonb; v_invitation public.workspace_invitations; v_name text;
  v_locked boolean; v_snapshot jsonb; v_decision text; v_reason text;
begin
  if v_actor is null then raise exception using errcode = '42501', message = 'Authentication required'; end if;
  if payload is null or jsonb_typeof(payload) <> 'object' then raise exception 'payload must be an object'; end if;
  if action = 'createWorkspace' then
    v_name := btrim(payload->>'name');
    if v_name is null or length(v_name) not between 1 and 160 then raise exception 'Workspace name is required'; end if;
    insert into public.workspaces(name,created_by) values(v_name,v_actor) returning id into v_workspace;
    insert into public.workspace_members(workspace_id,user_id,role) values(v_workspace,v_actor,'owner');
    select to_jsonb(w) || jsonb_build_object('role','owner') into v_result from public.workspaces w where w.id = v_workspace;
    return v_result;
  elsif action = 'listWorkspaces' then
    return coalesce((select jsonb_agg(to_jsonb(w) || jsonb_build_object('role',m.role) order by w.created_at) from public.workspaces w join public.workspace_members m on m.workspace_id=w.id where m.user_id=v_actor),'[]'::jsonb);
  elsif action = 'listInvitations' and v_workspace is null then
    return coalesce((select jsonb_agg(to_jsonb(i)||jsonb_build_object('workspace_name',w.name) order by i.created_at desc)
      from public.workspace_invitations i join public.workspaces w on w.id=i.workspace_id
      where i.email=v_email and i.accepted_at is null and i.expires_at>now()),'[]'::jsonb);
  elsif action = 'acceptInvitation' then
    select * into v_invitation from public.workspace_invitations i where i.id = (payload->>'id')::uuid;
    if not found or v_email is null or v_email = '' or v_invitation.email is distinct from v_email then raise exception using errcode = '42501', message = 'Invitation must match authenticated email'; end if;
    v_workspace := v_invitation.workspace_id;
  end if;
  if v_workspace is null then raise exception 'workspace_id is required'; end if;
  -- Keep locks across the entire atomic batch and all its audit/snapshot writes.
  perform pg_advisory_xact_lock(hashtextextended(v_workspace::text,0));
  if action = 'acceptInvitation' then
    select * into v_invitation from public.workspace_invitations i where i.id = (payload->>'id')::uuid for update;
    if v_invitation.accepted_at is not null or v_invitation.expires_at <= now() or v_invitation.email is distinct from v_email then raise exception 'Invitation expired, accepted or mismatched'; end if;
    if exists(select 1 from public.workspace_members m where m.workspace_id=v_workspace and m.user_id=v_actor) then raise exception 'Already a workspace member'; end if;
    insert into public.workspace_members(workspace_id,user_id,role) values(v_workspace,v_actor,v_invitation.role);
    update public.workspace_invitations set accepted_by=v_actor,accepted_at=now() where id=v_invitation.id;
    return jsonb_build_object('workspace_id',v_workspace,'role',v_invitation.role);
  end if;
  v_role := public.esg_member_role(v_workspace);
  if v_role is null then raise exception using errcode = '42501', message = 'Workspace membership required'; end if;
  if action = 'listMembers' then
    return coalesce((select jsonb_agg(to_jsonb(m) order by m.joined_at) from public.workspace_members m where m.workspace_id=v_workspace),'[]'::jsonb);
  elsif action = 'listInvitations' then
    if v_role <> 'owner' then raise exception using errcode = '42501', message = 'Only owners can read invitations'; end if;
    return coalesce((select jsonb_agg(to_jsonb(i) order by i.created_at desc) from public.workspace_invitations i where i.workspace_id=v_workspace),'[]'::jsonb);
  elsif action = 'inviteMember' then
    if v_role <> 'owner' then raise exception using errcode = '42501', message = 'Only owners can invite members'; end if;
    if payload->>'role' is null or payload->>'role' not in ('editor','reviewer','viewer') then raise exception 'Invalid invitation role'; end if;
    -- Renew only an existing, unaccepted invitation. Accepting never changes an existing role.
    insert into public.workspace_invitations(workspace_id,email,role,invited_by)
      values(v_workspace,lower(btrim(payload->>'email')),payload->>'role',v_actor)
      on conflict (workspace_id,email) where accepted_at is null
      do update set role=excluded.role,invited_by=excluded.invited_by,expires_at=now()+interval '7 days',created_at=now()
      returning to_jsonb(workspace_invitations) into v_result;
    return v_result;
  elsif action = 'listPeriods' then
    return coalesce((select jsonb_agg(to_jsonb(l) order by l.period desc) from public.period_locks l where l.workspace_id=v_workspace),'[]'::jsonb);
  elsif action = 'listAudit' then
    return coalesce((select jsonb_agg(to_jsonb(a) order by a.id desc) from public.audit_events a where a.workspace_id=v_workspace),'[]'::jsonb);
  elsif action = 'exportWorkspace' then
    return jsonb_build_object('version',1,'workspace',(select to_jsonb(w) from public.workspaces w where w.id=v_workspace),'exportedAt',now(),
      'records',coalesce((select jsonb_agg(jsonb_build_object('kind',r.kind,'record',public.esg_record_json(r)) order by r.created_at,r.id) from public.esg_records r where r.workspace_id=v_workspace),'[]'::jsonb),
      'periods',coalesce((select jsonb_agg(to_jsonb(l)) from public.period_locks l where l.workspace_id=v_workspace),'[]'::jsonb),
      'snapshots',coalesce((select jsonb_agg(to_jsonb(s)) from public.report_snapshots s where s.workspace_id=v_workspace),'[]'::jsonb),
      'audit',coalesce((select jsonb_agg(to_jsonb(a) order by a.id) from public.audit_events a where a.workspace_id=v_workspace),'[]'::jsonb));
  elsif action = 'seedDefaults' then
    if v_role not in ('owner','editor') then raise exception using errcode='42501',message='Edit permission required'; end if;
    if jsonb_typeof(payload->'tables') is distinct from 'object' then raise exception 'Seed tables must be an object'; end if;
    if exists(select 1 from jsonb_object_keys(payload->'tables') k where k not in ('kpis','tasks','roadmap','topics','requirements')) then raise exception 'Unsupported seed table'; end if;
    v_result:='{}'::jsonb;v_count:=0;
    foreach v_kind in array array['kpis','tasks','roadmap','topics','requirements'] loop
      v_items:=coalesce(payload->'tables'->v_kind,'[]'::jsonb);
      if jsonb_typeof(v_items)<>'array' then raise exception 'Seed rows must be arrays'; end if;
      v_count:=v_count+jsonb_array_length(v_items);
      if v_count>200 then raise exception 'Seed batch must not exceed 200 rows'; end if;
      v_inserted:=0;
      for v_item in select value from jsonb_array_elements(v_items) loop
        v_data:=public.esg_validate_data(v_kind,v_item,v_workspace);
        if not exists(select 1 from public.esg_records r where r.workspace_id=v_workspace and r.kind=v_kind and lower(r.data->>'code')=lower(v_data->>'code')) then
          insert into public.esg_records(workspace_id,kind,data,created_by) values(v_workspace,v_kind,v_data,v_actor);
          v_inserted:=v_inserted+1;
        end if;
      end loop;
      v_result:=v_result||jsonb_build_object(v_kind,v_inserted);
    end loop;
    return v_result;
  elsif action = 'lockPeriod' then
    if v_role not in ('owner','reviewer') then raise exception using errcode = '42501', message = 'Review permission required'; end if;
    v_period := btrim(payload->>'period');
    if v_period is null or v_period !~ '^(19[0-9]{2}|[2-9][0-9]{3})(-(0[1-9]|1[0-2]|Q[1-4]))?$' then raise exception 'period must be YYYY-MM, YYYY-Q1..Q4 or YYYY (1900..9999)'; end if;
    if jsonb_typeof(payload->'locked') is distinct from 'boolean' then raise exception 'locked must be boolean'; end if;
    v_locked := (payload->>'locked')::boolean; v_reason := btrim(coalesce(payload->>'reason',''));
    if v_reason = '' then raise exception 'Locking or unlocking requires a reason'; end if;
    if v_locked and (not exists(select 1 from public.esg_records r where r.workspace_id=v_workspace and r.kind='dataRecords' and public.esg_period_contains(v_period,r.data->>'period')) or
      exists(select 1 from public.esg_records r where r.workspace_id=v_workspace and r.kind='dataRecords' and public.esg_period_contains(v_period,r.data->>'period') and r.data->>'reviewState' is distinct from 'approved')) then raise exception 'Only a nonempty fully approved period can be locked'; end if;
    insert into public.period_locks(workspace_id,period,locked,reason,changed_by) values(v_workspace,v_period,v_locked,v_reason,v_actor)
      on conflict (workspace_id,period) do update set locked=excluded.locked,reason=excluded.reason,changed_by=excluded.changed_by,changed_at=now();
    select count(*) into v_count from public.esg_records r where r.workspace_id=v_workspace and r.kind='dataRecords' and public.esg_period_contains(v_period,r.data->>'period');
    return to_jsonb(v_count);
  elsif action = 'reviewDataRecord' then
    if v_role not in ('owner','reviewer') then raise exception using errcode = '42501', message = 'Review permission required'; end if;
    select * into v_row from public.esg_records r where r.workspace_id=v_workspace and r.id=(payload->>'id')::uuid and r.kind='dataRecords' for update;
    if not found then raise exception 'Data record not found in workspace'; end if;
    if v_row.created_by=v_actor then raise exception using errcode = '42501', message = 'Cannot review your own data record'; end if;
    if not (payload ? 'expectedVersion') or jsonb_typeof(payload->'expectedVersion') <> 'number' or (payload->>'expectedVersion')::numeric <> v_row.version then raise exception using errcode = '40001',message='Record version conflict'; end if;
    if public.esg_period_is_locked(v_workspace,v_row.data->>'period') then raise exception 'Period is locked'; end if;
    v_decision := payload->>'decision'; v_reason := btrim(coalesce(payload->>'reason',''));
    if v_decision is null or v_decision not in ('approved','rejected') then raise exception 'Review decision must be approved or rejected'; end if;
    if v_reason='' then raise exception 'Review requires a reason'; end if;
    if v_decision='approved' and v_row.data->>'status' in ('measured','estimated') and not exists(
      select 1 from public.esg_records e where e.workspace_id=v_workspace and e.kind='evidence' and lower(e.data->>'code')=lower(btrim(v_row.data->>'evidenceCode')) and
      (e.data->>'sourceUrl' ~* '^https://[A-Za-z0-9][A-Za-z0-9.-]*(:[0-9]{1,5})?([/?#][^[:space:]]*)?$' or
        (e.data->>'filePath' like v_workspace::text||'/%' and exists(select 1 from storage.objects o where o.bucket_id='esg-evidence' and o.name=e.data->>'filePath')))
    ) then raise exception 'Approval of measured or estimated data requires registered evidence'; end if;
    update public.esg_records set data=data || jsonb_build_object('reviewState',v_decision,'reviewedBy',v_actor,'reviewedAt',extract(epoch from now())*1000,'reviewReason',v_reason,'checkedBy',v_actor::text,'approvedBy',case when v_decision='approved' then v_actor::text else '' end),version=version+1,updated_at=now() where id=v_row.id returning * into v_row;
    return public.esg_record_json(v_row);
  end if;

  -- Map the old app API to explicit kinds; no caller-provided table name or dynamic SQL.
  select x.kind,x.op into v_kind,v_op from (values
    ('knowledge','Knowledge','Knowledge'),('questions','Questions','Question'),('kpis','Kpis','Kpi'),
    ('dataRecords','DataRecords','DataRecord'),('reports','Reports','Report'),('tasks','Tasks','Task'),
    ('roadmap','Roadmap','Roadmap'),('topics','Topics','Topic'),('capa','Capa','Capa'),
    ('requirements','Requirements','Requirement'),('assessmentAnswers','Assessment','Assessment'),('ghgEntries','Ghg','Ghg'),('evidence','Evidence','Evidence')
  ) as m(kind,plural,singular) cross join lateral (values
    (m.kind,'list', 'list'||m.plural),(m.kind,'upsert','upsert'||m.singular),(m.kind,'remove','remove'||m.singular),
    (m.kind,'removeMany','removeMany'||m.plural),(m.kind,'import','import'||m.plural)
  ) as x(kind,op,name) where x.name=action;
  if action='dataRecordsByPeriod' then v_kind:='dataRecords';v_op:='list';
    v_period:=btrim(payload->>'period');
    if v_period is null or v_period !~ '^(19[0-9]{2}|[2-9][0-9]{3})(-(0[1-9]|1[0-2]|Q[1-4]))?$' then raise exception 'period must be YYYY-MM, YYYY-Q1..Q4 or YYYY (1900..9999)'; end if;
  end if;
  if v_kind is null then raise exception 'Unknown action: %',action; end if;
  if v_op='list' then
    return coalesce((select jsonb_agg(public.esg_record_json(r) order by r.created_at desc,r.id) from public.esg_records r where r.workspace_id=v_workspace and r.kind=v_kind and (v_period is null or public.esg_period_contains(v_period,r.data->>'period'))),'[]'::jsonb);
  end if;
  if v_role not in ('owner','editor') and not (v_role='reviewer' and v_kind='reports' and v_op='upsert') then raise exception using errcode='42501',message='Edit permission required'; end if;
  if v_op in ('upsert','remove') then v_items:=jsonb_build_array(payload);
  elsif v_op='import' then
    v_items:=payload->'rows';
  elsif v_op='removeMany' then
    if payload ? 'rows' then v_items:=payload->'rows';
    elsif jsonb_typeof(payload->'ids')='array' then
      select coalesce(jsonb_agg(jsonb_build_object('id',i.value,'expectedVersion',payload->'expectedVersions'->>(i.value#>>'{}'))),'[]'::jsonb) into v_items from jsonb_array_elements(payload->'ids') i;
    end if;
  end if;
  if v_items is null or jsonb_typeof(v_items)<>'array' or jsonb_array_length(v_items)>200 then raise exception 'Batch must be an array of at most 200 rows'; end if;
  for v_item in select value from jsonb_array_elements(v_items) loop
    if jsonb_typeof(v_item)<>'object' then raise exception 'Batch row must be an object'; end if;
    v_id:=null; v_row:=null; v_expected:=null;
    if nullif(v_item->>'id','') is not null then
      v_id:=(v_item->>'id')::uuid;
      select * into v_row from public.esg_records r where r.workspace_id=v_workspace and r.id=v_id and r.kind=v_kind for update;
      if not found then raise exception 'Record not found in workspace'; end if;
      if not (v_item ? 'expectedVersion') or (v_item->>'expectedVersion') is null or (v_item->>'expectedVersion') !~ '^[1-9][0-9]*$' then raise exception using errcode='40001',message='expectedVersion is required'; end if;
      v_expected:=(v_item->>'expectedVersion')::bigint;
      if v_expected<>v_row.version then raise exception using errcode='40001',message='Record version conflict'; end if;
      if v_kind='reports' and v_row.data->>'status' in ('approved','published') and not (v_op='upsert' and v_row.data->>'status'='approved' and v_item->'data'->>'status'='published') then raise exception 'Approved and published reports are immutable'; end if;
      if v_kind in ('dataRecords','ghgEntries') and public.esg_period_is_locked(v_workspace,v_row.data->>'period') then raise exception 'Period is locked'; end if;
    elsif v_op in ('remove','removeMany') then raise exception 'id and expectedVersion are required';
    end if;
    if v_op in ('remove','removeMany') then
      if v_kind='kpis' and exists(select 1 from public.esg_records r where r.workspace_id=v_workspace and r.kind='dataRecords' and lower(r.data->>'kpiCode')=lower(v_row.data->>'code')) then raise exception 'Cannot delete a referenced KPI'; end if;
      if v_kind='evidence' and public.esg_evidence_referenced(v_workspace,v_row.data->>'code') then raise exception 'Cannot delete evidence referenced by data or an immutable report snapshot'; end if;
      delete from public.esg_records where id=v_id and workspace_id=v_workspace;
      v_count:=v_count+1;
      continue;
    end if;
    v_data:=public.esg_validate_data(v_kind,v_item->'data',v_workspace,v_id);
    if v_kind in ('dataRecords','reports') then v_data:=v_data||jsonb_build_object('preparedBy',coalesce(v_row.created_by,v_actor)); end if;
    if v_kind='questions' then v_data:=v_data||jsonb_build_object('askedBy',coalesce(v_row.created_by,v_actor),'createdAt',coalesce(v_row.data->'createdAt',to_jsonb(extract(epoch from now())*1000))); end if;
    if v_role='reviewer' then
      if v_id is null or v_data->>'status' not in ('approved','published') or
        (v_data - array['status','approvedBy','publishedAt','snapshot']) is distinct from (v_row.data - array['status','approvedBy','publishedAt','snapshot']) then
        raise exception using errcode='42501',message='Reviewer may only finalize an existing unchanged report';
      end if;
    end if;
    if v_kind in ('dataRecords','ghgEntries') and public.esg_period_is_locked(v_workspace,v_data->>'period') then raise exception 'Period is locked'; end if;
    v_snapshot:=null;
    if v_kind='reports' and v_data->>'status' in ('approved','published') then
      -- Finalization is a separate permission from editing. Owners may finalize through CRUD;
      -- reviewers may change only status on an otherwise unchanged existing report.
      if v_role not in ('owner','reviewer') then raise exception using errcode='42501',message='Report approval requires reviewer or owner'; end if;
      v_period:=v_data->>'period';
      if not exists(select 1 from public.period_locks l where l.workspace_id=v_workspace and l.period=v_period and l.locked) then raise exception 'Report period must be authoritatively locked'; end if;
      if not exists(select 1 from public.esg_records r where r.workspace_id=v_workspace and r.kind='dataRecords' and public.esg_period_contains(v_period,r.data->>'period')) then raise exception 'Report requires period data'; end if;
      if exists(select 1 from public.esg_records r where r.workspace_id=v_workspace and r.kind='dataRecords' and public.esg_period_contains(v_period,r.data->>'period') and r.data->>'reviewState' is distinct from 'approved') then raise exception 'All period data records must be approved'; end if;
      if exists(select 1 from public.esg_records k where k.workspace_id=v_workspace and k.kind='kpis' and not exists(
        select 1 from public.esg_records r where r.workspace_id=v_workspace and r.kind='dataRecords' and r.data->>'kpiCode'=k.data->>'code' and public.esg_period_contains(v_period,r.data->>'period')))
        then raise exception 'Every defined KPI needs period data or an approved not-applicable decision'; end if;
      if exists(select 1 from public.esg_records k cross join generate_series(1,12) as m(month)
        where k.workspace_id=v_workspace and k.kind='kpis' and lower(k.data->>'frequency') ~ 'hằng tháng|hàng tháng|monthly' and
          public.esg_period_contains(v_period,left(v_period,4)||'-'||lpad(m.month::text,2,'0')) and not exists(
            select 1 from public.esg_records r where r.workspace_id=v_workspace and r.kind='dataRecords' and r.data->>'kpiCode'=k.data->>'code' and
              public.esg_period_contains(v_period,r.data->>'period') and public.esg_period_contains(r.data->>'period',left(v_period,4)||'-'||lpad(m.month::text,2,'0')) and
              r.data->>'reviewState'='approved' and r.data->>'status'<>'missing')) then raise exception 'Monthly KPI coverage is incomplete for this report period'; end if;
      if length(v_period)=4 and exists(select 1 from public.esg_records k cross join generate_series(1,4) as q(quarter)
        where k.workspace_id=v_workspace and k.kind='kpis' and lower(k.data->>'frequency') ~ 'hằng quý|hàng quý|quarterly' and not exists(
          select 1 from public.esg_records r where r.workspace_id=v_workspace and r.kind='dataRecords' and r.data->>'kpiCode'=k.data->>'code' and
            public.esg_period_contains(v_period,r.data->>'period') and public.esg_period_contains(r.data->>'period',v_period||'-Q'||q.quarter::text) and
            r.data->>'reviewState'='approved' and r.data->>'status'<>'missing')) then raise exception 'Quarterly KPI coverage is incomplete for this annual report'; end if;
      if exists(select 1 from public.esg_records r left join public.esg_records k on k.workspace_id=r.workspace_id and k.kind='kpis' and k.data->>'code'=r.data->>'kpiCode'
        where r.workspace_id=v_workspace and r.kind='dataRecords' and public.esg_period_contains(v_period,r.data->>'period') and
        (r.data->>'status'='missing' or k.id is null or r.data->>'unit' is distinct from k.data->>'unit' or
         (k.data->>'aggregation'='manual' and r.data->>'status' in ('measured','estimated')))) then raise exception 'Missing data, unknown KPI, unit drift or manual numeric aggregation prevents report finalization'; end if;
      if exists(select 1 from public.esg_records a join public.esg_records b on a.workspace_id=b.workspace_id and a.id<b.id and a.kind='dataRecords' and b.kind='dataRecords' and
        a.data->>'kpiCode'=b.data->>'kpiCode' and lower(btrim(a.data->>'facility'))=lower(btrim(b.data->>'facility')) and lower(btrim(a.data->>'source'))=lower(btrim(b.data->>'source')) and
        a.data->>'period'<>b.data->>'period' and (public.esg_period_contains(a.data->>'period',b.data->>'period') or public.esg_period_contains(b.data->>'period',a.data->>'period'))
        where a.workspace_id=v_workspace and public.esg_period_contains(v_period,a.data->>'period') and public.esg_period_contains(v_period,b.data->>'period')) then raise exception 'Overlapping data periods at the same facility/source prevent double counting'; end if;
      if exists(select 1 from public.esg_records r join public.esg_records k on k.workspace_id=r.workspace_id and k.kind='kpis' and k.data->>'code'=r.data->>'kpiCode'
        where r.workspace_id=v_workspace and r.kind='dataRecords' and r.data->>'status' in ('measured','estimated') and public.esg_period_contains(v_period,r.data->>'period') and k.data->>'aggregation'='last' and
        r.data->>'date'=(select max(z.data->>'date') from public.esg_records z where z.workspace_id=v_workspace and z.kind='dataRecords' and z.data->>'kpiCode'=r.data->>'kpiCode' and z.data->>'status' in ('measured','estimated') and public.esg_period_contains(v_period,z.data->>'period'))
        group by r.data->>'kpiCode' having count(*)>1) then raise exception 'Last-value KPI has ambiguous latest records'; end if;
      if exists(select 1 from public.esg_records r join public.esg_records k on k.workspace_id=r.workspace_id and k.kind='kpis' and k.data->>'code'=r.data->>'kpiCode'
        where r.workspace_id=v_workspace and r.kind='dataRecords' and r.data->>'status' in ('measured','estimated') and public.esg_period_contains(v_period,r.data->>'period') and k.data->>'aggregation'='last'
        group by r.data->>'kpiCode' having count(distinct r.data->>'facility')>1) then raise exception 'Last-value KPI requires a consolidated facility snapshot'; end if;
      if exists(select 1 from public.esg_records r join public.esg_records k on k.workspace_id=r.workspace_id and k.kind='kpis' and k.data->>'code'=r.data->>'kpiCode'
        where r.workspace_id=v_workspace and r.kind='dataRecords' and r.data->>'status' in ('measured','estimated') and public.esg_period_contains(v_period,r.data->>'period') and k.data->>'aggregation' in ('sum','ratio')
        group by r.data->>'kpiCode',k.data->>'aggregation' having
        (k.data->>'aggregation'='sum' and sum((r.data->>'value')::numeric)>1.7976931348623157e308) or
        (k.data->>'aggregation'='ratio' and (sum((r.data->>'numerator')::numeric)>1.7976931348623157e308 or sum((r.data->>'denominator')::numeric)>1.7976931348623157e308))) then raise exception 'KPI aggregate exceeds finite numeric range'; end if;
      v_snapshot:=jsonb_build_object('version',1,'period',v_period,'generatedAt',extract(epoch from now())*1000,
        'records',coalesce((select jsonb_agg(public.esg_record_json(r) order by r.id) from public.esg_records r where r.workspace_id=v_workspace and r.kind='dataRecords' and public.esg_period_contains(v_period,r.data->>'period')),'[]'::jsonb),
        'kpis',coalesce((select jsonb_agg(public.esg_record_json(r) order by r.id) from public.esg_records r where r.workspace_id=v_workspace and r.kind='kpis'),'[]'::jsonb),
        'ghg',coalesce((select jsonb_agg(public.esg_record_json(r) order by r.id) from public.esg_records r where r.workspace_id=v_workspace and r.kind='ghgEntries' and public.esg_period_contains(v_period,r.data->>'period')),'[]'::jsonb));
      v_data:=v_data||jsonb_build_object('approvedBy',v_actor,'publishedAt',case when v_data->>'status'='published' then now()::text else '' end,'snapshot',v_snapshot);
      if v_id is not null and v_row.data->>'status'='approved' then
        if (v_data-array['status','approvedBy','publishedAt','snapshot']) is distinct from (v_row.data-array['status','approvedBy','publishedAt','snapshot']) then raise exception 'Only publishing the identical approved report is allowed'; end if;
        v_data:=v_data||jsonb_build_object('approvedBy',v_row.data->'approvedBy','snapshot',v_row.data->'snapshot');
        v_snapshot:=null;
      end if;
    end if;
    if v_id is null then
      insert into public.esg_records(workspace_id,kind,data,created_by) values(v_workspace,v_kind,v_data,v_actor) returning * into v_row;
      v_id:=v_row.id;v_inserted:=v_inserted+1;
    else
      update public.esg_records set data=v_data,version=version+1,updated_at=now() where id=v_id and workspace_id=v_workspace returning * into v_row;
      v_updated:=v_updated+1;
    end if;
    if v_snapshot is not null then insert into public.report_snapshots(report_id,workspace_id,snapshot,created_by) values(v_id,v_workspace,v_snapshot,v_actor); end if;
    v_result:=to_jsonb(v_id);
  end loop;
  if v_op='import' then return jsonb_build_object('inserted',v_inserted,'updated',v_updated);
  elsif v_op='removeMany' then return to_jsonb(v_count);
  elsif v_op='remove' then return 'null'::jsonb;
  else return v_result;
  end if;
end $$;

-- No internal helper is a second client-side mutation entry point.
revoke all on function public.esg_immutable(),public.esg_final_report_immutable(),public.esg_audit_change(),public.esg_period_contains(text,text),public.esg_period_is_locked(uuid,text),public.esg_record_json(public.esg_records),public.esg_validate_numbers(jsonb),public.esg_evidence_referenced(uuid,text),public.esg_validate_data(text,jsonb,uuid,uuid),public.esg_mutate(text,jsonb,uuid) from public,anon,authenticated;
grant execute on function public.esg_mutate(text,jsonb,uuid) to authenticated;

-- Supabase Storage enforces size/MIME on its API; this bucket is always private.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
  values('esg-evidence','esg-evidence',false,10485760,array['application/pdf','image/jpeg','image/png','image/webp','text/csv','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
  on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create function public.esg_storage_workspace(p_name text) returns uuid
language plpgsql immutable set search_path = pg_catalog, public as $$
begin
  if p_name ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' then return split_part(p_name,'/',1)::uuid; end if;
  return null;
end $$;
revoke all on function public.esg_storage_workspace(text) from public,anon;
grant execute on function public.esg_storage_workspace(text) to authenticated;
create policy esg_evidence_member_read on storage.objects for select to authenticated
  using(bucket_id='esg-evidence' and public.esg_member_role(public.esg_storage_workspace(name)) is not null);
create policy esg_evidence_editor_insert on storage.objects for insert to authenticated
  with check(bucket_id='esg-evidence' and public.esg_member_role(public.esg_storage_workspace(name)) in ('owner','editor'));
-- No UPDATE policy: uploaded evidence cannot be overwritten in place.
create policy esg_evidence_editor_delete on storage.objects for delete to authenticated
  using(bucket_id='esg-evidence' and public.esg_member_role(public.esg_storage_workspace(name)) in ('owner','editor') and
    not exists(select 1 from public.esg_records e where e.workspace_id=public.esg_storage_workspace(name) and e.kind='evidence' and e.data->>'filePath'=name));

-- Serialize deletion with registry creation, closing the upload-registration race.
-- The Storage service may maintain object metadata, so its UPDATE behavior is untouched.
create function public.esg_storage_delete_guard() returns trigger
language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_workspace uuid;
begin
  if old.bucket_id='esg-evidence' then
    v_workspace:=public.esg_storage_workspace(old.name);
    if v_workspace is not null then
      perform pg_advisory_xact_lock(hashtextextended(v_workspace::text,0));
      if exists(select 1 from public.esg_records e where e.workspace_id=v_workspace and e.kind='evidence' and e.data->>'filePath'=old.name) then
        raise exception using errcode='42501',message='Registered evidence files cannot be deleted';
      end if;
    end if;
  end if;
  return old;
end $$;
revoke all on function public.esg_storage_delete_guard() from public,anon,authenticated;
create trigger esg_evidence_delete_guard before delete on storage.objects for each row execute function public.esg_storage_delete_guard();

commit;
