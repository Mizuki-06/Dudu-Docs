
-- Helper: determine whether the current user is
-- an active admin or clinic staff member.

CREATE OR REPLACE FUNCTION public.can_view_all_doctors()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.staff s
        WHERE s.auth_user_id = (SELECT auth.uid())
          AND s.status = 'active'
          AND s.role IN ('admin', 'clinic_staff')
    );
$$;

-- Restrict execution to authenticated users.
REVOKE ALL ON FUNCTION public.can_view_all_doctors()
FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.can_view_all_doctors()
TO authenticated;

-- Ensure the helper runs with its owner's privileges.
ALTER FUNCTION public.can_view_all_doctors()
OWNER TO postgres;

-- Replace the previous doctor-directory policy.
DROP POLICY IF EXISTS
"Authenticated users can view doctors"
ON public.staff;

DROP POLICY IF EXISTS
"Active staff can view doctors"
ON public.staff;

CREATE POLICY "Authorized staff can view doctors"
ON public.staff
FOR SELECT
TO authenticated
USING (
    status = 'active'
    AND role IN ('doctor', 'physician')
    AND (
        auth_user_id = (SELECT auth.uid())
        OR (SELECT public.can_view_all_doctors())
    )
);
