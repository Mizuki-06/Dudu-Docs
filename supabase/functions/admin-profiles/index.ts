import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const allowedRoles = ["admin", "clinic_staff", "doctor"];
const allowedStatuses = ["active", "inactive"];

function respond(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getProfile(value: unknown) {
    if (!isRecord(value)) throw new Error("A staff profile is required.");

    const fullName = typeof value.full_name === "string" ? value.full_name.trim() : "";
    const email = typeof value.email === "string" ? value.email.trim().toLowerCase() : "";
    const role = typeof value.role === "string" ? value.role.trim().toLowerCase() : "";
    const specialization =
        typeof value.specialization === "string" ? value.specialization.trim() : "";
    const status =
        typeof value.status === "string" ? value.status.trim().toLowerCase() : "";

    if (!fullName || fullName.length > 200) {
        throw new Error("Enter a full name of 1 to 200 characters.");
    }
    if (!allowedRoles.includes(role)) {
        throw new Error("Choose a supported staff role.");
    }
    if (!allowedStatuses.includes(status)) {
        throw new Error("Choose Active or Inactive status.");
    }
    if (specialization.length > 200) {
        throw new Error("Specialization must be 200 characters or fewer.");
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("Enter a valid email address.");
    }

    return {
        full_name: fullName,
        email,
        role,
        specialization,
        status
    };
}

Deno.serve(async (request: Request) => {
    if (request.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }
    if (request.method !== "POST") {
        return respond({ error: "Method not allowed." }, 405);
    }

    const authorization = request.headers.get("Authorization") || "";
    const tokenMatch = authorization.match(/^Bearer\s+(.+)$/i);
    if (!tokenMatch) {
        return respond({ error: "Sign in with an administrator account." }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
        console.error("Missing required Supabase function environment variables.");
        return respond({ error: "Profile service is not configured." }, 500);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: { user }, error: authError } =
        await supabase.auth.getUser(tokenMatch[1]);
    if (authError || !user) {
        return respond({ error: "Your session is invalid. Please sign in again." }, 401);
    }

    const { data: caller, error: callerError } = await supabase
        .from("staff")
        .select("staff_id, role, status")
        .eq("auth_user_id", user.id)
        .maybeSingle();
    if (callerError) {
        console.error("Could not verify profile-service staff role:", callerError.message);
        return respond({ error: "Could not verify your clinic account." }, 500);
    }
    if (
        !caller ||
        String(caller.status || "").trim().toLowerCase() !== "active" ||
        String(caller.role || "").trim().toLowerCase() !== "admin"
    ) {
        return respond({ error: "Only active administrators can manage staff profiles." }, 403);
    }

    let payload: unknown;
    try {
        payload = await request.json();
    } catch {
        return respond({ error: "Request body must be valid JSON." }, 400);
    }
    if (!isRecord(payload)) {
        return respond({ error: "Request body must be a JSON object." }, 400);
    }

    if (payload.action === "list") {
        const { data: staffRecords, error: staffError } = await supabase
            .from("staff")
            .select("staff_id, auth_user_id, full_name, role, status, specialization")
            .order("full_name", { ascending: true });
        if (staffError) {
            console.error("Staff profile list failed:", staffError.message);
            return respond({ error: "Could not load staff profiles." }, 500);
        }

        const userEmails = new Map<string, string>();
        const userIds = new Set<string>();
        let page = 1;
        const perPage = 1000;
        while (true) {
            const { data, error } = await supabase.auth.admin.listUsers({
                page,
                perPage
            });
            if (error) {
                console.error("Could not load staff account emails:", error.message);
                return respond({ error: "Could not load staff account emails." }, 500);
            }

            for (const authUser of data.users) {
                userIds.add(authUser.id);
                if (authUser.email) userEmails.set(authUser.id, authUser.email);
            }
            if (data.users.length < perPage) break;
            page += 1;
        }

        const profiles = (staffRecords || []).map(staff => ({
            staff_id: staff.staff_id,
            full_name: staff.full_name || "",
            role: String(staff.role || "").trim().toLowerCase(),
            status: String(staff.status || "").trim().toLowerCase(),
            specialization: staff.specialization || "",
            email: staff.auth_user_id
                ? userEmails.get(staff.auth_user_id) || ""
                : "",
            has_auth_account: Boolean(
                staff.auth_user_id && userIds.has(staff.auth_user_id)
            )
        }));
        return respond({ profiles });
    }

    if (payload.action !== "update") {
        return respond({ error: "Unsupported profile operation." }, 400);
    }

    const staffId = String(payload.staffId ?? "").trim();
    if (!/^\d+$/.test(staffId)) {
        return respond({ error: "A valid staff profile ID is required." }, 400);
    }

    let profile: ReturnType<typeof getProfile>;
    try {
        profile = getProfile(payload.profile);
    } catch (error) {
        return respond({
            error: error instanceof Error ? error.message : "Invalid staff profile."
        }, 400);
    }

    const { data: existing, error: existingError } = await supabase
        .from("staff")
        .select("staff_id, auth_user_id, full_name, role, status, specialization")
        .eq("staff_id", staffId)
        .maybeSingle();
    if (existingError) {
        console.error("Could not load the staff profile to update:", existingError.message);
        return respond({ error: "Could not load this staff profile." }, 500);
    }
    if (!existing) return respond({ error: "Staff profile not found." }, 404);
    if (!existing.auth_user_id && profile.email) {
        return respond({
            error: "This staff profile has no linked sign-in account, so its email cannot be changed."
        }, 400);
    }

    let existingAuthEmail = "";
    if (existing.auth_user_id) {
        const { data: authData, error: authUserError } =
            await supabase.auth.admin.getUserById(existing.auth_user_id);
        if (authUserError || !authData.user) {
            console.error(
                "Could not load the linked staff sign-in account:",
                authUserError?.message || "User not found."
            );
            return respond({
                error: "Could not load this staff member's sign-in account."
            }, 500);
        }
        existingAuthEmail = authData.user.email || "";
        if (!profile.email) {
            return respond({
                error: "A linked sign-in account must have an email address."
            }, 400);
        }
    }

    const { data: updatedStaff, error: updateError } = await supabase
        .from("staff")
        .update({
            full_name: profile.full_name,
            role: profile.role,
            specialization: profile.specialization || null,
            status: profile.status
        })
        .eq("staff_id", staffId)
        .select("staff_id, auth_user_id, full_name, role, status, specialization")
        .single();
    if (updateError) {
        console.error("Staff profile update failed:", updateError.message);
        return respond({ error: "Could not save this staff profile." }, 500);
    }

    let email = "";
    if (existing.auth_user_id) {
        email = existingAuthEmail;
        if (profile.email.toLowerCase() !== existingAuthEmail.toLowerCase()) {
            const { data: authData, error: emailError } =
                await supabase.auth.admin.updateUserById(existing.auth_user_id, {
                    email: profile.email,
                    email_confirm: true
                });
            if (emailError) {
                const { error: rollbackError } = await supabase
                    .from("staff")
                    .update({
                        full_name: existing.full_name,
                        role: existing.role,
                        specialization: existing.specialization,
                        status: existing.status
                    })
                    .eq("staff_id", staffId);
                if (rollbackError) {
                    console.error(
                        "Email update and staff-profile rollback both failed:",
                        emailError.message,
                        rollbackError.message
                    );
                    return respond({
                        error: "Email update failed and the profile could not be restored. Contact an administrator."
                    }, 500);
                }
                return respond({
                    error: "Could not update the sign-in email. Make sure the address is valid and unused."
                }, 400);
            }
            email = authData.user.email || profile.email;
        }
    }

    return respond({
        profile: {
            staff_id: updatedStaff.staff_id,
            full_name: updatedStaff.full_name || "",
            role: String(updatedStaff.role || "").trim().toLowerCase(),
            status: String(updatedStaff.status || "").trim().toLowerCase(),
            specialization: updatedStaff.specialization || "",
            email,
            has_auth_account: Boolean(existing.auth_user_id)
        }
    });
});
