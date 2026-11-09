// --- 1. GLOBAL STATE INITIALIZATION ---
let appData = {
    doctors: [],
    patients: [],
    appointments: [],
    appointmentsTotal: 0,
    inquiries: [],
    activities: [],
    patientsError: '',
    appointmentsError: '',
    patientsLoading: false,
    appointmentsLoading: false
};
let currentUserRole = '';

function canManagePatients() {
    return currentUserRole === 'admin' || currentUserRole === 'clinic_staff';
}

async function initializePatientPermissions() {
    const { data: { user }, error } = await db.auth.getUser();
    if (error) throw error;

    currentUserRole = user?.app_metadata?.role || '';
    const addPatientButton = document.getElementById('add-patient-button');
    if (addPatientButton) {
        addPatientButton.hidden = !canManagePatients();
        addPatientButton.classList.toggle('hidden', !canManagePatients());
    }
}

// --- 2. TIME CONVERSION HELPERS ---
function formatTimeString(timeStr) {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    let hour = parseInt(parts[0], 10);
    const minute = parts[1] || '00';
    const period = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${String(hour).padStart(2, '0')}:${minute} ${period}`;
}

function formatTimeRange(start, end) {
    if (!start) return '';
    if (!end) return formatTimeString(start);
    return `${formatTimeString(start)} - ${formatTimeString(end)}`;
}

function parseTimeRange(slotStr) {
    const parts = slotStr.split('-').map(s => s.trim());
    const parseTime = (tStr) => {
        const match = tStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (!match) return null;
        let hour = parseInt(match[1], 10);
        const minute = match[2];
        const period = match[3].toUpperCase();
        if (period === 'PM' && hour < 12) hour += 12;
        if (period === 'AM' && hour === 12) hour = 0;
        return `${String(hour).padStart(2, '0')}:${minute}:00`;
    };
    return {
        start_time: parseTime(parts[0]) || '00:00:00',
        end_time: parts[1] ? parseTime(parts[1]) : null
    };
}

// --- 3. SUPABASE DATABASE API FETCHERS ---
async function fetchStaffRecords() {
    const { data, error } = await db
        .from('staff')
        .select('staff_id, full_name, specialization, role')
        .order('full_name', { ascending: true });
    
    if (error) {
        console.error('Error fetching staff:', error);
        return [];
    }
    return (data || [])
        .filter(s => {
            const role = String(s.role || '').trim().toLowerCase();
            return role ? role === 'doctor' || role === 'physician' : Boolean(String(s.specialization || '').trim());
        })
        .map(s => ({
            id: s.staff_id,
            staff_id: s.staff_id,
            name: s.full_name,
            specialty: s.specialization || s.role || 'General Practitioner',
            services: getDoctorServices({ specialty: s.specialization }),
            time: 'By Appointment',
            avatar: './images/babydududocslogo.jpg'
        }));
}

async function fetchPatients() {
    const { data, error } = await db
        .from('patients')
        .select('*')
        .order('full_name', { ascending: true });
    
    if (error) {
        console.error('Error fetching patients:', error);
        appData.patientsError = error.message;
        return [];
    }
    appData.patientsError = '';
    return data || [];
}

async function fetchAppointments() {
    // 1. Try foreign key relational join query
    const { data, error, count } = await db
        .from('appointments')
        .select(`
            id,
            patient_id,
            staff_id,
            service_type,
            appointment_date,
            start_time,
            end_time,
            notes,
            status,
            patients ( id, full_name ),
            staff ( staff_id, full_name, specialization )
        `, { count: 'exact' })
        .order('appointment_date', { ascending: true });

    if (error) {
        console.warn('Relational fetch failed, attempting fallback query:', error.message);
        
        // 2. Fallback query if FK relationship caching is pending in Supabase
        const { data: simpleData, error: simpleError, count: simpleCount } = await db
            .from('appointments')
            .select('*', { count: 'exact' })
            .order('appointment_date', { ascending: true });

        if (simpleError) {
            console.error('Error fetching appointments:', simpleError);
            throw simpleError;
        }

        appData.appointmentsTotal = simpleCount ?? (simpleData || []).length;
        return (simpleData || []).map(item => {
            const patientObj = appData.patients.find(p => String(p.id) === String(item.patient_id));
            const staffObj = appData.doctors.find(d => String(d.staff_id || d.id) === String(item.staff_id));
            return {
                id: item.id,
                patient_id: item.patient_id,
                patient: patientObj?.full_name || 'Unknown Patient',
                staff_id: item.staff_id,
                doctor: staffObj?.name || 'Unknown Staff',
                service: item.service_type,
                date: item.appointment_date,
                time: formatTimeRange(item.start_time, item.end_time),
                notes: item.notes || '',
                status: item.status || 'Scheduled'
            };
        });
    }

    appData.appointmentsTotal = count ?? (data || []).length;
    return (data || []).map(item => ({
        id: item.id,
        patient_id: item.patient_id,
        patient: item.patients?.full_name || 'Unknown Patient',
        staff_id: item.staff_id,
        doctor: item.staff?.full_name || 'Unknown Staff',
        service: item.service_type,
        date: item.appointment_date,
        time: formatTimeRange(item.start_time, item.end_time),
        notes: item.notes || '',
        status: item.status || 'Scheduled'
    }));
}

async function fetchInquiries() {
    const { data, error } = await db
        .from('inquiries')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching inquiries:', error);
        return [];
    }
    return (data || []).map(inq => ({
        id: inq.inquiry_id,
        patient: inq.patient_name || 'Guest Patient',
        question: inq.message || inq.subject || '',
        status: inq.status || 'Pending',
        time: inq.created_at ? new Date(inq.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
    }));
}

async function fetchActivities() {
    const { data, error } = await db
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error fetching activity logs:', error);
        return [];
    }
    return (data || []).map(act => ({
        user: act.user || 'Clinic Staff',
        action: act.action || act.description || 'Performed action',
        time: act.created_at ? new Date(act.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : ''
    }));
}

async function recordActivity(action, description) {
    const { error } = await db.from('activity_logs').insert([{ action, description }]);
    if (error) {
        console.error('Could not record activity:', error);
        return error;
    }

    appData.activities.unshift({ user: 'Clinic Staff', action, time: 'Just now' });
    appData.activities = appData.activities.slice(0, 10);
    renderActivityStream();
    return null;
}

// --- 4. DATA INITIALIZATION PROCEDURE ---
async function loadAllDatabaseRecords() {
    appData.appointmentsLoading = true;
    appData.patientsLoading = true;
    appData.appointmentsError = '';

    try {
        const [doctorsRes, patientsRes, inquiriesRes, activitiesRes] = await Promise.all([
            fetchStaffRecords(),
            fetchPatients(),
            fetchInquiries(),
            fetchActivities()
        ]);

        appData.doctors = doctorsRes;
        appData.patients = patientsRes;
        appData.inquiries = inquiriesRes;
        appData.activities = activitiesRes;

        // Fetch appointments after doctors and patients exist for fallback resolution
        try {
            appData.appointments = await fetchAppointments();
        } catch (error) {
            appData.appointmentsError = error.message || 'Could not load appointments.';
            throw error;
        }
    } catch (error) {
        console.error('Database load error detail:', error);
        showToast(`Failed to sync database: ${error.message || 'Check console log'}`);
    } finally {
        appData.appointmentsLoading = false;
        appData.patientsLoading = false;
        
        renderDoctorSidebar();
        renderPatientsTable();
        renderDashboardMetrics();
        renderInquiriesAndFeedback();
        renderActivityStream();
        renderMiniCalendar();
        populateSelects();
    }
}

// --- 5. NAVIGATION & TAB SWITCHING ---
function switchTab(tabId) {
    const pages = {
        dashboard: 'index.html',
        patients: 'patients.html',
        appointments: 'appointments.html',
        reports: 'reports.html',
        inquiries: 'inquiries.html',
        staff: 'staff.html',
        settings: 'settings.html'
    };
    if (pages[tabId]) window.location.href = pages[tabId];
}

function initializePageNavigation() {
    const page = document.body.dataset.page;
    document.querySelectorAll('[data-page-link]').forEach(link => {
        if (!link.id && !link.closest('.mobile-navigation')) return;
        const active = link.dataset.pageLink === page;
        if (link.id) {
            link.classList.toggle('bg-brand-600', active);
            link.classList.toggle('text-white', active);
            link.classList.toggle('shadow-sm', active);
            link.classList.toggle('text-slate-600', !active);
            link.classList.toggle('hover:text-slate-900', !active);
        } else {
            link.classList.toggle('bg-brand-600', active);
            link.classList.toggle('text-white', active);
            link.classList.toggle('rounded-full', active);
            link.classList.toggle('text-slate-600', !active);
        }
    });
    const settingsButton = document.getElementById('settings-nav-button');
    if (settingsButton) {
        const active = page === 'settings';
        settingsButton.classList.toggle('is-active', active);
        settingsButton.setAttribute('aria-pressed', String(active));
    }
}

// --- 6. UI RENDERING FUNCTIONS ---
function renderDoctorSidebar() {
    const container = document.getElementById('doctor-list-container');
    if (!container) return;

    container.innerHTML = appData.doctors.map(doc => `
        <article class="doctor-schedule-item">
            <img src="${doc.avatar}" alt="" class="doctor-schedule-avatar" loading="lazy">
            <div class="doctor-schedule-info">
                <p class="doctor-schedule-name">${escapeHtml(doc.name)}</p>
                <p class="doctor-schedule-specialty">${escapeHtml(doc.specialty)}</p>
            </div>
            <div class="doctor-schedule-hours">
                <i data-lucide="clock" aria-hidden="true"></i>
                <span>${escapeHtml(doc.time)}</span>
            </div>
        </article>
    `).join('');
    if (window.lucide) lucide.createIcons();
}

function getPatientAge(dateOfBirth) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateOfBirth || ''));
    if (!match) return null;

    const birthYear = Number(match[1]);
    const birthMonth = Number(match[2]) - 1;
    const birthDay = Number(match[3]);
    const birthDate = new Date(birthYear, birthMonth, birthDay);
    if (
        birthDate.getFullYear() !== birthYear ||
        birthDate.getMonth() !== birthMonth ||
        birthDate.getDate() !== birthDay
    ) return null;

    const today = new Date();
    let age = today.getFullYear() - birthYear;
    if (
        today.getMonth() < birthMonth ||
        (today.getMonth() === birthMonth && today.getDate() < birthDay)
    ) age--;

    return age >= 0 ? age : null;
}

function renderPatientsTable() {
    const tbody = document.getElementById('patients-table-body');
    const searchVal = (document.getElementById('patient-search-input')?.value || '').toLowerCase();
    if (!tbody) return;

    if (appData.patientsError) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-rose-600">Could not load patient records: ${escapeHtml(appData.patientsError)}</td></tr>`;
        return;
    }

    if (appData.patientsLoading && !appData.patients.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="p-6 text-center text-slate-500">Loading patient records...</td></tr>';
        return;
    }

    const filtered = appData.patients.filter(p => 
        [p.full_name, p.email, p.contact_number].some(value =>
            String(value || '').toLowerCase().includes(searchVal)
        )
    );

    if (!filtered.length) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-slate-500">${searchVal ? 'No matching patients found.' : 'No patient records found.'}</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(p => {
        const index = appData.patients.indexOf(p);
        const age = getPatientAge(p.date_of_birth);
        return `
            <tr class="hover:bg-slate-50/80 transition">
                <td class="p-4 font-bold text-slate-800">${displayValue(p.full_name)}</td>
                <td class="p-4">
                    <p class="font-medium text-slate-700">${displayValue(p.contact_number)}</p>
                    <p class="text-slate-400 text-[11px]">${displayValue(p.email)}</p>
                </td>
                <td class="p-4 font-medium">${age === null ? '—' : `${age} Yrs`} / ${displayValue(p.sex)}</td>
                <td class="p-4"><span class="px-2 py-0.5 bg-brand-50 text-brand-700 font-bold rounded-lg">${displayValue(p.blood_group)}</span></td>
                <td class="p-4 text-slate-500 font-medium">${displayValue(p.last_visit)}</td>
                <td class="p-4 text-right">
                    <button type="button" onclick="openPatientDetails(${index})" class="px-3 py-1 bg-brand-50 hover:bg-brand-100 text-brand-700 font-semibold rounded-xl text-[11px] transition">
                        View Details
                    </button>
                    ${canManagePatients() ? `
                    <button type="button" onclick="openEditPatient(${index})" class="px-3 py-1 ml-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-[11px] transition" aria-label="Edit ${escapeHtml(p.full_name)}">
                        Edit
                    </button>
                    <button type="button" onclick="deletePatient(${index})" class="px-3 py-1 ml-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-xl text-[11px] transition" aria-label="Delete ${escapeHtml(p.full_name)}">
                        Delete
                    </button>
                    ` : ''}
                </td>
            </tr>
        `;
    }).join('');
}

