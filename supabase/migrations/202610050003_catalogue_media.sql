-- Documentary media mirror; static catalogue IDs remain authoritative until a catalogue DB is configured.
create table public.catalogue_media (
 id text primary key, product_id text not null, payload jsonb not null,
 verification_status text not null check(verification_status in ('pending','metadata_checked','visually_checked')),
 updated_at date not null
);
alter table public.catalogue_media enable row level security;
create policy validated_media_public on public.catalogue_media for select to anon,authenticated using(verification_status='visually_checked');
grant select on public.catalogue_media to anon,authenticated;
grant all on public.catalogue_media to service_role;
create index catalogue_media_product_idx on public.catalogue_media(product_id);
-- Keep a small bounded counter rather than raw usage events.
create function public.check_usage_rate(rate_key text) returns boolean language plpgsql security definer set search_path=public as $$
declare count_now integer;
begin
 delete from public.submission_limits where started_at<now()-interval '2 hours';
 insert into public.submission_limits(key) values(rate_key) on conflict(key) do update set
 count=case when submission_limits.started_at<now()-interval '1 minute' then 1 else submission_limits.count+1 end,
 started_at=case when submission_limits.started_at<now()-interval '1 minute' then now() else submission_limits.started_at end returning count into count_now;
 return count_now<=60;
end $$;
revoke all on function public.check_usage_rate(text) from public;
grant execute on function public.check_usage_rate(text) to service_role;
