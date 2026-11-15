create function public.current_authenticated_staff_context()
returns table (staff_id bigint, staff_role text)
language sql
stable
security definer
set search_path = ''
as $function$
    select s.staff_id, lower(s.role::text)
    from public.staff as s
    where s.auth_user_id = (select auth.uid())
      and lower(s.status::text) = 'active'
      and (
          select count(*)
          from public.staff as duplicate
          where duplicate.auth_user_id = (select auth.uid())
      ) = 1
$function$;

revoke all on function public.current_authenticated_staff_context() from public;
revoke all on function public.current_authenticated_staff_context() from anon;
grant execute on function public.current_authenticated_staff_context() to authenticated;

create policy "Active admins and clinic staff can manage appointments"
on public.appointments
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

create policy "Doctors can read their assigned appointments"
on public.appointments
as permissive
for select
to authenticated
using (
    exists (
        select 1
        from public.current_authenticated_staff_context() as caller
        where caller.staff_role = 'doctor'
          and caller.staff_id = appointments.staff_id
    )
);

create policy "Restrict appointment reads to active staff scope"
on public.appointments
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
               and caller.staff_id = appointments.staff_id
           )
    )
);

create policy "Restrict appointment inserts to active admins and clinic staff"
on public.appointments
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

create policy "Restrict appointment updates to active admins and clinic staff"
on public.appointments
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

create policy "Restrict appointment deletes to active admins and clinic staff"
on public.appointments
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

create policy "Active staff can insert their own activity logs"
on public.activity_logs
as permissive
for insert
to authenticated
with check (
    auth_user_id = (select auth.uid())
    and exists (
        select 1
        from public.current_authenticated_staff_context() as caller
        where caller.staff_role in ('admin', 'clinic_staff', 'doctor')
    )
);