function openPatientDetails(index) {
    const patient = appData.patients[index];
    if (!patient) return;
    const age = getPatientAge(patient.date_of_birth);

    const details = [
        ['Full Name', patient.full_name],
        ['Date of Birth', patient.date_of_birth],
        ['Age', age === null ? null : `${age} years`],
        ['Sex', patient.sex],
        ['Contact Number', patient.contact_number],
        ['Email', patient.email],
        ['Address', patient.address],
        ['Allergies', patient.allergies],
        ['Medical History', patient.medical_history],
        ['Blood Group', patient.blood_group],
        ['Last Visit', patient.last_visit],
        ['Status', patient.status]
    ];
    const content = document.getElementById('patient-details-content');
    if (!content) return;

    content.innerHTML = details.map(([label, value]) => `
        <div class="rounded-xl bg-slate-50 p-3">
            <dt class="text-[11px] font-semibold text-slate-500">${escapeHtml(label)}</dt>
            <dd class="mt-1 break-words text-sm text-slate-800">${displayValue(value)}</dd>
        </div>
    `).join('');
    document.getElementById('patient-details-title').textContent = patient.full_name || 'Patient Details';
    document.getElementById('modal-patient-details')?.classList.remove('hidden');
}

function openAddPatientModal() {
    if (!canManagePatients()) {
        showToast('Only admins and clinic staff can manage patient records.');
        return;
    }

    const form = document.getElementById('patient-form');
    form?.reset();
    document.getElementById('patient-id').value = '';
    document.getElementById('patient-modal-title').textContent = 'Add New Patient Record';
    document.getElementById('patient-submit-button').textContent = 'Save Record';
    clearPatientValidation();
    document.getElementById('modal-add-patient')?.classList.remove('hidden');
}

