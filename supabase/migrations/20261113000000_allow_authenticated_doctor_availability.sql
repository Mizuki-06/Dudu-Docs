alter table public.staff_availability enable row level security;

drop policy if exists "Authenticated users can view doctor availability" on public.staff_availability;

create policy "Authenticated users can view doctor availability"
on public.staff_availability
for select
to authenticated
using (
    exists (
        select 1
        from public.staff as doctor
        where doctor.staff_id = staff_availability.staff_id
          and lower(coalesce(doctor.role, '')) in ('doctor', 'physician')
    )
);
