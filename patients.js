async function registerPatient() {
    const { data, error } = await db
        .from("patients")
        .insert({
            full_name: "Juan Demo",
            contact_number: "0000000000"
        })
        .select()
        .single();

    if (error) {
        console.error("Registration failed:", error.message);
        alert("Failed to register patient.");
        return;
    }

    console.log("Patient registered:", data);
    console.log("Patient code:", data.patient_code);

    alert("Patient registered successfully!");
}