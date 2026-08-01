-- Verified member demand plus privacy-preserving company-page interest.
-- Individual voter and visitor identities are never returned by the public function.

create table if not exists public.company_research_votes (
  user_id uuid not null references auth.users(id) on delete cascade,
  ticker text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, ticker),
  constraint company_research_votes_ticker_check check (ticker ~ '^[A-Z0-9.-]{1,10}$')
);

alter table public.company_research_votes enable row level security;
revoke all on public.company_research_votes from anon, authenticated;
grant select, insert, delete on public.company_research_votes to authenticated;

drop policy if exists "Members read their research votes" on public.company_research_votes;
create policy "Members read their research votes" on public.company_research_votes
for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Members request company research" on public.company_research_votes;
create policy "Members request company research" on public.company_research_votes
for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Members remove their research votes" on public.company_research_votes;
create policy "Members remove their research votes" on public.company_research_votes
for delete to authenticated using (auth.uid() = user_id);

create or replace function public.company_research_demand()
returns table (ticker text, vote_count bigint, page_views bigint, demand_score bigint)
language sql
stable
security definer
set search_path = public
as $$
  with votes as (
    select v.ticker, count(*)::bigint as vote_count
    from public.company_research_votes v
    group by v.ticker
  ), visits as (
    select upper(split_part(split_part(s.path, '?', 1), '/', 3)) as ticker,
           count(distinct s.visitor_id)::bigint as page_views
    from public.site_visits s
    where s.path like '/company/%'
      and s.visited_at >= now() - interval '30 days'
    group by upper(split_part(split_part(s.path, '?', 1), '/', 3))
  ), combined as (
    select coalesce(v.ticker, p.ticker) as ticker,
           coalesce(v.vote_count, 0)::bigint as vote_count,
           coalesce(p.page_views, 0)::bigint as page_views
    from votes v full outer join visits p on p.ticker = v.ticker
  )
  select c.ticker, c.vote_count, c.page_views,
         (c.vote_count * 10 + c.page_views)::bigint as demand_score
  from combined c
  where c.ticker ~ '^[A-Z0-9.-]{1,10}$'
  order by demand_score desc, c.ticker;
$$;

revoke all on function public.company_research_demand() from public;
grant execute on function public.company_research_demand() to anon, authenticated;
