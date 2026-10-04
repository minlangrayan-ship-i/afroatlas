-- Run once in the owner's Supabase project. Never grant ownership by public signup.
create table public.afroatlas_owners (user_id uuid primary key references auth.users(id));
alter table public.afroatlas_owners enable row level security;
create function public.is_afroatlas_owner() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.afroatlas_owners where user_id=auth.uid()); $$;
revoke all on function public.is_afroatlas_owner() from public;
grant execute on function public.is_afroatlas_owner() to authenticated;
create table public.contributions (
 id uuid primary key default gen_random_uuid(), proposal jsonb not null,
 photo_path text, status text not null default 'pending' check(status in ('pending','accepted','rejected')),
 created_at timestamptz not null default now(), reviewed_at timestamptz, reviewer uuid references auth.users(id),
 review_note text not null default ''
);
alter table public.contributions enable row level security;
create policy owner_read on public.contributions for select to authenticated using(public.is_afroatlas_owner());
grant select on public.contributions to authenticated;
revoke all on public.contributions from anon;
create table public.published_entries (id uuid primary key references public.contributions(id),payload jsonb not null, published_at timestamptz not null default now());
alter table public.published_entries enable row level security;
create policy public_read on public.published_entries for select to anon,authenticated using(true);
grant select on public.published_entries to anon,authenticated;
create table public.moderation_history (id bigint generated always as identity primary key,contribution_id uuid not null references public.contributions(id),owner_id uuid not null,action text not null,proposal jsonb not null,created_at timestamptz default now());
alter table public.moderation_history enable row level security;
create policy owner_history on public.moderation_history for select to authenticated using(public.is_afroatlas_owner());
grant select on public.moderation_history to authenticated;
create table public.submission_limits (key text primary key,started_at timestamptz not null default now(), count integer not null default 1);
alter table public.submission_limits enable row level security;
revoke all on public.submission_limits from anon,authenticated;
create function public.check_submission_rate(rate_key text) returns boolean language plpgsql security definer set search_path=public as $$
declare count_now integer;
begin
 delete from public.submission_limits where started_at < now()-interval '2 hours';
 insert into public.submission_limits(key) values(rate_key) on conflict(key) do update set count=case when submission_limits.started_at<now()-interval '1 hour' then 1 else submission_limits.count+1 end,started_at=case when submission_limits.started_at<now()-interval '1 hour' then now() else submission_limits.started_at end returning count into count_now;
 return count_now<=5;
end $$;
revoke all on function public.check_submission_rate(text) from public;
grant execute on function public.check_submission_rate(text) to service_role;
create function public.review_contribution(contribution_id uuid,decision text,edited_proposal jsonb,entry jsonb,notes text) returns void language plpgsql security definer set search_path=public as $$
declare current_status text;
begin
 if not public.is_afroatlas_owner() then raise exception 'Owner only'; end if;
 if decision not in ('edit','accept','reject') then raise exception 'Invalid decision'; end if;
 select status into current_status from public.contributions where id=contribution_id for update;
 if current_status is null or current_status<>'pending' then raise exception 'Proposal unavailable or already reviewed'; end if;
 if edited_proposal is null or jsonb_typeof(edited_proposal)<>'object' then raise exception 'Proposal required'; end if;
 if decision='accept' then
   if entry is null or length(coalesce(entry->>'sourceUrl',''))=0 or length(coalesce(entry->>'sourceLicense',''))=0 then raise exception 'Source and licence required'; end if;
   insert into public.published_entries(id,payload) values(contribution_id,entry);
 end if;
 update public.contributions set proposal=edited_proposal,status=case decision when 'accept' then 'accepted' when 'reject' then 'rejected' else 'pending' end,reviewer=auth.uid(),reviewed_at=now(),review_note=left(notes,3000) where id=contribution_id;
 insert into public.moderation_history(contribution_id,owner_id,action,proposal) values(contribution_id,auth.uid(),decision,edited_proposal);
end $$;
-- Only the validated Edge Function (using the caller JWT) invokes this RPC.
revoke all on function public.review_contribution(uuid,text,jsonb,jsonb,text) from public;
grant execute on function public.review_contribution(uuid,text,jsonb,jsonb,text) to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('afroatlas-pending','afroatlas-pending',false,5242880,array['image/jpeg','image/png','image/webp']),
 ('afroatlas-approved','afroatlas-approved',true,5242880,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
create policy owner_private_photos on storage.objects for select to authenticated using(bucket_id='afroatlas-pending' and public.is_afroatlas_owner());
-- No anonymous write/list access. Edge Functions perform writes with server credentials.
grant all on public.afroatlas_owners,public.contributions,public.published_entries,public.moderation_history,public.submission_limits to service_role;
grant usage,select on sequence public.moderation_history_id_seq to service_role;
