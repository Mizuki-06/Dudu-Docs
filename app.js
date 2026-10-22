// --- 1. INITIAL MOCK DATA STATE ---
        const initialDoctors = [
            { id: 1, name: 'Dr. Kenneth C. Sibayan', specialty: 'Pediatrics & Breastfeeding Medicine', time: 'MWF, Sat 3–5 PM; TTh 10 AM–12 NN; MWF, Sat 10 AM–12 NN; TTh 3–5 PM (On-Call)', avatar: './images/babydududocslogo.jpg' },
            { id: 2, name: 'Dr. Marj SJ. Sibayan', specialty: 'Breastfeeding and Lactation', time: '2–5 PM; By Appointment & Confirmation', avatar: './images/babydududocslogo.jpg' },
            { id: 3, name: 'Dr. Myleen Manzano', specialty: 'OB-GYN', time: 'Tuesday & Wednesday, 10 AM–12 NN', avatar: './images/babydududocslogo.jpg' },
            { id: 4, name: 'Dr. Clarissa Burgo', specialty: 'OB-GYN / Sonology', time: 'Wednesday & Friday, 1–3 PM; By Appointment', avatar: './images/babydududocslogo.jpg' },
            { id: 5, name: 'Dr. Mark Gabuco', specialty: 'Internal Medicine', time: 'Tuesday & Thursday, 3–5 PM; By Appointment', avatar: './images/babydududocslogo.jpg' }
        ];

        const initialPatients = [
            { id: 101, name: 'Lucas Scott', email: 'lucas.s@example.com', phone: '+1 (555) 234-5678', age: 8, gender: 'Male', blood: 'O+', lastVisit: '2026-08-03', avatar: 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?auto=format&fit=crop&q=80&w=150' },
            { id: 102, name: 'Amanda Clarke', email: 'amanda.c@example.com', phone: '+1 (555) 876-5432', age: 34, gender: 'Female', blood: 'A+', lastVisit: '2026-08-01', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150' },
            { id: 103, name: 'David Miller', email: 'david.m@example.com', phone: '+1 (555) 345-6789', age: 45, gender: 'Male', blood: 'B+', lastVisit: '2026-07-28', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150' }
        ];

        const initialInquiries = [
            { id: 1, patient: 'Amanda Clarke', question: 'Should I fast prior to the blood test scheduled for tomorrow morning?', status: 'Pending', time: '10 mins ago' },
            { id: 2, patient: 'David Miller', question: 'Can I reschedule my cardiology follow-up to next Monday?', status: 'Responded', time: '1 hour ago' }
        ];

        const initialFeedback = [
            { id: 1, patient: 'Rachel Green', type: 'Complaint', issue: 'Wait time exceeded 30 minutes at reception.', status: 'Under Review', rating: 2 },
            { id: 2, patient: 'David Miller', type: 'Feedback', issue: 'Excellent pediatric consultation by Dr. Emily!', status: 'Resolved', rating: 5 }
        ];

        const initialActivities = [
            { user: 'Dr. Emily Johnson', action: 'Completed appointment with Lucas Scott', time: '25 mins ago' },
            { user: 'Sarah Jenkins', action: 'Booked new consultation for David Miller', time: '1 hour ago' },
            { user: 'Dr. Michael Lee', action: 'Updated prescriptions for Amanda Clarke', time: '2 hours ago' }
        ];

        // LocalStorage Initialization
        let appData = {
            doctors: (() => { const saved = JSON.parse(localStorage.getItem('babydududocs_doctors') || 'null'); if (!saved) return initialDoctors; return [...initialDoctors.map(d => ({...d, ...(saved.find(s => s.id === d.id) || {}) , name: d.name, specialty: d.specialty, time: d.time, avatar: d.avatar})), ...saved.filter(s => !initialDoctors.some(d => d.id === s.id))]; })(),
            patients: document.body.dataset.page === 'patients' ? [] : (JSON.parse(localStorage.getItem('babydududocs_patients')) || initialPatients),
            patientsError: '',
            patientsLoading: false,
            inquiries: JSON.parse(localStorage.getItem('babydududocs_inquiries')) || initialInquiries,
            feedback: JSON.parse(localStorage.getItem('babydududocs_feedback')) || initialFeedback,
            appointments: JSON.parse(localStorage.getItem('babydududocs_appointments')) || [],
            activities: JSON.parse(localStorage.getItem('babydududocs_activities')) || initialActivities
        };

        function saveData() {
            localStorage.setItem('babydududocs_doctors', JSON.stringify(appData.doctors));
            localStorage.setItem('babydududocs_inquiries', JSON.stringify(appData.inquiries));
            localStorage.setItem('babydududocs_feedback', JSON.stringify(appData.feedback));
            localStorage.setItem('babydududocs_appointments', JSON.stringify(appData.appointments));
            localStorage.setItem('babydududocs_activities', JSON.stringify(appData.activities));
        }

        // --- 2. NAVIGATION & TAB SWITCHING ---
        function switchTab(tabId) {
            const pages = {dashboard:'index.html',patients:'patients.html',appointments:'appointments.html',reports:'reports.html',inquiries:'inquiries.html',staff:'staff.html',settings:'settings.html'};
            if (pages[tabId]) window.location.href = pages[tabId];
        }

        function initializePageNavigation() {
            const page=document.body.dataset.page;
            document.querySelectorAll('[data-page-link]').forEach(link=>{
                if(!link.id&&!link.closest('.mobile-navigation'))return;
                const active=link.dataset.pageLink===page;
                if(link.id){
                    link.classList.toggle('bg-brand-600',active);
                    link.classList.toggle('text-white',active);
                    link.classList.toggle('shadow-sm',active);
                    link.classList.toggle('text-slate-600',!active);
                    link.classList.toggle('hover:text-slate-900',!active);
                }else{
                    link.classList.toggle('bg-brand-600',active);
                    link.classList.toggle('text-white',active);
                    link.classList.toggle('rounded-full',active);
                    link.classList.toggle('text-slate-600',!active);
                }
            });
            const settingsButton=document.getElementById('settings-nav-button');
            if(settingsButton){
                const active=page==='settings';
                settingsButton.classList.toggle('is-active',active);
                settingsButton.setAttribute('aria-pressed',String(active));
            }
        }

        // --- 3. RENDERING FUNCTIONS ---
        function renderDoctorSidebar() {
            const container = document.getElementById('doctor-list-container');
            if (!container) return;

            container.innerHTML = appData.doctors.map(doc => `
                <article class="doctor-schedule-item">
                    <img src="${doc.avatar}" alt="" class="doctor-schedule-avatar" loading="lazy">
                    <div class="doctor-schedule-info">
                        <p class="doctor-schedule-name">${doc.name}</p>
                        <p class="doctor-schedule-specialty">${doc.specialty}</p>
                    </div>
                    <div class="doctor-schedule-hours">
                        <i data-lucide="clock" aria-hidden="true"></i>
                        <span>${doc.time}</span>
                    </div>
                </article>
            `).join('');
            if (window.lucide) lucide.createIcons();
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

            tbody.innerHTML = filtered.map(p => `
                <tr class="hover:bg-slate-50/80 transition">
                    <td class="p-4 font-bold text-slate-800">${displayValue(p.full_name)}</td>
                    <td class="p-4">
                        <p class="font-medium text-slate-700">${displayValue(p.contact_number)}</p>
                        <p class="text-slate-400 text-[11px]">${displayValue(p.email)}</p>
                    </td>
                    <td class="p-4 font-medium">${p.age === null || p.age === undefined || p.age === '' ? '—' : `${displayValue(p.age)} Yrs`} / ${displayValue(p.sex)}</td>
                    <td class="p-4"><span class="px-2 py-0.5 bg-brand-50 text-brand-700 font-bold rounded-lg">${displayValue(p.blood_group)}</span></td>
                    <td class="p-4 text-slate-500 font-medium">${displayValue(p.last_visit)}</td>
                    <td class="p-4 text-right">
                        <button type="button" onclick="openPatientDetails(${appData.patients.indexOf(p)})" class="px-3 py-1 bg-brand-50 hover:bg-brand-100 text-brand-700 font-semibold rounded-xl text-[11px] transition">
                            View Details
                        </button>
                        <button type="button" onclick="openEditPatient(${appData.patients.indexOf(p)})" class="px-3 py-1 ml-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-[11px] transition" aria-label="Edit ${escapeHtml(p.full_name)}">
                            Edit
                        </button>
                        <button type="button" onclick="deletePatient(${appData.patients.indexOf(p)})" class="px-3 py-1 ml-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-xl text-[11px] transition" aria-label="Delete ${escapeHtml(p.full_name)}">
                            Delete
                        </button>
                    </td>
                </tr>
            `).join('');
        }

        function displayValue(value) {
            return value === null || value === undefined || value === '' ? '—' : escapeHtml(value);
        }

        function openPatientDetails(index) {
            const patient = appData.patients[index];
            const content = document.getElementById('patient-details-content');
            if (!patient || !content) return;

            const details = [
                ['Full Name', patient.full_name],
                ['Date of Birth', patient.date_of_birth],
                ['Sex', patient.sex],
                ['Contact Number', patient.contact_number],
                ['Email', patient.email],
                ['Address', patient.address],
                ['Allergies', patient.allergies],
                ['Medical History', patient.medical_history],
                ['Last Visit', patient.last_visit],
                ['Status', patient.status],
                ['Age', patient.age],
                ['Blood Group', patient.blood_group]
            ];

            content.innerHTML = details.map(([label, value]) => `
                <div class="rounded-xl bg-slate-50 p-3">
                    <dt class="text-[11px] font-semibold text-slate-500">${label}</dt>
                    <dd class="mt-1 break-words whitespace-pre-wrap text-sm text-slate-800">${displayValue(value)}</dd>
                </div>
            `).join('');

            document.getElementById('patient-details-title').textContent = patient.full_name || 'Patient Details';
            document.getElementById('modal-patient-details').classList.remove('hidden');
        }

        async function loadPatientRecords() {
            const { data: { session }, error: sessionError } = await db.auth.getSession();
            if (sessionError || !session || session.user.app_metadata?.role !== 'clinic_staff') {
                if (session) await db.auth.signOut();
                window.location.replace('login.html?error=unauthorized');
                return;
            }

            appData.patientsError = '';
            appData.patientsLoading = true;
            renderPatientsTable();

            try {
                appData.patients = await loadPatients();
            } catch (error) {
                appData.patients = [];
                appData.patientsError = error.message;
                console.error(error);
            } finally {
                appData.patientsLoading = false;
                renderPatientsTable();
            }
        }

        function renderStaffGrid() {
            const container = document.getElementById('staff-grid-container');
            if (!container) return;

            container.innerHTML = appData.doctors.map(doc => `
                <div class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                    <div class="flex items-center gap-4">
                        <img src="${doc.avatar}" class="w-14 h-14 rounded-2xl object-cover border-2 border-brand-500">
                        <div>
                            <h4 class="font-bold text-slate-800 text-sm">${doc.name}</h4>
                            <p class="text-xs font-semibold text-brand-600">${doc.specialty}</p>
                            <span class="inline-block mt-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-md">Active Practitioner</span>
                        </div>
                    </div>
                    <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span>Availability:</span>
                        <span class="font-semibold text-slate-800 text-right max-w-[65%]">${doc.time}</span>
                    </div>
                </div>
            `).join('');
        }

        function renderInquiriesAndFeedback() {
            const inqContainer = document.getElementById('inquiry-list-container');
            const feedContainer = document.getElementById('feedback-list-container');

            if (inqContainer) {
                inqContainer.innerHTML = appData.inquiries.map(inq => `
                    <div class="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-2">
                        <div class="flex items-center justify-between text-xs">
                            <span class="font-bold text-slate-800">${inq.patient}</span>
                            <span class="text-slate-400 text-[10px]">${inq.time}</span>
                        </div>
                        <p class="text-xs text-slate-600">${inq.question}</p>
                        <div class="flex items-center justify-between pt-2">
                            <span class="px-2 py-0.5 rounded-md text-[10px] font-bold ${inq.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}">${inq.status}</span>
                            <button onclick="resolveInquiry(${inq.id})" class="text-xs text-brand-600 font-semibold hover:underline">Reply / Resolve</button>
                        </div>
                    </div>
                `).join('');
            }

            if (feedContainer) {
                feedContainer.innerHTML = appData.feedback.map(fb => `
                    <div class="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-2">
                        <div class="flex items-center justify-between text-xs">
                            <span class="font-bold text-slate-800">${fb.patient}</span>
                            <span class="text-amber-500 font-bold">${'★'.repeat(fb.rating)}</span>
                        </div>
                        <p class="text-xs text-slate-600">${fb.issue}</p>
                        <div class="flex items-center justify-between pt-2">
                            <span class="px-2 py-0.5 rounded-md text-[10px] font-bold ${fb.status === 'Under Review' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}">${fb.status}</span>
                            <button onclick="resolveFeedback(${fb.id})" class="text-xs text-slate-600 font-semibold hover:underline">Update Status</button>
                        </div>
                    </div>
                `).join('');
            }
        }

        function renderActivityStream() {
            const container = document.getElementById('recent-activity-stream');
            if (!container) return;

            container.innerHTML = appData.activities.map(act => `
                <div class="flex items-start gap-3 text-xs">
                    <div class="w-2 h-2 rounded-full bg-brand-600 mt-1.5"></div>
                    <div>
                        <p class="font-bold text-slate-800">${act.user}</p>
                        <p class="text-slate-500">${act.action}</p>
                        <p class="text-[10px] text-slate-400 mt-0.5">${act.time}</p>
                    </div>
                </div>
            `).join('');
        }

        // --- 4. MODAL & INTERACTION HANDLERS ---
        function openEditScheduleModal(id) {
            const modal = document.getElementById('edit-schedule-popover');
            if (modal) {
                modal.classList.remove('hidden');
            }
        }

        function closeEditScheduleModal() {
            document.getElementById('edit-schedule-popover')?.classList.add('hidden');
        }

        function saveEditSchedule() {
            closeEditScheduleModal();
            showToast("Schedule updated successfully!");
        }

        function openNewAppointmentModal() {
            populateSelects();
            const form=document.querySelector('#modal-book-appointment form');
            form?.reset();
            const dateInput=document.getElementById('book-date');
            if(dateInput){
                const today=dateKey(new Date());
                const selectedDate=dateKey(selectedCalendarDate);
                dateInput.value=selectedDate>=today?selectedDate:today;
                dateInput.min=today;
            }
            document.getElementById('modal-book-appointment')?.classList.remove('hidden');
        }

        function openAddPatientModal() {
            const form = document.getElementById('patient-form');
            form?.reset();
            clearPatientValidation();
            document.getElementById('patient-id').value = '';
            document.getElementById('patient-modal-title').textContent = 'Add New Patient Record';
            document.getElementById('patient-submit-button').textContent = 'Save Record';
            document.getElementById('modal-add-patient')?.classList.remove('hidden');
        }

        function openEditPatient(index) {
            const patient = appData.patients[index];
            const form = document.getElementById('patient-form');
            if (!patient || !form) return;

            document.getElementById('patient-id').value = patient.id ?? '';
            document.getElementById('patient-name').value = patient.full_name || '';
            document.getElementById('patient-date-of-birth').value = String(patient.date_of_birth || '').slice(0, 10);
            document.getElementById('patient-email').value = patient.email || '';
            document.getElementById('patient-phone').value = patient.contact_number || '';
            document.getElementById('patient-age').value = patient.age ?? '';
            document.getElementById('patient-gender').value = patient.sex || '';
            document.getElementById('patient-address').value = patient.address || '';
            document.getElementById('patient-allergies').value = patient.allergies || '';
            document.getElementById('patient-medical-history').value = patient.medical_history || '';
            document.getElementById('patient-last-visit').value = String(patient.last_visit || '').slice(0, 10);
            document.getElementById('patient-status').value = String(patient.status || 'active').toLowerCase();
            document.getElementById('patient-blood').value = patient.blood_group || '';
            clearPatientValidation();
            document.getElementById('patient-modal-title').textContent = 'Edit Patient Record';
            document.getElementById('patient-submit-button').textContent = 'Save Changes';
            document.getElementById('modal-add-patient')?.classList.remove('hidden');
        }

        async function deletePatient(index) {
            const patient = appData.patients[index];
            if (!patient || !window.confirm(`Delete the patient record for ${patient.full_name}? This cannot be undone.`)) return;
            if (patient.id === null || patient.id === undefined) {
                showToast('Cannot delete this patient because the database record has no ID.');
                return;
            }

            try {
                await deletePatientRecord(patient.id);
                appData.patients = appData.patients.filter(record => record.id !== patient.id);
                renderPatientsTable();
                showToast(`Deleted patient record: ${patient.full_name}`);
            } catch (error) {
                console.error(error);
                showToast(error.message);
            }
        }

        function openAddStaffModal() {
            showToast("Staff management dialog opened.");
        }

        function closeModal(id) {
            document.getElementById(id)?.classList.add('hidden');
        }

        function populateSelects() {
            const patientSel = document.getElementById('book-patient-select');
            const doctorSel = document.getElementById('book-doctor-select');

            if (patientSel) {
                patientSel.replaceChildren();
                appData.patients.forEach(patient => {
                    const option=document.createElement('option');
                    option.value=patient.name;
                    option.textContent=patient.name;
                    patientSel.append(option);
                });
                if(!appData.patients.length){
                    const option=document.createElement('option');
                    option.value='';
                    option.textContent='No patients available';
                    patientSel.append(option);
                }
            }
            if (doctorSel) {
                doctorSel.replaceChildren();
                appData.doctors.forEach(doctor => {
                    const option=document.createElement('option');
                    option.value=doctor.name;
                    option.textContent=`${doctor.name} (${doctor.specialty})`;
                    doctorSel.append(option);
                });
                if(!appData.doctors.length){
                    const option=document.createElement('option');
                    option.value='';
                    option.textContent='No doctors available';
                    doctorSel.append(option);
                }
            }
        }

        function handleBookAppointment(e) {
            e.preventDefault();
            const patient = document.getElementById('book-patient-select').value;
            const doctor = document.getElementById('book-doctor-select').value;
            const service = document.getElementById('book-service-type').value;
            const date = document.getElementById('book-date').value;
            const time = document.getElementById('book-time').value;
            const notes = document.getElementById('book-notes').value.trim();
            if(!patient||!doctor||!service||!date||!time){
                showToast('Complete all required appointment details.');
                return;
            }
            const appointment={id:Date.now(),patient,doctor,service,date,time,notes,status:'Scheduled'};
            appData.appointments.unshift(appointment);
            
            appData.activities.unshift({
                user: 'Sarah Jenkins',
                action: `Booked ${patient} for ${service} with ${doctor} on ${date}`,
                time: 'Just now'
            });

            saveData();
            const [year,month,day]=date.split('-').map(Number);
            selectedCalendarDate=new Date(year,month-1,day);
            calendarMonth=new Date(year,month-1,1);
            renderMiniCalendar();
            closeModal('modal-book-appointment');
            document.querySelector('#modal-book-appointment form')?.reset();
            renderActivityStream();
            showToast(`Appointment booked for ${patient}!`);
        }

        function validatePatientField(fieldId) {
            const field = document.getElementById(fieldId);
            const errorElement = document.getElementById(`${fieldId}-error`);
            if (!field || !errorElement) return true;

            const value = field.value.trim();
            let message = '';
            if (fieldId === 'patient-name' && !value) {
                message = 'Enter the patient’s full name.';
            } else if (fieldId === 'patient-phone') {
                if (!value) {
                    message = 'Enter a contact number.';
                } else if (!/^\+?[0-9][0-9\s().-]*$/.test(value)) {
                    message = 'Use numbers only. You may include +, spaces, parentheses, or hyphens.';
                }
            } else if (fieldId === 'patient-email' && value &&
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                message = 'Enter a valid email address, including @.';
            } else if (fieldId === 'patient-age' && value && !/^\d+$/.test(value)) {
                message = 'Age must contain numbers only.';
            }

            errorElement.textContent = message;
            errorElement.classList.toggle('hidden', !message);
            field.setAttribute('aria-invalid', String(Boolean(message)));
            return !message;
        }

        function clearPatientValidation() {
            ['patient-name', 'patient-phone', 'patient-email', 'patient-age'].forEach(fieldId => {
                const field = document.getElementById(fieldId);
                const errorElement = document.getElementById(`${fieldId}-error`);
                field?.removeAttribute('aria-invalid');
                if (errorElement) {
                    errorElement.textContent = '';
                    errorElement.classList.add('hidden');
                }
            });
        }

        async function handleSavePatient(e) {
            e.preventDefault();
            const form = e.currentTarget;
            const submitButton = document.getElementById('patient-submit-button');
            const fieldsValid = ['patient-name', 'patient-phone', 'patient-email', 'patient-age']
                .map(validatePatientField)
                .every(Boolean);
            if (!fieldsValid) {
                form.querySelector('[aria-invalid="true"]')?.focus();
                return;
            }

            const formData = new FormData(form);
            const id = document.getElementById('patient-id').value;
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
                status: String(formData.get('status') || '').trim() || null,
                age: formData.get('age') ? Number(formData.get('age')) : null,
                blood_group: formData.get('blood_group') || null
            };

            const isEditing = id !== '';
            if (isEditing && !appData.patients.some(record => String(record.id) === id)) {
                showToast('Could not find that patient record. Refresh the directory and try again.');
                return;
            }

            submitButton.disabled = true;
            submitButton.textContent = isEditing ? 'Saving Changes...' : 'Saving...';

            try {
                if (isEditing) {
                    const updatedPatient = await updatePatientRecord(id, patient);
                    const patientIndex = appData.patients.findIndex(record => String(record.id) === id);
                    appData.patients[patientIndex] = updatedPatient;
                } else {
                    appData.patients.unshift(await registerPatient(patient));
                }

                appData.patientsError = '';
                form.reset();
                clearPatientValidation();
                document.getElementById('patient-id').value = '';
                closeModal('modal-add-patient');
                renderPatientsTable();
                showToast(isEditing ? `Updated patient record: ${patient.full_name}` : `Added new patient: ${patient.full_name}`);
            } catch (error) {
                console.error(error);
                showToast(error.message);
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = document.getElementById('patient-id').value ? 'Save Changes' : 'Save Record';
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

        function quickBookPatient(index) {
            const patient = appData.patients[index];
            if (!patient) return;
            const name = patient.name;
            window.location.href=`appointments.html?patient=${encodeURIComponent(name)}`;
        }

        function resolveInquiry(id) {
            const inq = appData.inquiries.find(i => i.id === id);
            if (inq) {
                inq.status = 'Responded';
                saveData();
                renderInquiriesAndFeedback();
                showToast("Inquiry marked as Responded.");
            }
        }

        function resolveFeedback(id) {
            const fb = appData.feedback.find(f => f.id === id);
            if (fb) {
                fb.status = 'Resolved';
                saveData();
                renderInquiriesAndFeedback();
                showToast("Feedback marked as Resolved.");
            }
        }

        function exportDataCSV() {
            const rows = [...appData.patients.map(x => ({Type:'Patient', ...x})), ...appData.doctors.map(x => ({Type:'Doctor', ...x})), ...appData.appointments.map(x => ({Type:'Appointment', ...x})), ...appData.inquiries.map(x => ({Type:'Inquiry', ...x})), ...appData.feedback.map(x => ({Type:'Feedback', ...x}))];
            const csv = [Object.keys(rows[0] || {Type:'Record'}).join(','), ...rows.map(row => Object.values(row).map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))].join('\\r\\n');
            const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'}), link = document.createElement('a');
            link.href = URL.createObjectURL(blob); link.download = 'babydududocs-report.csv'; link.click(); URL.revokeObjectURL(link.href);
            showToast('Report downloaded.');
        }
        function exportDataExcel() {
            if (typeof XLSX === 'undefined') { showToast('Excel library did not load. Check your internet connection.'); return; }
            const wb = XLSX.utils.book_new();
            [['Patients',appData.patients],['Doctors',appData.doctors],['Appointments',appData.appointments],['Inquiries',appData.inquiries],['Feedback',appData.feedback],['Activities',appData.activities]].forEach(([name,rows]) => {
                XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows.length ? rows : [{Message:'No records available'}]), name);
            });
            XLSX.writeFile(wb, 'babydududocs-report.xlsx'); showToast('Excel report downloaded.');
        }

        function saveSettings(){const v={name:document.getElementById('settings-name').value,email:document.getElementById('settings-email').value,phone:document.getElementById('settings-phone').value,language:document.getElementById('settings-language').value,dateFormat:document.getElementById('settings-date').value,timeZone:document.getElementById('settings-timezone').value};localStorage.setItem('babydududocs_settings',JSON.stringify(v));const name=document.getElementById('current-user-name');if(name)name.textContent=v.name;showToast('Settings saved.');}
function loadSettings(){try{const v=JSON.parse(localStorage.getItem('babydududocs_settings')||'null');if(!v)return;const map={'settings-name':'name','settings-email':'email','settings-phone':'phone','settings-language':'language','settings-date':'dateFormat','settings-timezone':'timeZone'};Object.entries(map).forEach(([id,key])=>{const el=document.getElementById(id);if(el&&v[key])el.value=v[key];});const name=document.getElementById('current-user-name');if(name&&v.name)name.textContent=v.name;}catch(e){console.warn('Could not load saved settings',e);}}
function setAppearance(mode){document.querySelectorAll('.appearance-choice').forEach(b=>b.classList.toggle('active',b.textContent.toLowerCase().includes(mode)));localStorage.setItem('babydududocs_appearance',mode);showToast('Appearance preference saved.');}
function logout(){showToast('Log out is a demo action; authentication is not connected.');}

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

        // --- 5. CHARTS INITIALIZATION ---
        function initCharts() {
            const ctx1 = document.getElementById('servicesChart')?.getContext('2d');
            const ctx2 = document.getElementById('statusChart')?.getContext('2d');

            if (ctx1) {
                new Chart(ctx1, {
                    type: 'bar',
                    data: {
                        labels: ['Check-Up Kid', 'Heart Check', 'Teeth Check', 'Pediatric Control', 'Dermatology'],
                        datasets: [{
                            label: 'Requests Count',
                            data: [42, 28, 35, 50, 19],
                            backgroundColor: '#3b82f6',
                            borderRadius: 12
                        }]
                    },
                    options: { responsive: true, maintainAspectRatio: false }
                });
            }

            if (ctx2) {
                new Chart(ctx2, {
                    type: 'doughnut',
                    data: {
                        labels: ['Completed', 'Rescheduled', 'Cancelled'],
                        datasets: [{
                            data: [75, 15, 10],
                            backgroundColor: ['#10b981', '#f59e0b', '#ef4444']
                        }]
                    },
                    options: { responsive: true, maintainAspectRatio: false }
                });
            }
        }

        function initDashboardChart() {
            const ctx = document.getElementById('dashboardChart')?.getContext('2d');
            if (ctx) {
                new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                        datasets: [{
                            label: 'Patient Traffic',
                            data: [18, 24, 32, 28, 40, 22, 15],
                            borderColor: '#2563eb',
                            tension: 0.4,
                            fill: false
                        }]
                    },
                    options: { responsive: true, maintainAspectRatio: false }
                });
            }
        }

        // Calendar dates use the browser's local date (not hard-coded sample dates).
        let calendarMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        let selectedCalendarDate = new Date();
        function dateKey(d) { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`; }
        function renderBookedAppointments() {
            const list=document.getElementById('booked-appointments-list');
            if(!list)return;
            const dateLabel=document.getElementById('booked-appointments-date');
            if(dateLabel)dateLabel.textContent=selectedCalendarDate.toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric',year:'numeric'});
            const appointments=appData.appointments.filter(appointment=>appointment.date===dateKey(selectedCalendarDate));
            list.replaceChildren();
            if(!appointments.length){
                const empty=document.createElement('p');
                empty.className='rounded-xl bg-slate-50 p-3 text-xs text-slate-500';
                empty.textContent='No booked appointments for this day.';
                list.append(empty);
                return;
            }
            appointments.forEach(appointment=>{
                const card=document.createElement('article');
                card.className='rounded-xl border border-slate-200 bg-white p-3';
                const details=document.createElement('div');
                details.className='flex flex-wrap items-start justify-between gap-2';
                const summary=document.createElement('div');
                const service=document.createElement('p');
                service.className='font-semibold text-slate-800';
                service.textContent=appointment.service;
                const patient=document.createElement('p');
                patient.className='mt-1 text-slate-600';
                patient.textContent=`${appointment.patient} · ${appointment.doctor}`;
                summary.append(service,patient);
                const time=document.createElement('span');
                time.className='shrink-0 rounded-lg bg-brand-50 px-2 py-1 font-semibold text-brand-700';
                time.textContent=appointment.time;
                details.append(summary,time);
                card.append(details);
                if(appointment.notes){
                    const notes=document.createElement('p');
                    notes.className='mt-2 whitespace-pre-wrap text-slate-500';
                    notes.textContent=appointment.notes;
                    card.append(notes);
                }
                list.append(card);
            });
        }
        function formatCalendarDate(value) { const [year,month,day]=value.split('-').map(Number); return new Date(year,month-1,day).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}); }
        function renderScheduleCalendarHeader() {
            const mode=document.getElementById('calendar-view-type')?.value||'Weekly';
            const title=document.getElementById('schedule-calendar-title');
            const start=new Date(selectedCalendarDate);
            start.setDate(start.getDate()-((start.getDay()+6)%7));
            if(title){
                title.textContent=mode==='Daily'
                    ? selectedCalendarDate.toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric',year:'numeric'})
                    : mode==='Monthly'
                        ? selectedCalendarDate.toLocaleDateString(undefined,{month:'long',year:'numeric'})
                        : `Week of ${start.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})}`;
            }
            const weekHeader=document.getElementById('schedule-week-header');
            if(weekHeader){
                const labels=['MON','TUE','WED','THU','FRI','SAT','SUN'];
                weekHeader.innerHTML='<div class="text-slate-400">GMT+8</div>'+labels.map((label,i)=>{
                    const date=new Date(start);
                    date.setDate(start.getDate()+i);
                    const active=dateKey(date)===dateKey(selectedCalendarDate);
                    return `<div class="${active?'text-brand-600 font-bold':''}">${label} ${date.getDate()}</div>`;
                }).join('');
                if(mode==='Daily'){
                    weekHeader.innerHTML='<div class="text-slate-400">GMT+8</div>'+`<div class="col-span-7 text-brand-600 font-bold">${selectedCalendarDate.toLocaleDateString(undefined,{weekday:'long',month:'short',day:'numeric'})}</div>`;
                }
            }
            const period=document.getElementById('schedule-calendar-period');
            if(period){
                const view=document.getElementById('appointment-filter-view')?.value||'all';
                const from=document.getElementById('appointment-filter-from')?.value||'';
                const to=document.getElementById('appointment-filter-to')?.value||'';
                period.textContent=from||to
                    ? `${from?formatCalendarDate(from):'...'} – ${to?formatCalendarDate(to):'...'}`
                    : view==='today'?'Today':view==='upcoming'?'Upcoming':'All schedule items';
            }
            document.querySelectorAll('.schedule-nav-button').forEach(button=>{
                const direction=button.getAttribute('aria-label')?.startsWith('Previous')?'Previous':'Next';
                const interval=mode==='Daily'?'day':mode==='Monthly'?'month':'week';
                button.setAttribute('aria-label',`${direction} ${interval}`);
                button.title=`${direction} ${interval}`;
            });
        }
        function renderMiniCalendar() {
            const grid = document.getElementById('mini-calendar-grid'); if (!grid) return;
            const title = document.getElementById('mini-calendar-title');
            const monthLabel = calendarMonth.toLocaleDateString(undefined, {month:'long', year:'numeric'}); if (title) title.textContent = monthLabel;
            const first = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
            const offset = (first.getDay()+6)%7; // Monday-first calendar
            const days = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth()+1, 0).getDate();
            const prevDays = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 0).getDate();
            const cells=[]; for(let i=0;i<42;i++){ let day, d, other=false; if(i<offset){day=prevDays-offset+i+1;d=new Date(calendarMonth.getFullYear(),calendarMonth.getMonth()-1,day);other=true;} else if(i>=offset+days){day=i-offset-days+1;d=new Date(calendarMonth.getFullYear(),calendarMonth.getMonth()+1,day);other=true;} else {day=i-offset+1;d=new Date(calendarMonth.getFullYear(),calendarMonth.getMonth(),day);} const selected=dateKey(d)===dateKey(selectedCalendarDate); const today=dateKey(d)===dateKey(new Date()); cells.push(`<button type="button" data-calendar-date="${dateKey(d)}" onclick="selectCalendarDate(this.dataset.calendarDate)" class="mx-auto flex h-7 w-7 items-center justify-center rounded-full ${selected?'bg-brand-600 text-white font-bold shadow-sm':today?'border border-brand-600 text-brand-700':other?'text-slate-300':'hover:bg-slate-100'}" aria-label="${d.toLocaleDateString()}">${day}</button>`); }
            grid.innerHTML=cells.join('');
            renderScheduleCalendarHeader();
            renderBookedAppointments();
        }
        function changeCalendarMonth(delta){calendarMonth=new Date(calendarMonth.getFullYear(),calendarMonth.getMonth()+delta,1); selectedCalendarDate=new Date(calendarMonth.getFullYear(),calendarMonth.getMonth(),Math.min(selectedCalendarDate.getDate(),new Date(calendarMonth.getFullYear(),calendarMonth.getMonth()+1,0).getDate())); renderMiniCalendar();}
        function shiftScheduleDate(delta){const mode=document.getElementById('calendar-view-type')?.value||'Weekly';if(mode==='Monthly'){changeCalendarMonth(delta<0?-1:1);return;}selectedCalendarDate=new Date(selectedCalendarDate);selectedCalendarDate.setDate(selectedCalendarDate.getDate()+(mode==='Daily'?(delta<0?-1:1):delta));calendarMonth=new Date(selectedCalendarDate.getFullYear(),selectedCalendarDate.getMonth(),1);renderMiniCalendar();}
        function selectCalendarDate(value){const [y,m,d]=value.split('-').map(Number);selectedCalendarDate=new Date(y,m-1,d);calendarMonth=new Date(y,m-1,1);renderMiniCalendar();const from=document.getElementById('appointment-filter-from');if(from)from.value=value;const to=document.getElementById('appointment-filter-to');if(to)to.value=value;}
        function toggleAppointmentFilters(){const panel=document.getElementById('appointment-filter-panel'),btn=document.getElementById('appointment-filter-toggle');if(!panel||!btn)return;const opening=panel.classList.contains('hidden');panel.classList.toggle('hidden');btn.setAttribute('aria-expanded',String(opening));}
        function applyAppointmentFilters(){
            const from=document.getElementById('appointment-filter-from')?.value||''; const to=document.getElementById('appointment-filter-to')?.value||''; const doctor=document.getElementById('appointment-filter-doctor')?.value||''; const view=document.getElementById('appointment-filter-view')?.value||'all';
            if(from&&to&&from>to){showToast('The start date must be before the end date.');return;}
            const count=[from,to,doctor,view!=='all'?view:''].filter(Boolean).length;const badge=document.getElementById('appointment-filter-count');if(badge){badge.textContent=count;badge.classList.toggle('hidden',!count);}
            const message=document.getElementById('appointment-filter-message');if(message)message.textContent=`Filters applied${doctor?' for '+doctor:''}${from?' from '+from:''}${to?' to '+to:''}. Calendar dates now reflect the selected range.`;
            const focusDate=from||to||(view==='today'?dateKey(new Date()):view==='upcoming'?dateKey(new Date(Date.now()+86400000)):'');
            if(focusDate){const [y,m,d]=focusDate.split('-').map(Number);selectedCalendarDate=new Date(y,m-1,d);calendarMonth=new Date(y,m-1,1);}
            renderMiniCalendar();
            // Filter visible schedule items by doctor when the schedule has doctor labels; otherwise preserve generic calendar events.
            const events=document.querySelectorAll('#interactive-schedule-grid [data-doctor]');events.forEach(el=>{el.classList.toggle('hidden',!!doctor&&el.dataset.doctor!==doctor);});document.querySelectorAll('#doctor-list-container .doctor-schedule-item').forEach(el=>{const name=el.querySelector('.doctor-schedule-name')?.textContent.trim()||'';el.classList.toggle('hidden',!!doctor&&name!==doctor);});
            showToast('Appointment filters applied.');
        }
        function resetAppointmentFilters(){['appointment-filter-from','appointment-filter-to','appointment-filter-doctor'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});const view=document.getElementById('appointment-filter-view');if(view)view.value='all';const badge=document.getElementById('appointment-filter-count');if(badge){badge.textContent='0';badge.classList.add('hidden');}const msg=document.getElementById('appointment-filter-message');if(msg)msg.textContent='Filters cleared.';document.querySelectorAll('#interactive-schedule-grid [data-doctor], #doctor-list-container .doctor-schedule-item').forEach(el=>el.classList.remove('hidden'));selectedCalendarDate=new Date();calendarMonth=new Date(selectedCalendarDate.getFullYear(),selectedCalendarDate.getMonth(),1);renderMiniCalendar();}
        function filterAppointments(){const q=(document.getElementById('appointment-search')?.value||'').trim().toLowerCase();document.querySelectorAll('#interactive-schedule-grid [onclick*="openEditScheduleModal"]').forEach(el=>{el.classList.toggle('hidden',!!q&&!el.textContent.toLowerCase().includes(q));});}
        function initAppointmentControls(){
            const doctorSelect=document.getElementById('appointment-filter-doctor');if(doctorSelect){const allDoctors=document.createElement('option');allDoctors.value='';allDoctors.textContent='All doctors';doctorSelect.replaceChildren(allDoctors);appData.doctors.forEach(doctor=>{const option=document.createElement('option');option.value=doctor.name;option.textContent=doctor.name;doctorSelect.append(option);});}
            const dateInput=document.getElementById('book-date');if(dateInput){const today=dateKey(new Date());dateInput.min=today;if(!dateInput.value)dateInput.value=today;}
            const view=document.getElementById('calendar-view-type');if(view)view.addEventListener('change',renderMiniCalendar);
            renderMiniCalendar();
        }

        // Initialize each dashboard feature independently so one saved-data or chart
        // error cannot prevent the calendars from rendering after a page reload.
        window.addEventListener('load', function() {
            try { renderMiniCalendar(); } catch (error) { console.error('Calendar render failed:', error); }
            try { renderDoctorSidebar(); } catch (error) { console.error('Doctor schedule failed:', error); }
            try { initAppointmentControls(); } catch (error) { console.error('Appointment controls failed:', error); }
            try { initializePageNavigation(); } catch (error) { console.error('Page navigation failed:', error); }
            try {
                const patient=new URLSearchParams(window.location.search).get('patient');
                const patientSelect=document.getElementById('book-patient-select');
                if(patient&&patientSelect){openNewAppointmentModal();patientSelect.value=patient;}
            } catch (error) { console.error('Quick booking failed:', error); }
            try {
                if (document.body.dataset.page === 'patients') {
                    loadPatientRecords();
                } else {
                    renderPatientsTable();
                }
            } catch (error) { console.error('Patient table failed:', error); }
            try { renderStaffGrid(); } catch (error) { console.error('Staff grid failed:', error); }
            try { renderInquiriesAndFeedback(); } catch (error) { console.error('Inquiries failed:', error); }
            try { renderActivityStream(); } catch (error) { console.error('Activity stream failed:', error); }
            try { initDashboardChart(); } catch (error) { console.error('Dashboard chart failed:', error); }
            try { if (document.body.dataset.page === 'reports') initCharts(); } catch (error) { console.error('Reports charts failed:', error); }
            try { loadSettings(); } catch (error) { console.error('Settings load failed:', error); }
            try { if (window.lucide) lucide.createIcons(); } catch (error) { console.warn('Icon rendering skipped:', error); }
        });