function openEditPatient(index) {
    if (!canManagePatients()) {
        showToast('Only admins and clinic staff can manage patient records.');
        return;
    }

    const patient = appData.patients[index];
    if (!patient) return;

    document.getElementById('patient-id').value = patient.id;
    document.getElementById('patient-name').value = patient.full_name || '';
    document.getElementById('patient-date-of-birth').value = patient.date_of_birth || '';
    document.getElementById('patient-gender').value = patient.sex || '';
    document.getElementById('patient-phone').value = patient.contact_number || '';
    document.getElementById('patient-email').value = patient.email || '';
    document.getElementById('patient-address').value = patient.address || '';
    document.getElementById('patient-allergies').value = patient.allergies || '';
    document.getElementById('patient-medical-history').value = patient.medical_history || '';
    document.getElementById('patient-last-visit').value = patient.last_visit || '';
    document.getElementById('patient-status').value = patient.status || 'active';
    document.getElementById('patient-blood').value = patient.blood_group || '';
    document.getElementById('patient-modal-title').textContent = 'Edit Patient Record';
    document.getElementById('patient-submit-button').textContent = 'Save Changes';
    clearPatientValidation();
    document.getElementById('modal-add-patient')?.classList.remove('hidden');
}

function clearPatientValidation() {
    ['patient-name', 'patient-phone', 'patient-email'].forEach(fieldId => {
        const input = document.getElementById(fieldId);
        const error = document.getElementById(`${fieldId}-error`);
        if (input) input.removeAttribute('aria-invalid');
        if (error) {
            error.textContent = '';
            error.classList.add('hidden');
        }
    });
}

function validatePatientField(fieldId) {
    const input = document.getElementById(fieldId);
    const error = document.getElementById(`${fieldId}-error`);
    if (!input || !error) return true;

    let message = '';
    if (fieldId === 'patient-name' && !input.value.trim()) {
        message = "Please enter the patient's full name.";
    } else if (fieldId === 'patient-phone' && !input.value.trim()) {
        message = 'Please enter a contact number.';
    } else if (fieldId === 'patient-email' && input.value && !input.validity.valid) {
        message = 'Please enter a valid email address.';
    }

    input.toggleAttribute('aria-invalid', Boolean(message));
    error.textContent = message;
    error.classList.toggle('hidden', !message);
    return !message;
}

async function handleSavePatient(event) {
    event.preventDefault();
    if (!canManagePatients()) {
        showToast('Only admins and clinic staff can manage patient records.');
        return;
    }

    const fieldsValid = ['patient-name', 'patient-phone', 'patient-email']
        .map(validatePatientField)
        .every(Boolean);
    if (!fieldsValid) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const patient = {
        full_name: String(formData.get('full_name') || '').trim(),
        date_of_birth: formData.get('date_of_birth') || null,
        sex: formData.get('sex') || null,
        contact_number: String(formData.get('contact_number') || '').trim(),
        email: String(formData.get('email') || '').trim() || null,
        address: String(formData.get('address') || '').trim() || null,
        allergies: String(formData.get('allergies') || '').trim() || null,
        medical_history: String(formData.get('medical_history') || '').trim() || null,
        last_visit: formData.get('last_visit') || null,
        status: formData.get('status'),
        blood_group: formData.get('blood_group') || null
    };
    const patientId = document.getElementById('patient-id').value;
    const submitButton = document.getElementById('patient-submit-button');
    submitButton.disabled = true;
    submitButton.textContent = 'Saving...';

    try {
        const savedPatient = patientId
            ? await updatePatientRecord(patientId, patient)
            : await registerPatient(patient);
        const existingIndex = appData.patients.findIndex(item => String(item.id) === String(savedPatient.id));
        if (existingIndex < 0) appData.patients.unshift(savedPatient);
        else appData.patients[existingIndex] = savedPatient;
        appData.patientsError = '';
        form.reset();
        document.getElementById('patient-id').value = '';
        closeModal('modal-add-patient');
        renderPatientsTable();
        showToast(patientId ? 'Patient record updated.' : `Added new patient: ${patient.full_name}`);
    } catch (error) {
        console.error('Could not save patient record:', error);
        showToast(error.message || 'Could not save patient record.');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = patientId ? 'Save Changes' : 'Save Record';
    }
}

