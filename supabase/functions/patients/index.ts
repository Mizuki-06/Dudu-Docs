import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const patientFields = [
    "full_name",
    "date_of_birth",
    "sex",
    "contact_number",
    "email",
    "address",
    "allergies",
    "medical_history",
    "last_visit",
    "status",
    "blood_group"
] as const;

function respond(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
}

function getPatientFields(value: unknown) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new Error("A patient record is required.");
    }

    const input = value as Record<string, unknown>;
    const patient: Record<string, unknown> = {};
    for (const field of patientFields) {
        if (field in input) patient[field] = input[field];
    }

    if (typeof patient.full_name !== "string" || !patient.full_name.trim()) {
        throw new Error("Full name is required.");
    }
    if (typeof patient.contact_number !== "string" || !patient.contact_number.trim()) {
        throw new Error("Contact number is required.");
    }
    if (patient.status !== "active" && patient.status !== "inactive") {
        throw new Error("Status must be active or inactive.");
    }
    patient.full_name = patient.full_name.trim();
    patient.contact_number = patient.contact_number.trim();
    return patient;
}

async function recordActivity(supabase: ReturnType<typeof createClient>, action: string, description: string) {
    const { error } = await supabase.from("activity_logs").insert({ action, description });
    if (!error) return null;

    console.error("Patient change was saved, but activity logging failed:", error.message);
    return error.message;
}

Deno.serve(async (request: Request) => {
    if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    if (request.method !== "POST") return respond({ error: "Method not allowed." }, 405);

    const authorization = request.headers.get("Authorization") || "";
    const tokenMatch = authorization.match(/^Bearer\s+(.+)$/i);
    if (!tokenMatch) return respond({ error: "Sign in with an authorized clinic account." }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
        console.error("Missing required Supabase function environment variables.");
        return respond({ error: "Patient service is not configured." }, 500);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser(tokenMatch[1]);
    if (authError || !user) return respond({ error: "Your session is invalid. Please sign in again." }, 401);
    const role = user.app_metadata?.role;
    console.log("PATIENT FUNCTION AUTH CHECK:", {
    userId: user.id,
    email: user.email,
    role: role
});
    const canViewPatients = ["admin", "clinic_staff", "doctor"].includes(role);
    const canManagePatients = role === "admin" || role === "clinic_staff";
    if (!canViewPatients) {
        return respond({ error: "This account is not authorized to access patient records." }, 403);
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return respond({ error: "Request body must be valid JSON." }, 400);
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
        return respond({ error: "Request body must be a JSON object." }, 400);
    }
    const payload = body as Record<string, unknown>;

    const action = payload.action;
    if (action === "list") {
        const { data, error } = await supabase.from("patients").select("*");
        if (error) {
            console.error("Patient list failed:", error.message);
            return respond({ error: "Could not load patient records." }, 500);
        }
        return respond({ patients: data });
    }

    if (action === "create" || action === "update") {
        if (!canManagePatients) {
            return respond({ error: "Only admins and clinic staff can change patient records." }, 403);
        }

        let patient: Record<string, unknown>;
        try {
            patient = getPatientFields(payload.patient);
        } catch (error) {
            return respond({ error: error instanceof Error ? error.message : "Invalid patient record." }, 400);
        }

        if (action === "create") {
            const { data, error } = await supabase.from("patients").insert(patient).select("*").single();
            if (error) {
                console.error("Patient insert failed:", error.message);
                return respond({ error: "Could not add patient record." }, 500);
            }
            const activityLogError = await recordActivity(
                supabase,
                `Added patient record for ${data.full_name}`,
                "Created a patient record."
            );
            return respond({ patient: data, activityLogError }, 201);
        }

        if (payload.id === null || payload.id === undefined || String(payload.id).trim() === "") {
            return respond({ error: "Patient ID is required." }, 400);
        }
        const { data, error } = await supabase
            .from("patients")
            .update(patient)
            .eq("id", payload.id)
            .select("*")
            .single();
        if (error) {
            console.error("Patient update failed:", error.message);
            return respond({ error: "Could not update patient record." }, 500);
        }
        const activityLogError = await recordActivity(
            supabase,
            `Updated patient record for ${data.full_name}`,
            "Changed patient record details."
        );
        return respond({ patient: data, activityLogError });
    }

    if (action === "delete") {
        if (!canManagePatients) {
            return respond({ error: "Only admins and clinic staff can change patient records." }, 403);
        }

        if (payload.id === null || payload.id === undefined || String(payload.id).trim() === "") {
            return respond({ error: "Patient ID is required." }, 400);
        }
        const { data, error } = await supabase
            .from("patients")
            .delete()
            .eq("id", payload.id)
            .select("full_name")
            .maybeSingle();
        if (error) {
            console.error("Patient delete failed:", error.message);
            return respond({ error: "Could not delete patient record." }, 500);
        }
        if (!data) return respond({ error: "Patient record not found." }, 404);
        const activityLogError = await recordActivity(
            supabase,
            `Deleted patient record for ${data?.full_name || `patient ${payload.id}`}`,
            "Deleted a patient record."
        );
        return respond({ success: true, activityLogError });
    }

    return respond({ error: "Unsupported patient operation." }, 400);
});
