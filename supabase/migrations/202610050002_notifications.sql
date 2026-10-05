-- Additive migration. Private submissions and notifications never become public entries.
alter table public.contributions add column request_key uuid unique;
alter table public.contributions add column request_hash text;
create table public.contribution_notifications (
 contribution_id uuid primary key references public.contributions(id),
 state text not null default 'pending' check(state in ('pending','sending','provider_accepted','delivered','failed','needs_review')),
 proposal_snapshot jsonb not null, received_at timestamptz not null,
 payload jsonb, attempts integer not null default 0,
 first_attempt_at timestamptz, locked_at timestamptz,
 next_attempt_at timestamptz not null default now(), provider_id text unique,
 error_code text, updated_at timestamptz not null default now()
);
alter table public.contribution_notifications enable row level security;
create policy owner_notifications on public.contribution_notifications for select to authenticated using(public.is_afroatlas_owner());
grant select on public.contribution_notifications to authenticated;
grant all on public.contribution_notifications to service_role;
revoke all on public.contribution_notifications from anon;
create index contribution_pending_idx on public.contributions(created_at) where status='pending';
create index notification_due_idx on public.contribution_notifications(next_attempt_at) where state in ('pending','sending');
create function public.receive_contribution(request_id uuid, content_hash text, new_proposal jsonb, private_photo text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare saved public.contributions; notify_state text;
begin
 insert into public.contributions(id,request_key,request_hash,proposal,photo_path)
 values(request_id,request_id,content_hash,new_proposal,private_photo)
 on conflict(request_key) do nothing;
 select * into saved from public.contributions where request_key=request_id;
 if saved.request_hash is distinct from content_hash then raise exception 'Idempotency conflict'; end if;
 insert into public.contribution_notifications(contribution_id,proposal_snapshot,received_at)
 values(saved.id,saved.proposal,saved.created_at) on conflict(contribution_id) do nothing;
 select state into notify_state from public.contribution_notifications where contribution_id=saved.id;
 return jsonb_build_object('id',saved.id,'status',saved.status,'notification',notify_state);
end $$;
revoke all on function public.receive_contribution(uuid,text,jsonb,text) from public;
grant execute on function public.receive_contribution(uuid,text,jsonb,text) to service_role;
create function public.claim_contribution_notification(target_id uuid) returns jsonb language plpgsql security definer set search_path=public as $$
declare job public.contribution_notifications;
begin
 select * into job from public.contribution_notifications where contribution_id=target_id
 and ((state='pending' and next_attempt_at<=now()) or (state='sending' and locked_at<now()-interval '5 minutes')) for update skip locked;
 if not found then return null; end if;
 -- Resend's deduplication expires after 24h. Stop automatically before this boundary.
 if job.attempts>=8 or job.first_attempt_at<now()-interval '23 hours' then
   update public.contribution_notifications set state='needs_review',error_code='retry_window_expired',updated_at=now() where contribution_id=target_id;
   return null;
 end if;
 update public.contribution_notifications set state='sending',locked_at=now(),first_attempt_at=coalesce(first_attempt_at,now()),attempts=attempts+1,updated_at=now()
 where contribution_id=target_id returning * into job;
 return to_jsonb(job);
end $$;
revoke all on function public.claim_contribution_notification(uuid) from public;
grant execute on function public.claim_contribution_notification(uuid) to service_role;
-- Only anonymous daily totals; no contributor information, raw searches or identifiers.
create table public.usage_daily(day date not null,event text not null check(event in ('internal_search','search_empty','product_open','destination_use','contribution_received')),count bigint not null default 0,primary key(day,event));
alter table public.usage_daily enable row level security;
create policy owner_usage on public.usage_daily for select to authenticated using(public.is_afroatlas_owner());
grant select on public.usage_daily to authenticated;
grant all on public.usage_daily to service_role;
revoke all on public.usage_daily from anon;
create function public.count_usage(event_name text) returns void language sql security definer set search_path=public as $$
 insert into public.usage_daily(day,event,count) values(current_date,event_name,1) on conflict(day,event) do update set count=usage_daily.count+1;
$$;
revoke all on function public.count_usage(text) from public;
grant execute on function public.count_usage(text) to service_role;