async function deletePatient(index) {
    if (!canManagePatients()) {
        showToast('Only admins and clinic staff can manage patient records.');
        return;
    }

    const patient = appData.patients[index];
    if (!patient) return;
    if (!window.confirm(`Delete the patient record for ${patient.full_name}?`)) return;

    try {
        await deletePatientRecord(patient.id);
        appData.patients.splice(index, 1);
        renderPatientsTable();
        showToast(`Deleted patient record for ${patient.full_name}.`);
    } catch (error) {
        console.error('Could not delete patient record:', error);
        showToast(error.message || 'Could not delete patient record.');
    }
}

function renderDashboardMetrics() {
    const totalAppointments = document.getElementById('dashboard-total-appointments');
    const totalPatients = document.getElementById('dashboard-total-patients');
    const pendingAppointments = document.getElementById('dashboard-pending-appointments');
    const activeDoctors = document.getElementById('dashboard-active-doctors');

    if (totalAppointments) {
        totalAppointments.textContent = appData.appointmentsError ? '—' : appData.appointmentsTotal.toLocaleString();
    }
    if (totalPatients) totalPatients.textContent = appData.patients.length.toLocaleString();
    if (pendingAppointments) {
        const closedStatuses = ['Completed', 'Cancelled'];
        const count = appData.appointments.filter(appointment =>
            !closedStatuses.includes(normalizeAppointmentStatus(appointment.status))
        ).length;
        pendingAppointments.textContent = appData.appointmentsError ? '—' : count.toLocaleString();
    }
    if (activeDoctors) activeDoctors.textContent = appData.doctors.length.toLocaleString();
    renderWeeklyTrafficChart();
}

function renderWeeklyTrafficChart() {
    const canvas = document.getElementById('dashboardChart');
    if (!canvas) return;
    const status = document.getElementById('dashboard-chart-status');
    if (appData.appointmentsError) {
        const existingChart = typeof Chart === 'undefined' ? null : Chart.getChart(canvas);
        if (existingChart) existingChart.destroy();
        canvas.hidden = true;
        if (status) {
            status.textContent = 'Appointment data could not be loaded.';
            status.classList.remove('hidden');
            status.classList.add('flex');
        }
        console.error('Weekly traffic chart unavailable:', appData.appointmentsError);
        return;
    }
    if (typeof Chart === 'undefined') {
        canvas.hidden = true;
        if (status) {
            status.textContent = 'Weekly chart is unavailable right now.';
            status.classList.remove('hidden');
            status.classList.add('flex');
        }
        console.error('Chart.js is not available; weekly traffic chart could not be rendered.');
        return;
    }
    canvas.hidden = false;
    if (status) {
        status.classList.add('hidden');
        status.classList.remove('flex');
    }

    const today = new Date();
    const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
    const days = Array.from({ length: 7 }, (_, index) => {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + index);
        return date;
    });
    const labels = days.map(date => date.toLocaleDateString(undefined, { weekday: 'short' }));
    const counts = days.map(date => {
        const key = dateKey(date);
        return appData.appointments.filter(appointment => appointment.date === key).length;
    });
    const existingChart = Chart.getChart(canvas);
    if (existingChart) existingChart.destroy();

    new Chart(canvas, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Appointments',
                data: counts,
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.12)',
                fill: true,
                tension: 0.35,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { precision: 0 }
                }
            }
        }
    });
}

function displayValue(value) {
    return value === null || value === undefined || value === '' ? '—' : escapeHtml(value);
}

function renderInquiriesAndFeedback() {
    const inqContainer = document.getElementById('inquiry-list-container');
    const inquiryCount = document.getElementById('inquiry-count');

    if (inqContainer) {
        const inquiries = Array.isArray(appData.inquiries) ? appData.inquiries : [];
        if (inquiryCount) {
            inquiryCount.textContent = `${inquiries.length} ${inquiries.length === 1 ? 'Inquiry' : 'Inquiries'}`;
        }

        if (inquiries.length === 0) {
            inqContainer.innerHTML = '<p class="text-sm text-slate-500 py-4 text-center">No inquiries available yet.</p>';
        } else {
            inqContainer.innerHTML = inquiries.map(inq => `
                <div class="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-2">
                    <div class="flex items-center justify-between text-xs gap-3">
                        <span class="font-bold text-slate-800">${escapeHtml(inq.patient)}</span>
                        <span class="text-slate-400 text-[10px]">${escapeHtml(inq.time)}</span>
                    </div>
                    <p class="text-xs text-slate-600">${escapeHtml(inq.question)}</p>
                    <div class="flex items-center justify-between pt-2">
                        <span class="px-2 py-0.5 rounded-md text-[10px] font-bold ${inq.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}">
                            ${escapeHtml(inq.status)}
                        </span>
                        <button onclick="resolveInquiry(${Number(inq.id)})" class="text-xs text-brand-600 font-semibold hover:underline">
                            Reply / Resolve
                        </button>
                    </div>
                </div>
            `).join('');
        }
    }
}

function renderActivityStream() {
    const container = document.getElementById('recent-activity-stream');
    if (!container) return;

    if (!appData.activities.length) {
        container.innerHTML = '<p class="text-xs text-slate-500">No recent activity has been recorded.</p>';
        return;
    }

    container.innerHTML = appData.activities.map(act => `
        <div class="flex items-start gap-3 text-xs">
            <div class="w-2 h-2 rounded-full bg-brand-600 mt-1.5"></div>
            <div>
                <p class="font-bold text-slate-800">${escapeHtml(act.user)}</p>
                <p class="text-slate-500">${escapeHtml(act.action)}</p>
                <p class="text-[10px] text-slate-400 mt-0.5">${escapeHtml(act.time)}</p>
            </div>
        </div>
    `).join('');
}

