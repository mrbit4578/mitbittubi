#!/usr/bin/env bash
# Run the production migration and client-role tests in disposable PostgreSQL.
# Supabase auth/Storage schemas are minimal test stubs; this does not require a live Supabase project.
# Requires Docker only. No host port, persistent volume, or application credentials are used.
set -euo pipefail

command -v docker >/dev/null || { printf '%s\n' 'Docker is required for SQL integration tests.' >&2; exit 1; }
repo_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
migration_file="$repo_root/supabase/migrations/202610080001_esg_workspace.sql"
container_id=''
cleanup() {
  if [[ -n "$container_id" ]]; then docker rm -fv "$container_id" >/dev/null 2>&1 || true; fi
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
container_id="$(docker run --rm --network none --memory 256m --cpus 1 \
  -e POSTGRES_PASSWORD=disposable-integration-test-only -d "${POSTGRES_TEST_IMAGE:-postgres:17-alpine}")"
ready=false
for ((attempt=0; attempt<60; attempt++)); do
  if docker exec "$container_id" sh -c 'test "$(cat /proc/1/comm)" = postgres && pg_isready -U postgres' >/dev/null 2>&1; then ready=true; break; fi
  sleep 0.5
done
if [[ "$ready" != true ]]; then
  docker logs "$container_id" >&2
  printf '%s\n' 'Disposable PostgreSQL did not become ready.' >&2
  exit 1
fi

docker exec -i "$container_id" psql -X -q -v ON_ERROR_STOP=1 -U postgres <<'SUPABASE_TEST_STUBS'
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create schema auth;
create table auth.users(id uuid primary key, email text);
create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),'')::jsonb,'{}'::jsonb) $$;
create function auth.uid() returns uuid language sql stable as $$ select nullif(auth.jwt()->>'sub','')::uuid $$;
grant usage on schema auth to anon,authenticated,service_role;
grant execute on function auth.uid(),auth.jwt() to anon,authenticated,service_role;
create schema storage;
create table storage.buckets(id text primary key,name text not null,owner uuid,owner_id text,public boolean not null default false,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text not null,owner uuid,owner_id text,metadata jsonb default '{}'::jsonb,created_at timestamptz default now(),updated_at timestamptz default now(),unique(bucket_id,name));
alter table storage.objects enable row level security;
create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name,'/'))[:array_length(string_to_array(name,'/'),1)-1] $$;
grant usage on schema storage to anon,authenticated,service_role;
grant select,insert,update,delete on storage.objects to authenticated;
grant select on storage.buckets to authenticated;
grant all on storage.objects,storage.buckets to service_role;
SUPABASE_TEST_STUBS

docker exec -i "$container_id" psql -X -q -v ON_ERROR_STOP=1 -U postgres < "$migration_file"
docker exec -i "$container_id" psql -X -q -v ON_ERROR_STOP=1 -U postgres <<'SQL_INTEGRATION_CASES'
\set ON_ERROR_STOP on
\pset tuples_only on
\pset format unaligned
\o /dev/null

