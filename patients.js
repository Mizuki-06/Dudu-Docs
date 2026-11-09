async function callPatientFunction(body, operation) {
    const { data, error } = await db.functions.invoke("patients", { body });
    if (error) {
        let message = error.message;
        if (error.context && typeof error.context.json === "function") {
            try {
                const responseBody = await error.context.json();
                message = responseBody.error || message;
            } catch (responseError) {
                console.error("Could not read patient service error response:", responseError);
            }
        }
        throw new Error(`Could not ${operation}: ${message}`);
    }
    if (data?.activityLogError) {
        console.error("Patient change was saved, but activity logging failed:", data.activityLogError);
        if (typeof showToast === "function") {
            showToast(`Patient record saved, but activity logging failed: ${data.activityLogError}`);
        }
    }
    return data;
}

async function loadPatients() {
    const data = await callPatientFunction({ action: "list" }, "load patients");
    return data.patients;
}

async function registerPatient(patient) {
    const data = await callPatientFunction({ action: "create", patient }, "add patient");
    return data.patient;
}

async function updatePatientRecord(patientId, patient) {
    const data = await callPatientFunction({ action: "update", id: patientId, patient }, "update patient");
    return data.patient;
}

async function deletePatientRecord(patientId) {
    await callPatientFunction({ action: "delete", id: patientId }, "delete patient");
}