// --- 7. MODAL POPULATION AND MUTATIONS ---
function populateSelects() {
    const patientSel = document.getElementById('book-patient-select');
    const doctorSel = document.getElementById('book-doctor-select');

    if (patientSel) {
        patientSel.replaceChildren();
        appData.patients.forEach(patient => {
            const option = document.createElement('option');
            option.value = patient.id; // int8 PK
            option.textContent = patient.full_name || patient.name;
            patientSel.append(option);
        });
        if (!appData.patients.length) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No patients available';
            patientSel.append(option);
        }
    }
    if (doctorSel) {
        doctorSel.replaceChildren();
        appData.doctors.forEach(doctor => {
            const option = document.createElement('option');
            option.value = doctor.staff_id || doctor.id; // int8 FK
            option.textContent = `${doctor.name} (${doctor.specialty})`;
            doctorSel.append(option);
        });
        if (!appData.doctors.length) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No doctors available';
            doctorSel.append(option);
        }
    }
    populateServiceTypes();
}

function getDoctorServices(doctor) {
    if (Array.isArray(doctor?.services) && doctor.services.length) return doctor.services;
    const specialty = String(doctor?.specialty || '').toLowerCase();
    if (specialty.includes('pediatric') && specialty.includes('breastfeeding')) return ['Pediatric consultation', 'Breastfeeding and lactation consultation'];
    if (specialty.includes('breastfeeding') || specialty.includes('lactation')) return ['Breastfeeding and lactation consultation'];
    if (specialty.includes('sonology')) return ['OB-GYN consultation', 'Ultrasound / sonology'];
    if (specialty.includes('ob-gyn')) return ['OB-GYN consultation', 'Prenatal consultation'];
    if (specialty.includes('internal medicine')) return ['Internal medicine consultation'];
    return doctor?.specialty ? [`${doctor.specialty} consultation`] : ['General consultation'];
}

function populateServiceTypes(selectedService = '') {
    const serviceSelect = document.getElementById('book-service-type');
    if (!serviceSelect) return;
    const doctorId = document.getElementById('book-doctor-select')?.value || '';
    const doctor = appData.doctors.find(item => String(item.staff_id || item.id) === String(doctorId));
    const services = getDoctorServices(doctor);
    serviceSelect.replaceChildren();
    services.forEach(service => {
        const option = document.createElement('option');
        option.value = service;
        option.textContent = service;
        serviceSelect.append(option);
    });
    if (selectedService && !services.includes(selectedService)) {
        const legacyOption = document.createElement('option');
        legacyOption.value = selectedService;
        legacyOption.textContent = `${selectedService} (existing appointment)`;
        serviceSelect.append(legacyOption);
    }
    serviceSelect.value = selectedService && [...serviceSelect.options].some(option => option.value === selectedService)
        ? selectedService
        : services[0] || '';
}

function openEditScheduleModal(id) {
    const appointment = appData.appointments.find(item => String(item.id) === String(id));
    const form = document.querySelector('#modal-book-appointment form');
    if (!appointment || !form) return;
    populateSelects();
    form.reset();
    document.getElementById('book-appointment-id').value = String(appointment.id);
    document.getElementById('book-patient-select').value = appointment.patient_id;
    document.getElementById('book-doctor-select').value = appointment.staff_id;
    populateServiceTypes(appointment.service);
    document.getElementById('book-date').value = appointment.date;
    document.getElementById('book-date').min = '';
    refreshAppointmentTimeSlots(appointment.id);
    document.getElementById('book-time').value = appointment.time;
    document.getElementById('book-notes').value = appointment.notes || '';
    document.getElementById('book-appointment-modal-title').textContent = 'Edit Appointment';
    document.getElementById('book-appointment-submit').textContent = 'Save Changes';
    document.getElementById('modal-book-appointment')?.classList.remove('hidden');
}

function openNewAppointmentModal() {
    populateSelects();
    const form = document.querySelector('#modal-book-appointment form');
    form?.reset();
    document.getElementById('book-appointment-id').value = '';
    document.getElementById('book-appointment-modal-title').textContent = 'Book New Appointment';
    document.getElementById('book-appointment-submit').textContent = 'Confirm Booking';
    const dateInput = document.getElementById('book-date');
    if (dateInput) {
        const today = dateKey(new Date());
        const selectedDate = dateKey(selectedCalendarDate);
        dateInput.value = selectedDate >= today ? selectedDate : today;
        dateInput.min = today;
    }
    refreshAppointmentTimeSlots();
    document.getElementById('modal-book-appointment')?.classList.remove('hidden');
}

function closeModal(id) {
    document.getElementById(id)?.classList.add('hidden');
}

