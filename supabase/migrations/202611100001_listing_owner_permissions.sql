drop policy if exists "owners create listings" on public.listings;
create policy "owners create listings" on public.listings for insert
with check (
  owner_id = auth.uid()
  and exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'owner'
  )
);
