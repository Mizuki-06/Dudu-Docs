drop policy if exists "Allow patient inserts for testing" on public.patients;

drop policy if exists "Clinic staff can read patients" on public.patients;
create policy "Clinic staff can read patients"
on public.patients
for select
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'clinic_staff');

drop policy if exists "Clinic staff can insert patients" on public.patients;
create policy "Clinic staff can insert patients"
on public.patients
for insert
to authenticated
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'clinic_staff');

drop policy if exists "Clinic staff can update patients" on public.patients;
create policy "Clinic staff can update patients"
on public.patients
for update
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'clinic_staff')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'clinic_staff');

drop policy if exists "Clinic staff can delete patients" on public.patients;
create policy "Clinic staff can delete patients"
on public.patients
for delete
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'clinic_staff');