async function handleBookAppointment(e) {
    e.preventDefault();
    const submitButton = document.getElementById('book-appointment-submit');
    const appointmentId = document.getElementById('book-appointment-id').value;
    const patientId = document.getElementById('book-patient-select').value;
    const staffId = document.getElementById('book-doctor-select').value;
    const service = document.getElementById('book-service-type').value;
    const date = document.getElementById('book-date').value;
    const timeSlot = document.getElementById('book-time').value;
    const notes = document.getElementById('book-notes').value.trim();

    if (!patientId || !staffId || !service || !date || !timeSlot) {
        showToast('Complete all required appointment details.');
        return;
    }

    const { start_time, end_time } = parseTimeRange(timeSlot);
    const selectedDoctor = appData.doctors.find(d => String(d.staff_id || d.id) === String(staffId));
    const selectedPatient = appData.patients.find(p => String(p.id) === String(patientId));

    if (submitButton) submitButton.disabled = true;

    try {
        const payload = {
            patient_id: parseInt(patientId, 10),
            staff_id: parseInt(staffId, 10),
            service_type: service,
            appointment_date: date,
            start_time: start_time,
            end_time: end_time,
            notes: notes
        };

        if (appointmentId) {
            const previousAppointment = appData.appointments.find(item => String(item.id) === String(appointmentId));
            const { error } = await db
                .from('appointments')
                .update(payload)
                .eq('id', appointmentId);

            if (error) throw error;
            const changes = [];
            if (previousAppointment && String(previousAppointment.patient_id) !== String(patientId)) {
                changes.push(`Patient: ${previousAppointment.patient} to ${selectedPatient?.full_name || 'patient'}`);
            }
            if (previousAppointment && String(previousAppointment.staff_id) !== String(staffId)) {
                changes.push(`Doctor: ${previousAppointment.doctor} to ${selectedDoctor?.name || 'doctor'}`);
            }
            if (previousAppointment && previousAppointment.service !== service) {
                changes.push(`Service: ${previousAppointment.service} to ${service}`);
            }
            if (previousAppointment && previousAppointment.date !== date) {
                changes.push(`Date: ${previousAppointment.date} to ${date}`);
            }
            const newTime = formatTimeRange(start_time, end_time);
            if (previousAppointment && previousAppointment.time !== newTime) {
                changes.push(`Time: ${previousAppointment.time} to ${newTime}`);
            }
            if (previousAppointment && previousAppointment.notes !== notes) {
                changes.push('Appointment notes updated.');
            }
            const activityError = await recordActivity(
                `Updated appointment for ${selectedPatient?.full_name || previousAppointment?.patient || 'patient'} on ${date}`,
                changes.join('; ') || `Updated appointment details for ${service} with ${selectedDoctor?.name || 'doctor'}.`
            );
            showToast(activityError
                ? `Appointment saved, but activity logging failed: ${activityError.message}`
                : `Appointment updated for ${selectedPatient?.full_name || 'patient'}.`);
        } else {
            payload.status = 'Confirmed';
            const { error } = await db
                .from('appointments')
                .insert([payload]);

            if (error) throw error;

            const activityError = await recordActivity(
                `Booked an appointment for ${selectedPatient?.full_name || 'patient'} on ${date}`,
                `${service} with ${selectedDoctor?.name || 'doctor'} at ${formatTimeRange(start_time, end_time)}`
            );
            showToast(activityError
                ? `Appointment saved, but activity logging failed: ${activityError.message}`
                : `Appointment booked for ${selectedPatient?.full_name || 'patient'}!`);
        }

        appData.appointments = await fetchAppointments();
        appData.appointmentsError = '';
        renderDashboardMetrics();
        appData.activities = await fetchActivities();

        const [year, month, day] = date.split('-').map(Number);
        selectedCalendarDate = new Date(year, month - 1, day);
        calendarMonth = new Date(year, month - 1, 1);
        renderMiniCalendar();
        renderActivityStream();
        closeModal('modal-book-appointment');
        document.querySelector('#modal-book-appointment form')?.reset();
    } catch (error) {
        console.error('Error saving appointment:', error);
        showToast(`Failed to save appointment: ${error.message}`);
    } finally {
        if (submitButton) submitButton.disabled = false;
    }
}

async function deleteAppointment(id) {
    const appointment = appData.appointments.find(item => String(item.id) === String(id));
    if (!appointment) return;

    if (!window.confirm(`Delete the appointment for ${appointment.patient} on ${appointment.date}? This cannot be undone.`)) return;

    try {
        const { error } = await db
            .from('appointments')
            .delete()
            .eq('id', id);

        if (error) throw error;

        appData.appointments = appData.appointments.filter(item => String(item.id) !== String(id));
        appData.appointmentsTotal = Math.max(0, appData.appointmentsTotal - 1);
        appData.appointmentsError = '';
        renderDashboardMetrics();
        renderMiniCalendar();
        const activityError = await recordActivity(
            `Deleted appointment for ${appointment.patient} on ${appointment.date}`,
            `${appointment.service} with ${appointment.doctor} at ${appointment.time}`
        );
        showToast(activityError
            ? `Appointment deleted, but activity logging failed: ${activityError.message}`
            : 'Appointment deleted.');
    } catch (error) {
        console.error('Error deleting appointment:', error);
        showToast(`Failed to delete appointment: ${error.message}`);
    }
}

async function completeAppointment(id) {
    const appointment = appData.appointments.find(item => String(item.id) === String(id));
    if (!appointment) return;

    if (normalizeAppointmentStatus(appointment.status) === 'Completed') {
        showToast('This appointment is already completed.');
        return;
    }

    if (!window.confirm(`Mark the appointment for ${appointment.patient} on ${appointment.date} as completed?`)) return;

    try {
        const { error } = await db
            .from('appointments')
            .update({ status: 'Completed' })
            .eq('id', id);

        if (error) throw error;

        appointment.status = 'Completed';
        renderDashboardMetrics();
        renderMiniCalendar();
        const activityError = await recordActivity(
            `Completed appointment for ${appointment.patient} on ${appointment.date}`,
            `${appointment.service} with ${appointment.doctor} at ${appointment.time}`
        );
        showToast(activityError
            ? `Appointment completed, but activity logging failed: ${activityError.message}`
            : `Appointment for ${appointment.patient} marked completed.`);
    } catch (error) {
        console.error('Error updating appointment:', error);
        showToast(`Failed to update status: ${error.message}`);
    }
}

async function resolveInquiry(id) {
    const inq = appData.inquiries.find(i => i.id === id);
    if (!inq) return;

    const reply = prompt(`Patient inquiry:\n${inq.question}\n\nType your reply to the patient:`);
    if (reply === null || !reply.trim()) return;

    try {
        const { error } = await db
            .from('inquiries')
            .update({ status: 'Responded' })
            .eq('inquiry_id', id);

        if (error) throw error;

        inq.status = 'Responded';
        renderInquiriesAndFeedback();
        const activityError = await recordActivity(
            `Resolved inquiry from ${inq.patient}`,
            'Marked the inquiry as responded.'
        );
        showToast(activityError
            ? `Inquiry resolved, but activity logging failed: ${activityError.message}`
            : 'Reply saved successfully.');
    } catch (error) {
        console.error('Error resolving inquiry:', error);
        showToast(`Failed to update inquiry: ${error.message}`);
    }
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-message');
    if (toast && toastMsg) {
        toastMsg.innerText = msg;
        toast.classList.remove('translate-y-20', 'opacity-0');
        setTimeout(() => {
            toast.classList.add('translate-y-20', 'opacity-0');
        }, 3000);
    }
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character]);
}

// --- 8. CALENDAR AND SCHEDULER ---
let calendarMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let selectedCalendarDate = new Date();
let appliedAppointmentFilters = { from: '', to: '', doctor: '', view: 'all' };

function dateKey(d) {
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}

function getFilteredAppointments() {
    const { from, to, doctor, view } = appliedAppointmentFilters;
    const today = dateKey(new Date());
    const query = (document.getElementById('appointment-search')?.value || '').trim().toLowerCase();
    return appData.appointments.filter(appointment =>
        (!from || appointment.date >= from) &&
        (!to || appointment.date <= to) &&
        (!doctor || appointment.doctor === doctor) &&
        (view === 'all' || (view === 'today' ? appointment.date === today : appointment.date > today)) &&
        (!query || `${appointment.patient} ${appointment.doctor} ${appointment.service} ${appointment.notes || ''}`.toLowerCase().includes(query))
    );
}

