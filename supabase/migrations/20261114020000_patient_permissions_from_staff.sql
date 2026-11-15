alter function public.current_authenticated_staff_context() owner to postgres;

revoke all on function public.current_authenticated_staff_context() from public;
revoke all on function public.current_authenticated_staff_context() from anon;
grant execute on function public.current_authenticated_staff_context() to authenticated;

drop policy if exists "Allow patient inserts for testing" on public.patients;
drop policy if exists "Admin full access to patients" on public.patients;
drop policy if exists "Clinic staff can read patients" on public.patients;
drop policy if exists "Clinic staff can insert patients" on public.patients;
drop policy if exists "Clinic staff can update patients" on public.patients;
drop policy if exists "Clinic staff can delete patients" on public.patients;
drop policy if exists "Authorized staff can read patients" on public.patients;
drop policy if exists "Admins and clinic staff can insert patients" on public.patients;
drop policy if exists "Admins and clinic staff can update patients" on public.patients;
drop policy if exists "Admins and clinic staff can delete patients" on public.patients;

create policy "Active admins and clinic staff can manage patients"
on public.patients
as permissive
for all
to authenticated
using (
    exists (
        select 1
        from public.current_authenticated_staff_context() as caller
        where caller.staff_role in ('admin', 'clinic_staff')
    )
)
with check (
    exists (
        select 1
        from public.current_authenticated_staff_context() as caller
        where caller.staff_role in ('admin', 'clinic_staff')
    )
);

create policy "Active staff can read authorized patients"
on public.patients
as permissive
for select
to authenticated
using (
    exists (
        select 1
        from public.current_authenticated_staff_context() as caller
        where caller.staff_role in ('admin', 'clinic_staff')
           or (
               caller.staff_role = 'doctor'
               and exists (
                   select 1
                   from public.appointments as appointment
                   where appointment.patient_id = patients.id
                     and appointment.staff_id = caller.staff_id
               )
           )
    )
);

create policy "Restrict patient reads to active staff scope"
on public.patients
as restrictive
for select
to authenticated
using (
    exists (
        select 1
        from public.current_authenticated_staff_context() as caller
        where caller.staff_role in ('admin', 'clinic_staff')
           or (
               caller.staff_role = 'doctor'
               and exists (
                   select 1
                   from public.appointments as appointment
                   where appointment.patient_id = patients.id
                     and appointment.staff_id = caller.staff_id
               )
           )
    )
);

create policy "Restrict patient inserts to active admins and clinic staff"
on public.patients
as restrictive
for insert
to authenticated
with check (
    exists (
        select 1
        from public.current_authenticated_staff_context() as caller
        where caller.staff_role in ('admin', 'clinic_staff')
    )
);

create policy "Restrict patient updates to active admins and clinic staff"
on public.patients
as restrictive
for update
to authenticated
using (
    exists (
        select 1
        from public.current_authenticated_staff_context() as caller
        where caller.staff_role in ('admin', 'clinic_staff')
    )
)
with check (
    exists (
        select 1
        from public.current_authenticated_staff_context() as caller
        where caller.staff_role in ('admin', 'clinic_staff')
    )
);

create policy "Restrict patient deletes to active admins and clinic staff"
on public.patients
as restrictive
for delete
to authenticated
using (
    exists (
        select 1
        from public.current_authenticated_staff_context() as caller
        where caller.staff_role in ('admin', 'clinic_staff')
    )
);
