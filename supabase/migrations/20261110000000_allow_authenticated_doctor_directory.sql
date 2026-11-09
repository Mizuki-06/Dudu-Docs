drop policy if exists "Authenticated users can view doctors" on public.staff;

create policy "Authenticated users can view doctors"
on public.staff
for select
to authenticated
using (lower(role) in ('doctor', 'physician'));
