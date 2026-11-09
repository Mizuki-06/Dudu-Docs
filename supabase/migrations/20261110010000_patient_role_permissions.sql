drop policy if exists "Clinic staff can read patients" on public.patients;
drop policy if exists "Clinic staff can insert patients" on public.patients;
drop policy if exists "Clinic staff can update patients" on public.patients;
drop policy if exists "Clinic staff can delete patients" on public.patients;

create policy "Authorized staff can read patients"
on public.patients
for select
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'clinic_staff', 'doctor'));

create policy "Admins and clinic staff can insert patients"
on public.patients
for insert
to authenticated
with check ((auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'clinic_staff'));

create policy "Admins and clinic staff can update patients"
on public.patients
for update
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'clinic_staff'))
with check ((auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'clinic_staff'));

create policy "Admins and clinic staff can delete patients"
on public.patients
for delete
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'clinic_staff'));
