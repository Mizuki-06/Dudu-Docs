 // --- 1. INITIAL MOCK DATA STATE ---
        const initialDoctors = [
            { id: 1, name: 'Dr. Emily Johnson', specialty: 'Pediatrician', time: '10:00 - 11:00', avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150' },
            { id: 2, name: 'Dr. Michael Lee', specialty: 'Dermatologist', time: '11:00 - 12:00', avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=150' },
            { id: 3, name: 'Dr. Sophia Martinez', specialty: 'Cardiologist', time: '01:00 - 02:00', avatar: 'https://images.unsplash.com/photo-1594824813566-88855ce78907?auto=format&fit=crop&q=80&w=150' }
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
            doctors: JSON.parse(localStorage.getItem('youcare_doctors')) || initialDoctors,
            patients: [],
            patientsError: '',
            patientsLoading: false,
            inquiries: JSON.parse(localStorage.getItem('youcare_inquiries')) || initialInquiries,
            feedback: JSON.parse(localStorage.getItem('youcare_feedback')) || initialFeedback,
            activities: JSON.parse(localStorage.getItem('youcare_activities')) || initialActivities
        };

        function saveData() {
            localStorage.setItem('youcare_doctors', JSON.stringify(appData.doctors));
            localStorage.setItem('youcare_inquiries', JSON.stringify(appData.inquiries));
            localStorage.setItem('youcare_feedback', JSON.stringify(appData.feedback));
            localStorage.setItem('youcare_activities', JSON.stringify(appData.activities));
        }

        // --- 2. NAVIGATION & TAB SWITCHING ---
        function switchTab(tabId) {
            const tabs = ['dashboard', 'patients', 'appointments', 'reports', 'inquiries', 'staff', 'settings'];
            
            tabs.forEach(tab => {
                const sec = document.getElementById(`section-${tab}`);
                const nav = document.getElementById(`nav-${tab}`);
                if (sec) sec.classList.add('hidden');
                if (nav) {
                    nav.classList.remove('bg-brand-600', 'text-white', 'shadow-sm');
                    nav.classList.add('text-slate-600');
                }
            });

            const activeSec = document.getElementById(`section-${tabId}`);
            const activeNav = document.getElementById(`nav-${tabId}`);
            const settingsButton = document.getElementById('settings-nav-button');
            if (settingsButton) {
                const isSettings = tabId === 'settings';
                settingsButton.classList.toggle('is-active', isSettings);
                settingsButton.setAttribute('aria-pressed', String(isSettings));
            }
            
            if (activeSec) activeSec.classList.remove('hidden');
            if (activeNav) {
                activeNav.classList.add('bg-brand-600', 'text-white', 'shadow-sm');
                activeNav.classList.remove('text-slate-600');
            }

            // Re-render components when entering specific tabs
            if (tabId === 'patients') renderPatientsTable();
            if (tabId === 'staff') renderStaffGrid();
            if (tabId === 'inquiries') renderInquiriesAndFeedback();
            if (tabId === 'reports') initCharts();
            if (tabId === 'dashboard') initDashboardChart();
        }

        // --- 3. RENDERING FUNCTIONS ---
        function renderDoctorSidebar() {
            const container = document.getElementById('doctor-list-container');
            if (!container) return;

            container.innerHTML = appData.doctors.map(doc => `
                <div class="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 transition">
                    <div class="flex items-center gap-3">
                        <img src="${doc.avatar}" alt="${doc.name}" class="w-9 h-9 rounded-full object-cover">
                        <div>
                            <p class="font-bold text-slate-800 text-xs">${doc.name}</p>
                            <p class="text-[11px] text-brand-600 font-medium">${doc.specialty}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                        <i data-lucide="clock" class="w-3 h-3"></i>
                        <span>${doc.time}</span>
                    </div>
                </div>
            `).join('');
            lucide.createIcons();
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

        function displayValue(value) {
            return value === null || value === undefined || value === '' ? '—' : escapeHtml(value);
        }

        function renderPatientsTable() {
            const tbody = document.getElementById('patients-table-body');
            const loadMessage = document.getElementById('patient-load-message');
            const searchVal = (document.getElementById('patient-search-input')?.value || '').toLowerCase();
            if (!tbody) return;

            if (loadMessage) {
                loadMessage.textContent = appData.patientsError && appData.patients.length
                    ? `Could not load all patient records from the database. Showing records available in this session. ${appData.patientsError}`
                    : '';
            }

            if (appData.patientsError && !appData.patients.length) {
                tbody.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-rose-600">${escapeHtml(appData.patientsError)}</td></tr>`;
                return;
            }

            if (appData.patientsLoading && !appData.patients.length) {
                tbody.innerHTML = '<tr><td colspan="5" class="p-6 text-center text-slate-500">Loading patient records...</td></tr>';
                return;
            }

            const filtered = appData.patients.filter(patient =>
                [patient.full_name, patient.contact_number, patient.email]
                    .some(value => String(value || '').toLowerCase().includes(searchVal))
            );

            if (!filtered.length) {
                tbody.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-slate-500">${searchVal ? 'No matching patients found.' : 'No patient records found in the database.'}</td></tr>`;
                return;
            }

            tbody.innerHTML = filtered.map(patient => {
                const patientIndex = appData.patients.indexOf(patient);
                return `
                <tr class="hover:bg-slate-50/80 transition">
                    <td class="p-4 font-bold text-slate-800">${displayValue(patient.full_name)}</td>
                    <td class="p-4">${displayValue(patient.contact_number)}</td>
                    <td class="p-4">${patient.age === null || patient.age === undefined || patient.age === '' ? '—' : `${displayValue(patient.age)} Yrs`} / ${displayValue(patient.sex)}</td>
                    <td class="p-4">${displayValue(patient.blood_group)}</td>
                    <td class="p-4 text-right">
                        <button type="button" onclick="openPatientDetails(${patientIndex})" class="px-3 py-1 bg-brand-50 hover:bg-brand-100 text-brand-700 font-semibold rounded-xl text-[11px] transition">
                            View Details
                        </button>
                    </td>
                </tr>
            `;}).join('');
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
                ['Email Address', patient.email],
                ['Address', patient.address],
                ['Allergies', patient.allergies],
                ['Medical History', patient.medical_history],
                ['Last Visit', patient.last_visit],
                ['Status', patient.status],
                ['Created At', patient.created_at],
                ['Age', patient.age],
                ['Blood Group', patient.blood_group]
            ];

            content.innerHTML = details.map(([label, value]) => `
                <div class="rounded-xl bg-slate-50 p-3">
                    <dt class="text-[11px] font-semibold text-slate-500">${label}</dt>
                    <dd class="mt-1 break-words text-sm text-slate-800">${displayValue(value)}</dd>
                </div>
            `).join('');

            document.getElementById('patient-details-title').textContent = patient.full_name || 'Patient Details';
            document.getElementById('modal-patient-details').classList.remove('hidden');
        }

        async function loadPatientRecords() {
            appData.patientsError = '';
            appData.patientsLoading = true;
            renderPatientsTable();

            try {
                appData.patients = await loadPatients();
                appData.patientsError = '';
            } catch (error) {
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
                        <span class="font-semibold text-slate-800">${doc.time}</span>
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
            document.getElementById('modal-book-appointment')?.classList.remove('hidden');
        }

        function openAddPatientModal() {
            document.getElementById('modal-add-patient')?.classList.remove('hidden');
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
                patientSel.innerHTML = appData.patients.map(patient =>
                    `<option value="${escapeHtml(patient.full_name)}">${escapeHtml(patient.full_name)}</option>`
                ).join('');
            }
            if (doctorSel) {
                doctorSel.innerHTML = appData.doctors.map(d => `<option value="${d.name}">${d.name} (${d.specialty})</option>`).join('');
            }
        }

        function handleBookAppointment(e) {
            e.preventDefault();
            const patient = document.getElementById('book-patient-select').value;
            const doctor = document.getElementById('book-doctor-select').value;
            
            appData.activities.unshift({
                user: 'Sarah Jenkins',
                action: `Booked ${patient} with ${doctor}`,
                time: 'Just now'
            });

            saveData();
            closeModal('modal-book-appointment');
            renderActivityStream();
            showToast(`Appointment booked for ${patient}!`);
        }

        async function handleAddPatient(e) {
            e.preventDefault();
            const form = e.currentTarget;
            const submitButton = form.querySelector('button[type="submit"]');
            const formData = new FormData(form);
            const patient = {
                full_name: formData.get('full_name').trim(),
                date_of_birth: formData.get('date_of_birth') || null,
                sex: formData.get('sex') || null,
                contact_number: formData.get('contact_number').trim(),
                email: formData.get('email').trim() || null,
                address: formData.get('address').trim() || null,
                allergies: formData.get('allergies').trim() || null,
                medical_history: formData.get('medical_history').trim() || null,
                last_visit: formData.get('last_visit') || null,
                status: formData.get('status'),
                age: formData.get('age') ? Number(formData.get('age')) : null,
                blood_group: formData.get('blood_group') || null
            };

            submitButton.disabled = true;
            submitButton.textContent = 'Saving...';

            try {
                const savedPatient = await registerPatient(patient);
                appData.patients.unshift(savedPatient);
                appData.patientsError = '';
                form.reset();
                closeModal('modal-add-patient');
                renderPatientsTable();
                showToast(`Added new patient: ${patient.full_name}`);
            } catch (error) {
                console.error(error);
                showToast(error.message);
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'Save Record';
            }
        }

        function quickBookPatient(name) {
            switchTab('appointments');
            openNewAppointmentModal();
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
            const rows = [...appData.patients.map(x => ({Type:'Patient', ...x})), ...appData.doctors.map(x => ({Type:'Doctor', ...x})), ...appData.inquiries.map(x => ({Type:'Inquiry', ...x})), ...appData.feedback.map(x => ({Type:'Feedback', ...x}))];
            const csv = [Object.keys(rows[0] || {Type:'Record'}).join(','), ...rows.map(row => Object.values(row).map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))].join('\\r\\n');
            const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'}), link = document.createElement('a');
            link.href = URL.createObjectURL(blob); link.download = 'youcare-report.csv'; link.click(); URL.revokeObjectURL(link.href);
            showToast('Report downloaded.');
        }
        function exportDataExcel() {
            if (typeof XLSX === 'undefined') { showToast('Excel library did not load. Check your internet connection.'); return; }
            const wb = XLSX.utils.book_new();
            [['Patients',appData.patients],['Doctors',appData.doctors],['Inquiries',appData.inquiries],['Feedback',appData.feedback],['Activities',appData.activities]].forEach(([name,rows]) => {
                XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows.length ? rows : [{Message:'No records available'}]), name);
            });
            XLSX.writeFile(wb, 'youcare-report.xlsx'); showToast('Excel report downloaded.');
        }

        function saveSettings(){const v={name:document.getElementById('settings-name').value,email:document.getElementById('settings-email').value,phone:document.getElementById('settings-phone').value,language:document.getElementById('settings-language').value,dateFormat:document.getElementById('settings-date').value,timeZone:document.getElementById('settings-timezone').value};localStorage.setItem('youcare_settings',JSON.stringify(v));const name=document.getElementById('current-user-name');if(name)name.textContent=v.name;showToast('Settings saved.');}
function loadSettings(){try{const v=JSON.parse(localStorage.getItem('youcare_settings')||'null');if(!v)return;const map={'settings-name':'name','settings-email':'email','settings-phone':'phone','settings-language':'language','settings-date':'dateFormat','settings-timezone':'timeZone'};Object.entries(map).forEach(([id,key])=>{const el=document.getElementById(id);if(el&&v[key])el.value=v[key];});const name=document.getElementById('current-user-name');if(name&&v.name)name.textContent=v.name;}catch(e){console.warn('Could not load saved settings',e);}}
function setAppearance(mode){document.querySelectorAll('.appearance-choice').forEach(b=>b.classList.toggle('active',b.textContent.toLowerCase().includes(mode)));localStorage.setItem('youcare_appearance',mode);showToast('Appearance preference saved.');}
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

        window.onload = async function() {
            renderDoctorSidebar();
            await loadPatientRecords();
            renderStaffGrid();
            renderInquiriesAndFeedback();
            renderActivityStream();
            initDashboardChart();
            lucide.createIcons();
        };
            loadSettings();