create schema test;
create table test.context(key text primary key,value jsonb not null);
grant usage on schema test to authenticated,anon,service_role;
grant select on test.context to service_role;
grant select,insert,update on test.context to authenticated;
create function test.ctx(k text) returns jsonb language sql as $$ select value from test.context where key=k $$;
create function test.id(k text) returns uuid language sql as $$ select (test.ctx(k)#>>'{}')::uuid $$;
create function test.save(k text,v jsonb) returns void language sql as $$ insert into test.context values(k,v) on conflict(key) do update set value=excluded.value $$;
create function test.claims(id text,email text) returns void language sql as $$ select set_config('request.jwt.claims',jsonb_build_object('sub',id,'email',email)::text,false)::text::void $$;
create function test.ok(passed boolean,label text) returns void language plpgsql as $$ begin if passed is distinct from true then raise exception 'FAIL: %',label; end if; raise notice 'PASS: %',label; end $$;
create function test.reject(statement text,label text,expected_state text default null,expected_message text default null) returns void language plpgsql as $$
declare caught boolean:=false;
begin
  begin execute statement;
  exception when others then
    caught:=true;
    if expected_state is not null and sqlstate<>expected_state then raise exception 'FAIL: % (expected SQLSTATE %, got %: %)',label,expected_state,sqlstate,sqlerrm; end if;
    if expected_message is not null and position(expected_message in sqlerrm)=0 then raise exception 'FAIL: % (expected message %, got %)',label,expected_message,sqlerrm; end if;
  end;
  if not caught then raise exception 'FAIL: % (statement unexpectedly succeeded)',label; end if;
  raise notice 'PASS: %',label;
end $$;
grant execute on all functions in schema test to authenticated,anon,service_role;
insert into auth.users(id,email) values
('11111111-1111-4111-8111-111111111111','owner@example.com'),
('22222222-2222-4222-8222-222222222222','other@example.com'),
('33333333-3333-4333-8333-333333333333','editor@example.com'),
('44444444-4444-4444-8444-444444444444','reviewer@example.com'),
('55555555-5555-4555-8555-555555555555','viewer@example.com'),
('66666666-6666-4666-8666-666666666666','outsider@example.com'),
('77777777-7777-4777-8777-777777777777','invited@example.com');

set role anon;
select test.reject($s$select public.esg_mutate('listWorkspaces')$s$,'anonymous cannot execute RPC','42501');
select test.reject($s$select * from public.esg_records$s$,'anonymous cannot read records','42501');
reset role;
set role authenticated;
select set_config('request.jwt.claims','{}',false);
select test.reject($s$select public.esg_mutate('createWorkspace','{"name":"Denied"}')$s$,'RPC requires authenticated UID','42501','Authentication required');
select test.claims('11111111-1111-4111-8111-111111111111','owner@example.com');
select test.save('workspace',to_jsonb((public.esg_mutate('createWorkspace','{"name":"Workspace A"}')->>'id')::uuid));
select test.ok(public.esg_member_role(test.id('workspace'))='owner','workspace creation grants owner membership');
select test.save('editorInvite',public.esg_mutate('inviteMember','{"email":"editor@example.com","role":"editor"}',test.id('workspace')));
select test.save('reviewerInvite',public.esg_mutate('inviteMember','{"email":"reviewer@example.com","role":"reviewer"}',test.id('workspace')));
select test.save('viewerInvite',public.esg_mutate('inviteMember','{"email":"viewer@example.com","role":"viewer"}',test.id('workspace')));
select test.save('matchingInvite',public.esg_mutate('inviteMember','{"email":" Invited@Example.com ","role":"viewer"}',test.id('workspace')));
select test.reject($s$select public.esg_mutate('inviteMember','{"email":"invalid","role":"viewer"}',test.id('workspace'))$s$,'invalid invitation email rejected','23514');
select test.reject($s$select public.esg_mutate('inviteMember','{"email":"admin@example.com","role":"owner"}',test.id('workspace'))$s$,'invitations cannot grant owner',null,'Invalid invitation role');
select test.claims('22222222-2222-4222-8222-222222222222','other@example.com');
select test.save('otherWorkspace',to_jsonb((public.esg_mutate('createWorkspace','{"name":"Workspace B"}')->>'id')::uuid));
select test.ok((select count(*) from public.workspaces)=1,'RLS hides other tenant workspaces');
select test.reject($s$select public.esg_mutate('listKpis','{}',test.id('workspace'))$s$,'RPC blocks other tenant reads','42501','Workspace membership required');
select test.reject($s$select public.esg_mutate('acceptInvitation',jsonb_build_object('id',test.ctx('matchingInvite')->>'id'))$s$,'invitation requires authenticated matching email','42501','Invitation must match authenticated email');
select test.claims('33333333-3333-4333-8333-333333333333','editor@example.com');
select public.esg_mutate('acceptInvitation',jsonb_build_object('id',test.ctx('editorInvite')->>'id'));
select test.claims('44444444-4444-4444-8444-444444444444','reviewer@example.com');
select public.esg_mutate('acceptInvitation',jsonb_build_object('id',test.ctx('reviewerInvite')->>'id'));
select test.claims('55555555-5555-4555-8555-555555555555','viewer@example.com');
select public.esg_mutate('acceptInvitation',jsonb_build_object('id',test.ctx('viewerInvite')->>'id'));
select test.claims('77777777-7777-4777-8777-777777777777','invited@example.com');
select test.ok(public.esg_mutate('acceptInvitation',jsonb_build_object('id',test.ctx('matchingInvite')->>'id'))->>'role'='viewer','matching email accepts normalized invitation');
select test.reject($s$select public.esg_mutate('acceptInvitation',jsonb_build_object('id',test.ctx('matchingInvite')->>'id'))$s$,'accepted invitation cannot be reused',null,'Invitation expired, accepted or mismatched');
select test.claims('11111111-1111-4111-8111-111111111111','owner@example.com');
select test.ok(jsonb_array_length(public.esg_mutate('listMembers','{}',test.id('workspace')))=5,'invitation acceptance grants only requested roles');
select test.save('kpiData','{"code":"ELEC","name":"Electricity","pillar":"E","unit":"kWh","rule":"sum","owner":"Energy team","frequency":"monthly","target":"100","note":"","aggregation":"sum"}');
select test.save('knowledgeData','{"title":"Policy","category":"Governance","summary":"Policy summary","content":"Policy content","tags":"policy","source":"Internal"}');
select test.save('taskData','{"code":"T1","department":"ESG","title":"Collect data","frequency":"monthly","evidence":"invoice","owner":"ESG","backup":"","status":"todo","due":"2026-10-31","note":""}');
select test.save('dataData','{"period":"2026-10","date":"2026-10-08","facility":"Plant A","department":"Operations","kpiCode":"ELEC","source":"Meter 1","unit":"kWh","scope":"2","status":"measured","evidenceCode":"EV1","preparedBy":"Editor","note":"","value":100}');
select test.save('evidenceData','{"code":"EV1","title":"Meter invoice","sourceUrl":"https://example.com/invoice.pdf","description":"October meter evidence","sha256":"","filePath":"","fileName":"","size":0,"mimeType":""}');
select test.save('ghgData','{"period":"2026-10","scope":"2","category":"Electricity","facility":"Plant A","scope2Method":"location","source":"Invoice","unit":"kWh","factorSource":"Official factor 2026","status":"measured","note":"","activity":100,"factor":0.5,"tco2e":999}');
select test.save('reportData','{"code":"R1","title":"October report","type":"monthly","period":"2026-10","status":"draft","summary":"","kpiSummary":"","comparison":"","risks":"","missingData":"","projects":"","decisions":"","preparedBy":"Editor"}');

-- Even the workspace owner has no table-write or internal helper privilege.
select test.reject($s$insert into public.esg_records(workspace_id,kind,data,created_by) values(test.id('workspace'),'knowledge',test.ctx('knowledgeData'),auth.uid())$s$,'direct insert denied','42501');
select test.reject($s$update public.workspace_members set role='owner' where user_id='33333333-3333-4333-8333-333333333333'$s$,'direct membership escalation denied','42501');
select test.reject($s$delete from public.esg_records$s$,'direct delete denied','42501');
select test.reject($s$select public.esg_validate_data('knowledge',test.ctx('knowledgeData'),test.id('workspace'))$s$,'internal validation helper is not client RPC','42501');
select test.claims('33333333-3333-4333-8333-333333333333','editor@example.com');
select test.save('kpi',public.esg_mutate('upsertKpi',jsonb_build_object('data',test.ctx('kpiData')),test.id('workspace')));
select test.save('knowledge',public.esg_mutate('upsertKnowledge',jsonb_build_object('data',test.ctx('knowledgeData')),test.id('workspace')));
select test.save('data',public.esg_mutate('upsertDataRecord',jsonb_build_object('data',test.ctx('dataData')||'{"reviewState":"approved","approvedBy":"spoof","locked":true}'),test.id('workspace')));
select test.save('filePath',to_jsonb(test.id('workspace')::text||'/99999999-9999-4999-8999-999999999999'));
select test.ok((select not public and file_size_limit=10485760 and 'application/pdf'=any(allowed_mime_types) from storage.buckets where id='esg-evidence'),'evidence bucket is private with size and MIME restrictions');
insert into storage.objects(bucket_id,name,owner) values('esg-evidence',test.ctx('filePath')#>>'{}',auth.uid());
select test.reject($s$insert into storage.objects(bucket_id,name,owner) values('esg-evidence',test.id('otherWorkspace')::text||'/99999999-9999-4999-8999-999999999999',auth.uid())$s$,'storage insert cannot cross tenants','42501');
select test.reject($s$insert into storage.objects(bucket_id,name,owner) values('esg-evidence',test.id('workspace')::text||'/../../bad',auth.uid())$s$,'storage rejects malformed traversal path','42501');
update storage.objects set metadata='{"tampered":true}' where name=test.ctx('filePath')#>>'{}';
select test.ok((select metadata='{}' from storage.objects where name=test.ctx('filePath')#>>'{}'),'storage policies prevent overwriting evidence objects');
select test.save('fileEvidence',public.esg_mutate('upsertEvidence',jsonb_build_object('data',test.ctx('evidenceData')||jsonb_build_object('code','EVFILE','sourceUrl','','filePath',test.ctx('filePath'),'fileName','invoice.pdf','size',100,'mimeType','application/pdf','sha256',repeat('a',64))),test.id('workspace')));
delete from storage.objects where name=test.ctx('filePath')#>>'{}';
select test.ok((select count(*) from storage.objects where name=test.ctx('filePath')#>>'{}')=1,'registered evidence objects cannot be deleted');
insert into storage.objects(bucket_id,name,owner) values('esg-evidence',test.id('workspace')::text||'/cccccccc-cccc-4ccc-8ccc-cccccccccccc',auth.uid());
delete from storage.objects where name=test.id('workspace')::text||'/cccccccc-cccc-4ccc-8ccc-cccccccccccc';
select test.ok((select count(*) from storage.objects where name=test.id('workspace')::text||'/cccccccc-cccc-4ccc-8ccc-cccccccccccc')=0,'editor can delete unregistered temporary upload');
reset role;
set role service_role;
select test.reject($s$delete from storage.objects where name=test.ctx('filePath')#>>'{}'$s$,'registered file guard applies to service role','42501','Registered evidence files cannot be deleted');
insert into storage.objects(bucket_id,name,owner) values('esg-evidence',test.id('workspace')::text||'/dddddddd-dddd-4ddd-8ddd-dddddddddddd',auth.uid());
delete from storage.objects where name=test.id('workspace')::text||'/dddddddd-dddd-4ddd-8ddd-dddddddddddd';
select test.ok((select count(*) from storage.objects where name=test.id('workspace')::text||'/dddddddd-dddd-4ddd-8ddd-dddddddddddd')=0,'service role can delete unregistered temporary upload');
reset role;
set role authenticated;

select test.reject($s$select public.esg_mutate('upsertEvidence',jsonb_build_object('data',test.ctx('evidenceData')||'{"code":"BADURL","sourceUrl":"javascript:alert(1)"}'),test.id('workspace'))$s$,'evidence rejects unsafe source URL',null,'valid HTTPS URL');
select test.save('ghg',public.esg_mutate('upsertGhg',jsonb_build_object('data',test.ctx('ghgData')),test.id('workspace')));
select test.ok((select (data->>'tco2e')::numeric=0.05 from public.esg_records where id=test.id('ghg')),'GHG total is calculated server-side');
select test.save('preciseGhg',public.esg_mutate('upsertGhg',jsonb_build_object('data',test.ctx('ghgData')||'{"source":"Precise invoice","activity":1.23456789,"factor":0.87654321}'),test.id('workspace')));
select test.ok((select (data->>'tco2e')::numeric=1.23456789::numeric*0.87654321::numeric*0.001 from public.esg_records where id=test.id('preciseGhg')),'GHG total retains full multiplication precision');
select test.save('report',public.esg_mutate('upsertReport',jsonb_build_object('data',test.ctx('reportData')),test.id('workspace')));
select test.ok((select data->>'reviewState'='pending' and data->>'approvedBy'='' and data->>'locked'='false' from public.esg_records where id=test.id('data')),'write strips forged approval and lock metadata');
select test.ok(jsonb_array_length(public.esg_mutate('listDataRecords','{}',test.id('workspace')))=1,'editor creates and lists workspace records');
select test.reject($s$select public.esg_mutate('upsertKpi',jsonb_build_object('data',test.ctx('kpiData')||'{"code":" elec "}'),test.id('workspace'))$s$,'normalized KPI code uniqueness enforced','23505');
select test.reject($s$select public.esg_mutate('upsertDataRecord',jsonb_build_object('data',test.ctx('dataData')||'{"source":"Bad meter","value":-1}'),test.id('workspace'))$s$,'negative measurement rejected',null,'Numeric values must be finite and nonnegative');
select test.reject($s$select public.esg_mutate('upsertKnowledge',jsonb_build_object('data',test.ctx('knowledgeData')||'{"unknown":{"nested":[0,-2]}}'),test.id('workspace'))$s$,'nested unknown negative number rejected',null,'Numeric values must be finite and nonnegative');
select test.reject($s$select public.esg_mutate('upsertDataRecord',jsonb_build_object('data',test.ctx('dataData')||'{"source":"Missing","status":"missing","value":1}'),test.id('workspace'))$s$,'missing data requires null value',null,'null value');
select test.reject($s$select public.esg_mutate('upsertDataRecord',jsonb_build_object('data',test.ctx('dataData')||'{"source":"Bad unit","unit":"MWh"}'),test.id('workspace'))$s$,'measurement unit must match KPI',null,'Data unit must exactly match KPI unit');
select test.reject($s$select public.esg_mutate('upsertDataRecord',jsonb_build_object('data',test.ctx('dataData')||'{"source":"Bad date","date":"2026-11-01"}'),test.id('workspace'))$s$,'measurement date must fall in period',null,'Date must fall within period');
select test.reject($s$select public.esg_mutate('upsertDataRecord',jsonb_build_object('data',test.ctx('dataData')||'{"source":"Unknown KPI","kpiCode":"UNKNOWN"}'),test.id('workspace'))$s$,'measurement requires workspace KPI',null,'KPI does not exist');
select test.reject($s$select public.esg_mutate('upsertKnowledge',jsonb_build_object('id',test.id('knowledge'),'data',test.ctx('knowledgeData')),test.id('workspace'))$s$,'update requires expected version','40001');
select public.esg_mutate('upsertKnowledge',jsonb_build_object('id',test.id('knowledge'),'expectedVersion',1,'data',test.ctx('knowledgeData')||'{"title":"Updated policy"}'),test.id('workspace'));
select test.ok((select version=2 and data->>'title'='Updated policy' from public.esg_records where id=test.id('knowledge')),'update increments authoritative version');
select test.reject($s$select public.esg_mutate('upsertKnowledge',jsonb_build_object('id',test.id('knowledge'),'expectedVersion',1,'data',test.ctx('knowledgeData')),test.id('workspace'))$s$,'stale update rejected','40001','Record version conflict');
select test.reject($s$select public.esg_mutate('removeKpi',jsonb_build_object('id',test.id('kpi'),'expectedVersion',1),test.id('workspace'))$s$,'referenced KPI cannot be deleted',null,'Cannot delete a referenced KPI');
select test.reject($s$select public.esg_mutate('inviteMember','{"email":"evil@example.com","role":"editor"}',test.id('workspace'))$s$,'editor cannot invite members','42501');
select test.reject($s$select public.esg_mutate('lockPeriod','{"period":"2026-10","locked":true}',test.id('workspace'))$s$,'editor cannot lock periods','42501');
select test.reject($s$select public.esg_mutate('upsertReport',jsonb_build_object('id',test.id('report'),'expectedVersion',1,'data',test.ctx('reportData')||'{"status":"approved"}'),test.id('workspace'))$s$,'editor cannot finalize report','42501');

-- Import and delete failures must roll back every record and audit write in their batch.
select test.save('auditBefore',to_jsonb((select count(*) from public.audit_events)));
select test.reject($s$select public.esg_mutate('importTasks',jsonb_build_object('rows',jsonb_build_array(jsonb_build_object('data',test.ctx('taskData')),jsonb_build_object('data',test.ctx('taskData')||'{"code":"T2","status":"invalid"}'))),test.id('workspace'))$s$,'invalid import rolls back earlier valid row',null,'Invalid task status');
select test.ok((select count(*) from public.esg_records where kind='tasks')=0 and to_jsonb((select count(*) from public.audit_events))=test.ctx('auditBefore'),'failed import leaves records and audit unchanged');
select test.ok(public.esg_mutate('importTasks',jsonb_build_object('rows',jsonb_build_array(jsonb_build_object('data',test.ctx('taskData')),jsonb_build_object('data',test.ctx('taskData')||'{"code":"T2"}'))),test.id('workspace'))='{"inserted":2,"updated":0}'::jsonb,'valid import inserts entire batch');
select test.save('task1',to_jsonb((select id from public.esg_records where kind='tasks' and data->>'code'='T1')));
select test.save('task2',to_jsonb((select id from public.esg_records where kind='tasks' and data->>'code'='T2')));
select test.save('auditBefore',to_jsonb((select count(*) from public.audit_events)));
select test.reject($s$select public.esg_mutate('removeManyTasks',jsonb_build_object('rows',jsonb_build_array(jsonb_build_object('id',test.id('task1'),'expectedVersion',1),jsonb_build_object('id',test.id('task2'),'expectedVersion',9))),test.id('workspace'))$s$,'stale batch delete rejected','40001','Record version conflict');
select test.ok((select count(*) from public.esg_records where kind='tasks')=2 and to_jsonb((select count(*) from public.audit_events))=test.ctx('auditBefore'),'failed delete leaves both records and audit unchanged');
select test.ok(public.esg_mutate('removeManyTasks',jsonb_build_object('rows',jsonb_build_array(jsonb_build_object('id',test.id('task1'),'expectedVersion',1),jsonb_build_object('id',test.id('task2'),'expectedVersion',1))),test.id('workspace'))='2'::jsonb,'valid versioned batch delete succeeds');

select test.claims('55555555-5555-4555-8555-555555555555','viewer@example.com');
select test.ok(jsonb_array_length(public.esg_mutate('listKpis','{}',test.id('workspace')))=1,'viewer can read workspace records');
select test.ok((select count(*) from storage.objects)=1,'viewer can read its tenant evidence objects');
select test.reject($s$insert into storage.objects(bucket_id,name,owner) values('esg-evidence',test.id('workspace')::text||'/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',auth.uid())$s$,'viewer cannot upload evidence','42501');
select test.reject($s$select public.esg_mutate('upsertKnowledge',jsonb_build_object('data',test.ctx('knowledgeData')),test.id('workspace'))$s$,'viewer cannot mutate records','42501');
select test.ok((select count(*) from public.workspace_invitations)=0,'RLS hides invitations from viewer');
select test.reject($s$select public.esg_mutate('listInvitations','{}',test.id('workspace'))$s$,'viewer cannot list invitations through RPC','42501');
select test.claims('22222222-2222-4222-8222-222222222222','other@example.com');
select test.ok((select count(*) from storage.objects)=0,'storage RLS hides other tenant evidence');
select test.ok((select count(*) from public.esg_records)=0 and (select count(*) from public.audit_events where workspace_id=test.id('workspace'))=0,'RLS hides other tenant records and audit');
select test.reject($s$select public.esg_mutate('removeKnowledge',jsonb_build_object('id',test.id('knowledge'),'expectedVersion',2),test.id('otherWorkspace'))$s$,'other tenant cannot mutate record by ID',null,'Record not found in workspace');

-- A reviewer can approve someone else's work, then the editor loses approval on change.
select test.claims('11111111-1111-4111-8111-111111111111','owner@example.com');
select test.save('ownData',public.esg_mutate('upsertDataRecord',jsonb_build_object('data',test.ctx('dataData')||'{"period":"2026-11","date":"2026-11-01","source":"Own meter"}'),test.id('workspace')));
select test.reject($s$select public.esg_mutate('reviewDataRecord',jsonb_build_object('id',test.id('ownData'),'expectedVersion',1,'decision','approved','reason','Self'),test.id('workspace'))$s$,'owner cannot approve own measurement','42501','Cannot review your own data record');
select test.claims('44444444-4444-4444-8444-444444444444','reviewer@example.com');
select test.reject($s$select public.esg_mutate('upsertKnowledge',jsonb_build_object('data',test.ctx('knowledgeData')),test.id('workspace'))$s$,'reviewer has no general edit permission','42501');
select test.reject($s$insert into storage.objects(bucket_id,name,owner) values('esg-evidence',test.id('workspace')::text||'/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',auth.uid())$s$,'reviewer cannot upload evidence','42501');
-- Simulate a measurement this reviewer authored before acquiring the reviewer role.
reset role;
with inserted as (insert into public.esg_records(workspace_id,kind,data,created_by) values(test.id('workspace'),'dataRecords',test.ctx('dataData')||'{"period":"2026-12","date":"2026-12-01","source":"Reviewer meter","reviewState":"pending","approvedBy":"","checkedBy":"","locked":false}',auth.uid()) returning id) insert into test.context select 'reviewerOwnData',to_jsonb(id) from inserted;
set role authenticated;
select test.reject($s$select public.esg_mutate('reviewDataRecord',jsonb_build_object('id',test.id('reviewerOwnData'),'expectedVersion',1,'decision','approved','reason','Self'),test.id('workspace'))$s$,'reviewer cannot approve own measurement','42501','Cannot review your own data record');

select test.reject($s$select public.esg_mutate('reviewDataRecord',jsonb_build_object('id',test.id('data'),'expectedVersion',1,'decision','approved','reason',''),test.id('workspace'))$s$,'review requires explanation',null,'Review requires a reason');
select test.reject($s$select public.esg_mutate('reviewDataRecord',jsonb_build_object('id',test.id('data'),'expectedVersion',1,'decision','approved','reason','Invoice verified'),test.id('workspace'))$s$,'measured approval requires registered evidence',null,'requires registered evidence');
select test.claims('33333333-3333-4333-8333-333333333333','editor@example.com');
select test.save('evidence',public.esg_mutate('upsertEvidence',jsonb_build_object('data',test.ctx('evidenceData')),test.id('workspace')));
select test.reject($s$select public.esg_mutate('removeEvidence',jsonb_build_object('id',test.id('evidence'),'expectedVersion',1),test.id('workspace'))$s$,'referenced evidence cannot be deleted',null,'Cannot delete evidence referenced');
select test.reject($s$select public.esg_mutate('upsertEvidence',jsonb_build_object('id',test.id('evidence'),'expectedVersion',1,'data',test.ctx('evidenceData')||'{"sourceUrl":"https://example.com/changed.pdf"}'),test.id('workspace'))$s$,'referenced evidence cannot be altered',null,'Referenced evidence is immutable');
select test.claims('44444444-4444-4444-8444-444444444444','reviewer@example.com');
select test.ok(public.esg_mutate('reviewDataRecord',jsonb_build_object('id',test.id('data'),'expectedVersion',1,'decision','approved','reason','Invoice verified'),test.id('workspace'))->>'reviewState'='approved','reviewer approves another users measurement');
select test.claims('33333333-3333-4333-8333-333333333333','editor@example.com');
select public.esg_mutate('upsertDataRecord',jsonb_build_object('id',test.id('data'),'expectedVersion',2,'data',test.ctx('dataData')||'{"value":101,"reviewState":"approved"}'),test.id('workspace'));
select test.ok((select version=3 and data->>'reviewState'='pending' and data->>'reviewedBy'='' and data->>'reviewedAt'='0' and data->>'reviewReason'='' from public.esg_records where id=test.id('data')),'editor update resets independent review');
select test.claims('44444444-4444-4444-8444-444444444444','reviewer@example.com');
select public.esg_mutate('reviewDataRecord',jsonb_build_object('id',test.id('data'),'expectedVersion',3,'decision','approved','reason','Updated invoice verified'),test.id('workspace'));
select test.claims('11111111-1111-4111-8111-111111111111','owner@example.com');
select test.reject($s$select public.esg_mutate('upsertReport',jsonb_build_object('id',test.id('report'),'expectedVersion',1,'data',test.ctx('reportData')||'{"status":"approved"}'),test.id('workspace'))$s$,'finalization requires period lock',null,'authoritatively locked');
select test.reject($s$select public.esg_mutate('lockPeriod','{"period":"2026-11","locked":true,"reason":"Premature close"}',test.id('workspace'))$s$,'unreviewed period cannot be locked',null,'nonempty fully approved period');
select public.esg_mutate('reviewDataRecord',jsonb_build_object('id',test.id('reviewerOwnData'),'expectedVersion',1,'decision','approved','reason','Independently checked'),test.id('workspace'));
select test.claims('44444444-4444-4444-8444-444444444444','reviewer@example.com');
select public.esg_mutate('reviewDataRecord',jsonb_build_object('id',test.id('ownData'),'expectedVersion',1,'decision','approved','reason','Independently checked'),test.id('workspace'));
select public.esg_mutate('lockPeriod','{"period":"2026","locked":true,"reason":"Year close"}',test.id('workspace'));
select test.claims('33333333-3333-4333-8333-333333333333','editor@example.com');
select test.reject($s$select public.esg_mutate('upsertDataRecord',jsonb_build_object('id',test.id('data'),'expectedVersion',4,'data',test.ctx('dataData')),test.id('workspace'))$s$,'year lock prevents existing month update',null,'Period is locked');
select test.reject($s$select public.esg_mutate('upsertDataRecord',jsonb_build_object('data',test.ctx('dataData')||'{"source":"Another meter"}'),test.id('workspace'))$s$,'year lock prevents inserting month data',null,'Period is locked');
select test.reject($s$select public.esg_mutate('upsertGhg',jsonb_build_object('id',test.id('ghg'),'expectedVersion',1,'data',test.ctx('ghgData')),test.id('workspace'))$s$,'year lock prevents GHG update',null,'Period is locked');
select test.reject($s$select public.esg_mutate('removeGhg',jsonb_build_object('id',test.id('ghg'),'expectedVersion',1),test.id('workspace'))$s$,'year lock prevents GHG delete',null,'Period is locked');
select test.reject($s$select public.esg_mutate('removeDataRecord',jsonb_build_object('id',test.id('data'),'expectedVersion',4),test.id('workspace'))$s$,'locked measurement cannot be deleted',null,'Period is locked');
select test.claims('44444444-4444-4444-8444-444444444444','reviewer@example.com');
select test.reject($s$select public.esg_mutate('lockPeriod','{"period":"2026","locked":false}',test.id('workspace'))$s$,'unlock requires reason',null,'requires a reason');
select public.esg_mutate('lockPeriod','{"period":"2026","locked":false,"reason":"Reopen corrections"}',test.id('workspace'));
select test.ok(jsonb_array_length(public.esg_mutate('dataRecordsByPeriod','{"period":"2026-Q4"}',test.id('workspace')))=3,'quarter queries include contained monthly records');
select public.esg_mutate('lockPeriod','{"period":"2026-Q4","locked":true,"reason":"Quarter close"}',test.id('workspace'));
select test.claims('33333333-3333-4333-8333-333333333333','editor@example.com');
select test.reject($s$select public.esg_mutate('upsertDataRecord',jsonb_build_object('data',test.ctx('dataData')||'{"source":"Quarter locked meter"}'),test.id('workspace'))$s$,'quarter lock blocks contained month insert',null,'Period is locked');
select test.claims('44444444-4444-4444-8444-444444444444','reviewer@example.com');
select public.esg_mutate('lockPeriod','{"period":"2026-Q4","locked":false,"reason":"Monthly close instead"}',test.id('workspace'));
select public.esg_mutate('lockPeriod','{"period":"2026-10","locked":true,"reason":"Month close"}',test.id('workspace'));
select test.ok(exists(select 1 from jsonb_array_elements(public.esg_mutate('listDataRecords','{}',test.id('workspace'))) r where r->>'_id'=test.id('data')::text and r->>'locked'='true'),'returned lock state comes from authoritative locks');

-- Finalization must produce an immutable snapshot of reviewed, locked data.
select test.save('reportData',(select data from public.esg_records where id=test.id('report')));
select test.claims('44444444-4444-4444-8444-444444444444','reviewer@example.com');
select test.reject($s$select public.esg_mutate('upsertReport',jsonb_build_object('data',test.ctx('reportData')||'{"code":"R2","status":"approved"}'),test.id('workspace'))$s$,'reviewer cannot create report','42501','existing unchanged report');
select test.reject($s$select public.esg_mutate('upsertReport',jsonb_build_object('id',test.id('report'),'expectedVersion',1,'data',test.ctx('reportData')||'{"title":"Altered","status":"approved"}'),test.id('workspace'))$s$,'reviewer cannot alter report content','42501','existing unchanged report');
select public.esg_mutate('upsertReport',jsonb_build_object('id',test.id('report'),'expectedVersion',1,'data',test.ctx('reportData')||'{"status":"approved"}'),test.id('workspace'));
select test.ok((select data->>'status'='approved' and data->>'approvedBy'=auth.uid()::text and jsonb_array_length(data->'snapshot'->'records')=1 from public.esg_records where id=test.id('report')),'report finalization captures approved actor and data snapshot');
select test.ok((select count(*) from public.report_snapshots where report_id=test.id('report'))=1,'report has persistent snapshot');
select test.reject($s$select public.esg_mutate('upsertReport',jsonb_build_object('id',test.id('report'),'expectedVersion',2,'data',test.ctx('reportData')),test.id('workspace'))$s$,'finalized report cannot change',null,'immutable');
select test.claims('11111111-1111-4111-8111-111111111111','owner@example.com');
select test.reject($s$select public.esg_mutate('removeReport',jsonb_build_object('id',test.id('report'),'expectedVersion',2),test.id('workspace'))$s$,'finalized report cannot be deleted',null,'immutable');
select test.claims('44444444-4444-4444-8444-444444444444','reviewer@example.com');
select test.save('snapshotBefore',(select snapshot from public.report_snapshots where report_id=test.id('report')));
select test.reject($s$select public.esg_mutate('upsertReport',jsonb_build_object('id',test.id('report'),'expectedVersion',2,'data',test.ctx('reportData')||'{"status":"published","title":"Altered published"}'),test.id('workspace'))$s$,'publishing cannot alter approved contents','42501');
select public.esg_mutate('upsertReport',jsonb_build_object('id',test.id('report'),'expectedVersion',2,'data',test.ctx('reportData')||'{"status":"published"}'),test.id('workspace'));
select test.ok((select data->>'status'='published' and data->'snapshot'=test.ctx('snapshotBefore') from public.esg_records where id=test.id('report')),'publishing preserves original approved snapshot');
select test.reject($s$update public.report_snapshots set snapshot='{}'$s$,'clients cannot change report snapshots','42501');
select test.reject($s$delete from public.audit_events$s$,'clients cannot delete audit','42501');
select test.ok(jsonb_array_length(public.esg_mutate('exportWorkspace','{}',test.id('workspace'))->'snapshots')=1,'export includes final snapshots');
reset role;
-- Defense in depth: immutable triggers also reject privileged accidental mutations.
select test.reject($s$update public.report_snapshots set snapshot='{}'$s$,'snapshot immutable trigger protects privileged writes','42501','immutable');
select test.reject($s$delete from public.audit_events$s$,'audit immutable trigger protects privileged writes','42501','immutable');
select test.reject($s$update public.esg_records set data=data||'{"title":"Tampered"}' where id=test.id('report')$s$,'final report trigger protects privileged writes','42501','immutable');
select test.ok((select count(*) from public.audit_events where entity='esg_records' and record_id=test.id('data')::text and operation='UPDATE')=3,'review and update operations have audit entries');
select test.ok((select count(*) from public.audit_events where actor_id is null)=0,'every audit event records authenticated actor');

-- A second workspace isolates aggregation and seeding edge cases from final snapshots.
set role authenticated;
select test.claims('22222222-2222-4222-8222-222222222222','other@example.com');
select test.ok(public.esg_mutate('seedDefaults',jsonb_build_object('tables',jsonb_build_object('kpis',jsonb_build_array(test.ctx('kpiData')))),test.id('otherWorkspace'))->>'kpis'='1','default seeding inserts new validated records');
select test.ok(public.esg_mutate('seedDefaults',jsonb_build_object('tables',jsonb_build_object('kpis',jsonb_build_array(test.ctx('kpiData')))),test.id('otherWorkspace'))->>'kpis'='0','default seeding is idempotent');
select test.reject($s$select public.esg_mutate('seedDefaults','{"tables":{"reports":[]}}',test.id('otherWorkspace'))$s$,'default seed rejects unsupported tables',null,'Unsupported seed table');
select test.save('ratioKpi',public.esg_mutate('upsertKpi',jsonb_build_object('data',test.ctx('kpiData')||'{"code":"RATE","unit":"%","aggregation":"ratio","ratioMultiplier":1}'),test.id('otherWorkspace')));
select test.ok((select not(data?'ratioMultiplier') from public.esg_records where id=test.id('ratioKpi')),'KPI strips spoofed ratio scale metadata');
select test.reject($s$select public.esg_mutate('upsertKpi',jsonb_build_object('data',test.ctx('kpiData')||'{"code":"BADSUM","unit":"%","aggregation":"sum"}'),test.id('otherWorkspace'))$s$,'percentage KPI cannot use sum',null,'sum');
select test.reject($s$select public.esg_mutate('upsertDataRecord',jsonb_build_object('data',test.ctx('dataData')||'{"kpiCode":"RATE","unit":"%"}'),test.id('otherWorkspace'))$s$,'ratio requires numerator and denominator',null,'Ratio data requires numerator');
select test.reject($s$select public.esg_mutate('upsertDataRecord',jsonb_build_object('data',test.ctx('dataData')||'{"kpiCode":"RATE","unit":"%","numerator":1,"denominator":0}'),test.id('otherWorkspace'))$s$,'ratio denominator must be positive',null,'Ratio data requires numerator');
select test.reject($s$select public.esg_mutate('upsertDataRecord',jsonb_build_object('data',test.ctx('dataData')||'{"kpiCode":"RATE","unit":"%","numerator":3,"denominator":2}'),test.id('otherWorkspace'))$s$,'percentage numerator cannot exceed denominator',null,'Percentage numerator cannot exceed denominator');
select test.save('ratioData',public.esg_mutate('upsertDataRecord',jsonb_build_object('data',test.ctx('dataData')||'{"kpiCode":"RATE","unit":"%","value":50,"numerator":1,"denominator":2}'),test.id('otherWorkspace')));
select test.ok((select data->>'numerator'='1' and data->>'denominator'='2' from public.esg_records where id=test.id('ratioData')),'valid ratio inputs are retained');
-- Remove edge fixtures before exercising a single manual KPI's readiness.
select public.esg_mutate('removeDataRecord',jsonb_build_object('id',test.id('ratioData'),'expectedVersion',1),test.id('otherWorkspace'));
select public.esg_mutate('removeKpi',jsonb_build_object('id',test.id('ratioKpi'),'expectedVersion',1),test.id('otherWorkspace'));
select test.save('seedKpi',to_jsonb((select id from public.esg_records where kind='kpis' and data->>'code'='ELEC')));
select public.esg_mutate('removeKpi',jsonb_build_object('id',test.id('seedKpi'),'expectedVersion',1),test.id('otherWorkspace'));
select test.save('manualKpi',public.esg_mutate('upsertKpi',jsonb_build_object('data',test.ctx('kpiData')||'{"aggregation":"manual"}'),test.id('otherWorkspace')));
select test.save('bEvidence',public.esg_mutate('upsertEvidence',jsonb_build_object('data',test.ctx('evidenceData')),test.id('otherWorkspace')));
select test.save('manualData',public.esg_mutate('upsertDataRecord',jsonb_build_object('data',test.ctx('dataData')),test.id('otherWorkspace')));
select test.save('bReviewInvite',public.esg_mutate('inviteMember','{"email":"reviewer@example.com","role":"reviewer"}',test.id('otherWorkspace')));
select test.claims('44444444-4444-4444-8444-444444444444','reviewer@example.com');
select public.esg_mutate('acceptInvitation',jsonb_build_object('id',test.ctx('bReviewInvite')->>'id'));
select public.esg_mutate('reviewDataRecord',jsonb_build_object('id',test.id('manualData'),'expectedVersion',1,'decision','approved','reason','Evidence verified'),test.id('otherWorkspace'));
select public.esg_mutate('lockPeriod','{"period":"2026-10","locked":true,"reason":"Close"}',test.id('otherWorkspace'));
select test.claims('22222222-2222-4222-8222-222222222222','other@example.com');
select test.reject($s$select public.esg_mutate('upsertReport',jsonb_build_object('data',test.ctx('reportData')||'{"code":"MANREPORT","status":"approved"}'),test.id('otherWorkspace'))$s$,'numeric manual KPI prevents report finalization',null,'manual numeric aggregation');
select public.esg_mutate('lockPeriod','{"period":"2026-10","locked":false,"reason":"Resolve manual KPI"}',test.id('otherWorkspace'));
select public.esg_mutate('upsertDataRecord',jsonb_build_object('id',test.id('manualData'),'expectedVersion',2,'data',test.ctx('dataData')||'{"status":"missing","value":null}'),test.id('otherWorkspace'));
select test.claims('44444444-4444-4444-8444-444444444444','reviewer@example.com');
select public.esg_mutate('reviewDataRecord',jsonb_build_object('id',test.id('manualData'),'expectedVersion',3,'decision','approved','reason','Missing data acknowledged'),test.id('otherWorkspace'));
select public.esg_mutate('lockPeriod','{"period":"2026-10","locked":true,"reason":"Close"}',test.id('otherWorkspace'));
select test.claims('22222222-2222-4222-8222-222222222222','other@example.com');
select test.reject($s$select public.esg_mutate('upsertReport',jsonb_build_object('data',test.ctx('reportData')||'{"code":"MANREPORT","status":"approved"}'),test.id('otherWorkspace'))$s$,'approved missing KPI prevents report finalization','P0001',null);
select public.esg_mutate('lockPeriod','{"period":"2026-10","locked":false,"reason":"Resolve missing data"}',test.id('otherWorkspace'));
select public.esg_mutate('removeDataRecord',jsonb_build_object('id',test.id('manualData'),'expectedVersion',4),test.id('otherWorkspace'));
select public.esg_mutate('upsertKpi',jsonb_build_object('id',test.id('manualKpi'),'expectedVersion',1,'data',test.ctx('kpiData')||'{"aggregation":"last"}'),test.id('otherWorkspace'));
select test.save('last1',public.esg_mutate('upsertDataRecord',jsonb_build_object('data',test.ctx('dataData')),test.id('otherWorkspace')));
select test.save('last2',public.esg_mutate('upsertDataRecord',jsonb_build_object('data',test.ctx('dataData')||'{"source":"Meter 2"}'),test.id('otherWorkspace')));
select test.claims('44444444-4444-4444-8444-444444444444','reviewer@example.com');
select public.esg_mutate('reviewDataRecord',jsonb_build_object('id',test.id('last1'),'expectedVersion',1,'decision','approved','reason','Evidence verified'),test.id('otherWorkspace'));
select public.esg_mutate('reviewDataRecord',jsonb_build_object('id',test.id('last2'),'expectedVersion',1,'decision','approved','reason','Evidence verified'),test.id('otherWorkspace'));
select public.esg_mutate('lockPeriod','{"period":"2026-10","locked":true,"reason":"Close"}',test.id('otherWorkspace'));
select test.claims('22222222-2222-4222-8222-222222222222','other@example.com');
select test.reject($s$select public.esg_mutate('upsertReport',jsonb_build_object('data',test.ctx('reportData')||'{"code":"LASTREPORT","status":"approved"}'),test.id('otherWorkspace'))$s$,'ambiguous last-value tie prevents report finalization',null,'Last-value KPI has ambiguous latest records');
select public.esg_mutate('lockPeriod','{"period":"2026-10","locked":false,"reason":"Resolve last tie"}',test.id('otherWorkspace'));
select public.esg_mutate('upsertDataRecord',jsonb_build_object('id',test.id('last2'),'expectedVersion',2,'data',test.ctx('dataData')||'{"source":"Meter 2","facility":"Plant B","date":"2026-10-09"}'),test.id('otherWorkspace'));
select test.claims('44444444-4444-4444-8444-444444444444','reviewer@example.com');
select public.esg_mutate('reviewDataRecord',jsonb_build_object('id',test.id('last2'),'expectedVersion',3,'decision','approved','reason','Evidence verified'),test.id('otherWorkspace'));
select public.esg_mutate('lockPeriod','{"period":"2026-10","locked":true,"reason":"Close"}',test.id('otherWorkspace'));
select test.claims('22222222-2222-4222-8222-222222222222','other@example.com');
select test.reject($s$select public.esg_mutate('upsertReport',jsonb_build_object('data',test.ctx('reportData')||'{"code":"FACREPORT","status":"approved"}'),test.id('otherWorkspace'))$s$,'last-value across facilities requires consolidation',null,'consolidated facility snapshot');
select public.esg_mutate('lockPeriod','{"period":"2026-Q4","locked":true,"reason":"Quarter close"}',test.id('otherWorkspace'));
select test.reject($s$select public.esg_mutate('upsertReport',jsonb_build_object('data',test.ctx('reportData')||'{"code":"QUARTERREPORT","period":"2026-Q4","type":"quarterly","status":"approved"}'),test.id('otherWorkspace'))$s$,'quarterly report requires monthly coverage',null,'Monthly KPI coverage is incomplete');
select public.esg_mutate('upsertKpi',jsonb_build_object('id',test.id('manualKpi'),'expectedVersion',2,'data',test.ctx('kpiData')||'{"aggregation":"last","frequency":"quarterly"}'),test.id('otherWorkspace'));
select public.esg_mutate('lockPeriod','{"period":"2026","locked":true,"reason":"Year close"}',test.id('otherWorkspace'));
select test.reject($s$select public.esg_mutate('upsertReport',jsonb_build_object('data',test.ctx('reportData')||'{"code":"YEARREPORT","period":"2026","type":"annual","status":"approved"}'),test.id('otherWorkspace'))$s$,'annual report requires quarterly coverage',null,'Quarterly KPI coverage is incomplete');
reset role;
SQL_INTEGRATION_CASES
printf '%s\n' 'PostgreSQL integration checks passed.'