function createAppointmentActions(appointment) {
    const actions = document.createElement('div');
    actions.className = 'mt-2 flex flex-wrap justify-end gap-1';
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'rounded-lg border border-slate-200 px-1.5 py-1 text-[10px] font-semibold text-slate-700 hover:bg-slate-50';
    edit.textContent = 'Edit';
    edit.addEventListener('click', () => openEditScheduleModal(appointment.id));
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'rounded-lg border border-rose-200 px-1.5 py-1 text-[10px] font-semibold text-rose-700 hover:bg-rose-50';
    remove.textContent = 'Delete';
    remove.addEventListener('click', () => deleteAppointment(appointment.id));
    actions.append(edit);
    if (normalizeAppointmentStatus(appointment.status) !== 'Completed') {
        const complete = document.createElement('button');
        complete.type = 'button';
        complete.className = 'rounded-lg border border-emerald-200 px-1.5 py-1 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-50';
        complete.textContent = 'Complete';
        complete.addEventListener('click', () => completeAppointment(appointment.id));
        actions.append(complete);
    }
    actions.append(remove);
    return actions;
}

function renderBookedAppointments() {
    const list = document.getElementById('booked-appointments-list');
    if (!list) return;
    const dateLabel = document.getElementById('booked-appointments-date');
    if (dateLabel) dateLabel.textContent = selectedCalendarDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const appointments = getFilteredAppointments().filter(appointment => appointment.date === dateKey(selectedCalendarDate));
    list.replaceChildren();
    if (!appointments.length) {
        const empty = document.createElement('p');
        empty.className = 'rounded-xl bg-slate-50 p-3 text-xs text-slate-500';
        empty.textContent = 'No booked appointments for this day.';
        list.append(empty);
        return;
    }
    appointments.forEach(appointment => {
        const card = document.createElement('article');
        card.className = 'rounded-xl border border-slate-200 bg-white p-3';
        const details = document.createElement('div');
        details.className = 'flex flex-wrap items-start justify-between gap-2';
        const summary = document.createElement('div');
        const service = document.createElement('p');
        service.className = 'font-semibold text-slate-800';
        service.textContent = appointment.service;
        const patient = document.createElement('p');
        patient.className = 'mt-1 text-slate-600';
        patient.textContent = `${appointment.patient} · ${appointment.doctor}`;
        summary.append(service, patient);
        const time = document.createElement('span');
        time.className = 'shrink-0 rounded-lg bg-brand-50 px-2 py-1 font-semibold text-brand-700';
        time.textContent = appointment.time;
        details.append(summary, time);
        card.append(details);
        if (appointment.notes) {
            const notes = document.createElement('p');
            notes.className = 'mt-2 whitespace-pre-wrap text-slate-500';
            notes.textContent = appointment.notes;
            card.append(notes);
        }
        card.append(createAppointmentActions(appointment));
        list.append(card);
    });
}

function normalizeAppointmentStatus(status) {
    const value = String(status || 'Scheduled').trim();
    const knownStatuses = {
        scheduled: 'Scheduled',
        completed: 'Completed',
        cancelled: 'Cancelled',
        canceled: 'Cancelled',
        rescheduled: 'Rescheduled'
    };
    return knownStatuses[value.toLowerCase()] || value || 'Unspecified';
}

function renderMiniCalendar() {
    const grid = document.getElementById('mini-calendar-grid');
    if (!grid) return;
    const title = document.getElementById('mini-calendar-title');
    const monthLabel = calendarMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    if (title) title.textContent = monthLabel;
    const first = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7;
    const days = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
    const prevDays = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 0).getDate();
    const cells = [];

    for (let i = 0; i < 42; i++) {
        let day, date, other = false;
        if (i < offset) {
            day = prevDays - offset + i + 1;
            date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, day);
            other = true;
        } else if (i >= offset + days) {
            day = i - offset - days + 1;
            date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, day);
            other = true;
        } else {
            day = i - offset + 1;
            date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
        }
        const value = dateKey(date);
        const selected = value === dateKey(selectedCalendarDate);
        const today = value === dateKey(new Date());
        const appointmentCount = appData.appointments.filter(appointment => appointment.date === value).length;
        const colorClass = selected
            ? 'bg-brand-600 text-white font-bold shadow-sm'
            : today
                ? 'border border-brand-600 text-brand-700'
                : other
                    ? 'text-slate-300'
                    : 'hover:bg-slate-100';
        const marker = appointmentCount
            ? `<span class="absolute bottom-0.5 h-1 w-1 rounded-full ${selected ? 'bg-white' : 'bg-brand-600'}" aria-hidden="true"></span>`
            : '';
        const label = `${date.toLocaleDateString()}${appointmentCount ? `, ${appointmentCount} appointment${appointmentCount === 1 ? '' : 's'}` : ''}`;
        cells.push(`<button type="button" data-calendar-date="${value}" onclick="selectCalendarDate(this.dataset.calendarDate)" class="relative mx-auto flex h-7 w-7 items-center justify-center rounded-full ${colorClass}" aria-label="${label}">${day}${marker}</button>`);
    }
    grid.innerHTML = cells.join('');
    renderScheduleCalendarHeader();
    renderScheduleGrid();
    renderBookedAppointments();
}

function changeCalendarMonth(delta) {
    calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + delta, 1);
    selectedCalendarDate = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), Math.min(selectedCalendarDate.getDate(), new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate()));
    renderMiniCalendar();
}

function shiftScheduleDate(delta) {
    const mode = document.getElementById('calendar-view-type')?.value || 'Weekly';
    if (mode === 'Monthly') {
        changeCalendarMonth(delta < 0 ? -1 : 1);
        return;
    }
    selectedCalendarDate = new Date(selectedCalendarDate);
    selectedCalendarDate.setDate(selectedCalendarDate.getDate() + (mode === 'Daily' ? (delta < 0 ? -1 : 1) : delta));
    calendarMonth = new Date(selectedCalendarDate.getFullYear(), selectedCalendarDate.getMonth(), 1);
    renderMiniCalendar();
}

function selectCalendarDate(value) {
    const [y, m, d] = value.split('-').map(Number);
    selectedCalendarDate = new Date(y, m - 1, d);
    calendarMonth = new Date(y, m - 1, 1);
    renderMiniCalendar();
}

