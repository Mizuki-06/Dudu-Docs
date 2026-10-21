async function loadPatients() {
    const { data, error } = await db
        .from("patients")
        .select("*");

    if (error) {
        throw new Error(`Could not load patients: ${error.message}`);
    }

    return data;
}

async function registerPatient(patient) {
    const { error } = await db
        .from("patients")
        .insert(patient);

    if (error) {
        throw new Error(`Could not add patient: ${error.message}`);
    }

    return patient;
}