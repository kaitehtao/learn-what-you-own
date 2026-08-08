-- Keep notebook ownership checks efficient as private research grows.

drop policy if exists "Members read their own notebooks" on public.research_notebooks;
create policy "Members read their own notebooks"
on public.research_notebooks for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Members create their own notebooks" on public.research_notebooks;
create policy "Members create their own notebooks"
on public.research_notebooks for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Members update their own notebooks" on public.research_notebooks;
create policy "Members update their own notebooks"
on public.research_notebooks for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Members delete their own notebooks" on public.research_notebooks;
create policy "Members delete their own notebooks"
on public.research_notebooks for delete to authenticated
using ((select auth.uid()) = user_id);