function appointmentStartHour(appointment) {
    if (!appointment.time) return null;
    const parts = appointment.time.split('-')[0].trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!parts) return null;
    let hour = parseInt(parts[1], 10);
    const period = parts[3].toUpperCase();
    if (period === 'PM' && hour < 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    return hour;
}

function renderScheduleGrid() {
    const grid = document.getElementById('interactive-schedule-grid');
    if (!grid) return;
    const mode = document.getElementById('calendar-view-type')?.value || 'Weekly';
    const weekStart = new Date(selectedCalendarDate);
    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
    const dates = mode === 'Daily'
        ? [new Date(selectedCalendarDate)]
        : Array.from({ length: 7 }, (_, index) => new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + index));
    const visibleAppointments = getFilteredAppointments().filter(appointment => dates.some(date => dateKey(date) === appointment.date));
    const columns = dates.length === 1 ? 'grid-cols-2' : 'grid-cols-8';
    const rows = [];

    for (let hour = 8; hour <= 17; hour++) {
        const label = new Date(2000, 0, 1, hour).toLocaleTimeString(undefined, { hour: '2-digit', hour12: true });
        const cells = dates.map(date => {
            const appointments = visibleAppointments.filter(appointment =>
                appointment.date === dateKey(date) && appointmentStartHour(appointment) === hour
            );
            const cell = document.createElement('div');
            cell.className = 'min-w-0 border-l border-slate-100 px-1 py-1 space-y-1';
            appointments.forEach((appointment, index) => {
                const card = document.createElement('article');
                const colors = [
                    'bg-purple-50 border-purple-200 text-purple-900',
                    'bg-emerald-50 border-emerald-200 text-emerald-900',
                    'bg-amber-50 border-amber-200 text-amber-900',
                    'bg-rose-50 border-rose-200 text-rose-900',
                    'bg-brand-50 border-brand-200 text-brand-900'
                ];
                card.className = `rounded-lg border p-1.5 ${colors[index % colors.length]}`;
                const service = document.createElement('p');
                service.className = 'truncate font-bold';
                service.textContent = appointment.service;
                const patient = document.createElement('p');
                patient.className = 'truncate text-[10px]';
                patient.textContent = appointment.patient;
                card.append(service, patient, createAppointmentActions(appointment));
                cell.append(card);
            });
            return cell;
        });
        const row = document.createElement('div');
        row.className = `grid ${columns} min-h-24 items-start border-b border-slate-100`;
        const time = document.createElement('span');
        time.className = 'pt-2 text-center font-medium text-slate-400';
        time.textContent = label;
        row.append(time, ...cells);
        rows.push(row);
    }
    grid.replaceChildren(...rows);
}

function renderScheduleCalendarHeader() {
    const mode = document.getElementById('calendar-view-type')?.value || 'Weekly';
    const title = document.getElementById('schedule-calendar-title');
    const start = new Date(selectedCalendarDate);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    if (title) {
        title.textContent = mode === 'Daily'
            ? selectedCalendarDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
            : mode === 'Monthly'
                ? selectedCalendarDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
                : `Week of ${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    const weekHeader = document.getElementById('schedule-week-header');
    if (weekHeader) {
        const labels = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
        weekHeader.className = `grid ${mode === 'Daily' ? 'grid-cols-2' : 'grid-cols-8'} text-xs font-semibold text-slate-500 text-center pb-3 border-b border-slate-100`;
        weekHeader.innerHTML = '<div class="text-slate-400">GMT+8</div>' + labels.map((label, i) => {
            const date = new Date(start);
            date.setDate(start.getDate() + i);
            const active = dateKey(date) === dateKey(selectedCalendarDate);
            return mode === 'Daily' ? (active ? `<div class="text-brand-600 font-bold">${date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</div>` : '') : `<div class="${active ? 'text-brand-600 font-bold' : ''}">${label} ${date.getDate()}</div>`;
        }).join('');
    }
}

function refreshAppointmentTimeSlots(excludeId = '') {
    const timeSelect = document.getElementById('book-time');
    const doctorId = document.getElementById('book-doctor-select')?.value || '';
    const date = document.getElementById('book-date')?.value || '';
    if (!timeSelect) return;

    timeSelect.replaceChildren();
    if (!doctorId || !date) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'Select a doctor and date first';
        timeSelect.append(option);
        return;
    }

    const defaultSlots = [
        '10:00 AM - 11:00 AM',
        '11:00 AM - 12:00 PM',
        '02:00 PM - 03:00 PM',
        '03:00 PM - 04:00 PM',
        '04:00 PM - 05:00 PM'
    ];

    defaultSlots.forEach(slot => {
        const option = document.createElement('option');
        option.value = slot;
        option.textContent = slot;
        timeSelect.append(option);
    });
}

function initAppointmentControls() {
    const doctorSelect = document.getElementById('appointment-filter-doctor');
    if (doctorSelect) {
        const allDoctors = document.createElement('option');
        allDoctors.value = '';
        allDoctors.textContent = 'All doctors';
        doctorSelect.replaceChildren(allDoctors);
        appData.doctors.forEach(doctor => {
            const option = document.createElement('option');
            option.value = doctor.name;
            option.textContent = doctor.name;
            doctorSelect.append(option);
        });
    }
    const dateInput = document.getElementById('book-date');
    if (dateInput) {
        const today = dateKey(new Date());
        dateInput.min = today;
        if (!dateInput.value) dateInput.value = today;
    }
}

// --- 9. APP INITIALIZATION LISTENER ---
window.addEventListener('load', function() {
    initializePageNavigation();
    if (document.body.dataset.page === 'patients') {
        initializePatientPermissions()
            .catch(error => {
                console.error('Could not determine patient permissions:', error);
                appData.patientsError = 'Could not verify your account permissions. Please sign in again.';
            })
            .finally(loadAllDatabaseRecords);
    } else {
        loadAllDatabaseRecords();
    }
    
    try { initAppointmentControls(); } catch (error) { console.error('Appointment controls failed:', error); }
    try { loadSettings(); } catch (error) { console.error('Settings load failed:', error); }
    try { if (window.lucide) lucide.createIcons(); } catch (error) { console.warn('Icon rendering skipped:', error); }
});