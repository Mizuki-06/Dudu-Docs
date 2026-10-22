// --- 1. INITIAL MOCK DATA STATE ---
        const initialDoctors = [
            { id: 1, name: 'Dr. Kenneth C. Sibayan', specialty: 'Pediatrics & Breastfeeding Medicine', services:['Pediatric consultation','Breastfeeding and lactation consultation'], time: 'MWF, Sat 3–5 PM; TTh 10 AM–12 NN; MWF, Sat 10 AM–12 NN; TTh 3–5 PM (On-Call)', availability: [{days:[1,2,3,4,5,6],start:'10:00',end:'12:00'},{days:[1,2,3,4,5,6],start:'15:00',end:'17:00'}], avatar: './images/babydududocslogo.jpg' },
            { id: 2, name: 'Dr. Marj SJ. Sibayan', specialty: 'Breastfeeding and Lactation', services:['Breastfeeding and lactation consultation'], time: '2–5 PM; By Appointment & Confirmation', availability: [{days:[0,1,2,3,4,5,6],start:'14:00',end:'17:00'}], avatar: './images/babydududocslogo.jpg' },
            { id: 3, name: 'Dr. Myleen Manzano', specialty: 'OB-GYN', services:['OB-GYN consultation','Prenatal consultation'], time: 'Tuesday & Wednesday, 10 AM–12 NN', availability: [{days:[2,3],start:'10:00',end:'12:00'}], avatar: './images/babydududocslogo.jpg' },
            { id: 4, name: 'Dr. Clarissa Burgo', specialty: 'OB-GYN / Sonology', services:['OB-GYN consultation','Ultrasound / sonology'], time: 'Wednesday & Friday, 1–3 PM; By Appointment', availability: [{days:[3,5],start:'13:00',end:'15:00'}], avatar: './images/babydududocslogo.jpg' },
            { id: 5, name: 'Dr. Mark Gabuco', specialty: 'Internal Medicine', services:['Internal medicine consultation'], time: 'Tuesday & Thursday, 3–5 PM; By Appointment', availability: [{days:[2,4],start:'15:00',end:'17:00'}], avatar: './images/babydududocslogo.jpg' }
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
    const inquiryCount = document.getElementById('inquiry-count');

    // Display all patient inquiries
    if (inqContainer) {
        const inquiries = Array.isArray(appData.inquiries)
            ? appData.inquiries
            : [];

        if (inquiryCount) {
            inquiryCount.textContent =
                `${inquiries.length} ${inquiries.length === 1 ? 'Inquiry' : 'Inquiries'}`;
        }

        if (inquiries.length === 0) {
            inqContainer.innerHTML = `
                <p class="text-sm text-slate-500 py-4 text-center">
                    No inquiries available yet.
                </p>
            `;
        } else {
            inqContainer.innerHTML = inquiries.map(inq => `
                <div class="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-2">
                    <div class="flex items-center justify-between text-xs gap-3">
                        <span class="font-bold text-slate-800">
                            ${inq.patient ?? 'Unknown Patient'}
                        </span>
                        <span class="text-slate-400 text-[10px]">
                            ${inq.time ?? ''}
                        </span>
                    </div>

                    <p class="text-xs text-slate-600">
                        ${inq.question ?? ''}
                    </p>

                    <div class="flex items-center justify-between pt-2">
                        <span class="px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            inq.status === 'Pending'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-emerald-100 text-emerald-700'
                        }">
                            ${inq.status ?? 'Pending'}
                        </span>

                        <button
                            onclick="resolveInquiry(${Number(inq.id)})"
                            class="text-xs text-brand-600 font-semibold hover:underline">
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
            const appointment=appData.appointments.find(item=>String(item.id)===String(id));
            const form=document.querySelector('#modal-book-appointment form');
            if(!appointment||!form)return;
            populateSelects();
            form.reset();
            document.getElementById('book-appointment-id').value=String(appointment.id);
            document.getElementById('book-patient-select').value=appointment.patient;
            document.getElementById('book-doctor-select').value=appointment.doctor;
            populateServiceTypes(appointment.service);
            document.getElementById('book-date').value=appointment.date;
            document.getElementById('book-date').min='';
            refreshAppointmentTimeSlots(appointment.id);
            document.getElementById('book-time').value=appointment.time;
            document.getElementById('book-notes').value=appointment.notes||'';
            document.getElementById('book-appointment-modal-title').textContent='Edit Appointment';
            document.getElementById('book-appointment-submit').textContent='Save Changes';
            document.getElementById('modal-book-appointment')?.classList.remove('hidden');
        }

        function openNewAppointmentModal() {
            populateSelects();
            const form=document.querySelector('#modal-book-appointment form');
            form?.reset();
            document.getElementById('book-appointment-id').value='';
            document.getElementById('book-appointment-modal-title').textContent='Book New Appointment';
            document.getElementById('book-appointment-submit').textContent='Confirm Booking';
            const dateInput=document.getElementById('book-date');
            if(dateInput){
                const today=dateKey(new Date());
                const selectedDate=dateKey(selectedCalendarDate);
                dateInput.value=selectedDate>=today?selectedDate:today;
                dateInput.min=today;
            }
            refreshAppointmentTimeSlots();
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
            populateServiceTypes();
        }

        function getDoctorServices(doctor) {
            if(Array.isArray(doctor?.services)&&doctor.services.length)return doctor.services;
            const specialty=String(doctor?.specialty||'').toLowerCase();
            if(specialty.includes('pediatric')&&specialty.includes('breastfeeding'))return ['Pediatric consultation','Breastfeeding and lactation consultation'];
            if(specialty.includes('breastfeeding')||specialty.includes('lactation'))return ['Breastfeeding and lactation consultation'];
            if(specialty.includes('sonology'))return ['OB-GYN consultation','Ultrasound / sonology'];
            if(specialty.includes('ob-gyn'))return ['OB-GYN consultation','Prenatal consultation'];
            if(specialty.includes('internal medicine'))return ['Internal medicine consultation'];
            return doctor?.specialty?[`${doctor.specialty} consultation`]:[];
        }

        function populateServiceTypes(selectedService='') {
            const serviceSelect=document.getElementById('book-service-type');
            if(!serviceSelect)return;
            const doctorName=document.getElementById('book-doctor-select')?.value||'';
            const doctor=appData.doctors.find(item=>item.name===doctorName);
            const services=getDoctorServices(doctor);
            serviceSelect.replaceChildren();
            services.forEach(service=>{
                const option=document.createElement('option');
                option.value=service;
                option.textContent=service;
                serviceSelect.append(option);
            });
            if(selectedService&&!services.includes(selectedService)){
                const legacyOption=document.createElement('option');
                legacyOption.value=selectedService;
                legacyOption.textContent=`${selectedService} (existing appointment)`;
                serviceSelect.append(legacyOption);
            }
            serviceSelect.value=selectedService&&[...serviceSelect.options].some(option=>option.value===selectedService)
                ?selectedService
                :services[0]||'';
        }

        function formatAppointmentTime(minutes) {
            const hour=Math.floor(minutes/60);
            const minute=minutes%60;
            const period=hour<12?'AM':'PM';
            const displayHour=hour%12||12;
            return `${String(displayHour).padStart(2,'0')}:${String(minute).padStart(2,'0')} ${period}`;
        }

        function getAppointmentTimeRange(time) {
            const matches=[...String(time||'').matchAll(/(\d{1,2}):(\d{2})\s*(AM|PM)/gi)];
            if(!matches.length)return null;
            const toMinutes=match=>{
                const hour=Number(match[1])%12;
                return hour*60+Number(match[2])+(match[3].toUpperCase()==='PM'?720:0);
            };
            const start=toMinutes(matches[0]);
            let end=matches.length>1?toMinutes(matches[1]):start+60;
            if(matches.length>1&&end<=start)end+=24*60;
            return end>start?{start,end}:null;
        }

        function getAppointmentStartDate(date,time) {
            const range=getAppointmentTimeRange(time);
            if(!range)return null;
            const [year,month,day]=String(date||'').split('-').map(Number);
            if(!year||!month||!day)return null;
            return new Date(year,month-1,day,Math.floor(range.start/60),range.start%60);
        }

        function isAppointmentAtLeastOneHourAhead(date,time) {
            const start=getAppointmentStartDate(date,time);
            return Boolean(start&&start.getTime()-Date.now()>=60*60*1000);
        }

        function getAvailableAppointmentSlots(doctorName,date,excludeId='') {
            const doctor=appData.doctors.find(item=>item.name===doctorName);
            if(!doctor||!date||!Array.isArray(doctor.availability))return [];
            const weekday=new Date(`${date}T00:00:00`).getDay();
            const slots=new Set();
            doctor.availability.filter(schedule=>schedule.days.includes(weekday)).forEach(schedule=>{
                const [startHour,startMinute]=schedule.start.split(':').map(Number);
                const [endHour,endMinute]=schedule.end.split(':').map(Number);
                for(let start=startHour*60+startMinute;start+60<=endHour*60+endMinute;start+=60){
                    const slot=`${formatAppointmentTime(start)} - ${formatAppointmentTime(start+60)}`;
                    if(!isAppointmentAtLeastOneHourAhead(date,slot))continue;
                    const range=getAppointmentTimeRange(slot);
                    const overlapsExisting=appData.appointments.some(appointment=>{
                        if(String(appointment.id)===String(excludeId)||appointment.doctor!==doctorName||appointment.date!==date||normalizeAppointmentStatus(appointment.status)!=='Scheduled')return false;
                        const existingRange=getAppointmentTimeRange(appointment.time);
                        return Boolean(range&&existingRange&&range.start<existingRange.end&&existingRange.start<range.end);
                    });
                    if(!overlapsExisting)slots.add(slot);
                }
            });
            return [...slots];
        }

        function refreshAppointmentTimeSlots(excludeId='') {
            const timeSelect=document.getElementById('book-time');
            const doctorName=document.getElementById('book-doctor-select')?.value||'';
            const date=document.getElementById('book-date')?.value||'';
            if(!timeSelect)return;
            const slots=getAvailableAppointmentSlots(doctorName,date,excludeId);
            timeSelect.replaceChildren();
            if(!slots.length){
                const option=document.createElement('option');
                option.value='';
                option.textContent=doctorName&&date?'No available times for this doctor on this date':'Select a doctor and date first';
                timeSelect.append(option);
                return;
            }
            slots.forEach(slot=>{
                const option=document.createElement('option');
                option.value=slot;
                option.textContent=slot;
                timeSelect.append(option);
            });
        }

        function handleBookAppointment(e) {
            e.preventDefault();
            const appointmentId=document.getElementById('book-appointment-id').value;
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
            const currentAppointment=appData.appointments.find(item=>String(item.id)===appointmentId);
            if(!getDoctorServices(appData.doctors.find(item=>item.name===doctor)).includes(service)&&currentAppointment?.service!==service){
                showToast('Choose a service offered by the selected doctor.');
                populateServiceTypes(currentAppointment?.service||'');
                return;
            }
            if(!getAvailableAppointmentSlots(doctor,date,appointmentId).includes(time)){
                refreshAppointmentTimeSlots(appointmentId);
                showToast('That time is unavailable or is less than one hour away. Choose an available slot at least one hour ahead.');
                return;
            }
            const appointment={id:Date.now(),patient,doctor,service,date,time,notes,status:'Scheduled'};
            if(appointmentId){
                const index=appData.appointments.findIndex(item=>String(item.id)===appointmentId);
                if(index===-1){
                    showToast('Could not find that appointment. Refresh the calendar and try again.');
                    return;
                }
                appointment.id=appData.appointments[index].id;
                appData.appointments[index]=appointment;
            }else{
                appData.appointments.unshift(appointment);
                appData.activities.unshift({
                    user: 'Sarah Jenkins',
                    action: `Booked ${patient} for ${service} with ${doctor} on ${date}`,
                    time: 'Just now'
                });
            }

            saveData();
            const [year,month,day]=date.split('-').map(Number);
            selectedCalendarDate=new Date(year,month-1,day);
            calendarMonth=new Date(year,month-1,1);
            renderMiniCalendar();
            closeModal('modal-book-appointment');
            document.querySelector('#modal-book-appointment form')?.reset();
            renderActivityStream();
            showToast(appointmentId?`Appointment updated for ${patient}.`:`Appointment booked for ${patient}!`);
        }

        function deleteAppointment(id) {
            const appointment=appData.appointments.find(item=>String(item.id)===String(id));
            if(!appointment)return;
            const start=getAppointmentStartDate(appointment.date,appointment.time);
            if(start&&Math.abs(start.getTime()-Date.now())<=30*60*1000){
                showToast('Appointments cannot be deleted within 30 minutes of their scheduled time.');
                return;
            }
            if(!window.confirm(`Delete the appointment for ${appointment.patient} on ${appointment.date}? This cannot be undone.`))return;
            appData.appointments=appData.appointments.filter(item=>String(item.id)!==String(id));
            saveData();
            renderMiniCalendar();
            showToast('Appointment deleted.');
        }

        function completeAppointment(id) {
            const appointment=appData.appointments.find(item=>String(item.id)===String(id));
            if(!appointment){
                showToast('Could not find that appointment. Refresh the calendar and try again.');
                return;
            }
            if(normalizeAppointmentStatus(appointment.status)==='Completed'){
                showToast('This appointment is already completed.');
                return;
            }
            if(!window.confirm(`Mark the appointment for ${appointment.patient} on ${appointment.date} as completed?`))return;
            appointment.status='Completed';
            saveData();
            renderMiniCalendar();
            showToast(`Appointment for ${appointment.patient} marked completed.`);
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

            if (!inq) {
            showToast("Inquiry not found.");
            return;
            }

            const reply = prompt(
            "Patient inquiry:\n" + inq.question +
            "\n\nType your reply to the patient:"
            );

             // Cancelled or empty reply
            if (reply === null || !reply.trim()) {
            return;
            }

            inq.reply = reply.trim();
            inq.status = 'Responded';

            saveData();
            renderInquiriesAndFeedback();

            showToast("Reply saved successfully.");
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

        function exportAppointmentsExcel() {
            if (typeof XLSX === 'undefined') {
                showToast('Excel library did not load. Check your internet connection and try again.');
                return;
            }
            const today=new Date();
            const weekStart=new Date(today.getFullYear(),today.getMonth(),today.getDate()-((today.getDay()+6)%7));
            const weekEnd=new Date(weekStart.getFullYear(),weekStart.getMonth(),weekStart.getDate()+7);
            const weekStartKey=dateKey(weekStart);
            const weekEndKey=dateKey(weekEnd);
            const appointments=appData.appointments.filter(appointment=>
                appointment.date>=weekStartKey&&appointment.date<weekEndKey
            ).sort((a,b)=>
                a.date.localeCompare(b.date)||
                (getAppointmentTimeRange(a.time)?.start??0)-(getAppointmentTimeRange(b.time)?.start??0)||
                String(a.patient).localeCompare(String(b.patient))
            );
            const headers=['Date','Time','Doctor','Patient','Service Type'];
            const rows=appointments.map(appointment=>[
                appointment.date,
                appointment.time,
                appointment.doctor,
                appointment.patient,
                appointment.service
            ]);
            const appointmentSheet=XLSX.utils.aoa_to_sheet([headers,...rows]);
            appointmentSheet['!cols']=[
                {wch:14},{wch:27},{wch:32},{wch:24},{wch:36}
            ];
            appointmentSheet['!autofilter']={ref:`A1:E${Math.max(rows.length+1,1)}`};
            appointmentSheet['!freeze']={
                xSplit:0,
                ySplit:1,
                topLeftCell:'A2',
                activePane:'bottomLeft',
                state:'frozen'
            };

            const summarySheet=XLSX.utils.aoa_to_sheet([
                ['Baby Dudu Docs — Weekly Appointment Report'],
                ['Week',`${formatCalendarDate(weekStartKey)} – ${formatCalendarDate(dateKey(new Date(weekEnd.getFullYear(),weekEnd.getMonth(),weekEnd.getDate()-1)))}`],
                ['Generated',new Date().toLocaleString()],
                [],
                ['This Week Summary','Count'],
                ['Total appointments',appointments.length],
                ['Scheduled',appointments.filter(item=>(item.status||'Scheduled')==='Scheduled').length],
                ['Completed',appointments.filter(item=>item.status==='Completed').length],
                ['Cancelled',appointments.filter(item=>item.status==='Cancelled').length],
                ['Doctors with appointments',new Set(appointments.map(item=>item.doctor)).size]
            ]);
            summarySheet['!cols']=[{wch:34},{wch:24}];
            summarySheet['!merges']=[{s:{r:0,c:0},e:{r:0,c:1}}];
            summarySheet['!freeze']={
                xSplit:0,
                ySplit:5,
                topLeftCell:'A6',
                activePane:'bottomLeft',
                state:'frozen'
            };

            const workbook=XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook,summarySheet,'Summary');
            XLSX.utils.book_append_sheet(workbook,appointmentSheet,'Appointments');
            XLSX.writeFile(workbook,'babydududocs-weekly-appointments.xlsx');
            showToast('This week’s appointment Excel report downloaded.');
        }

        function exportDataExcel() {
            if (typeof XLSX === 'undefined') { showToast('Excel library did not load. Check your internet connection.'); return; }
            const metrics=getAppointmentReportMetrics();
            const workbook=XLSX.utils.book_new();
            const summaryRows=[
                ['Baby Dudu Docs — Full Report'],
                ['Generated',new Date().toLocaleString()],
                [],
                ['Appointment Analytics','Count'],
                ['Total appointments',metrics.total],
                ['Completed appointments',metrics.completed],
                ['Completion rate',metrics.completionRate/100],
                ['Scheduled appointments',metrics.statuses.Scheduled||0],
                ['Cancelled appointments',metrics.statuses.Cancelled||0],
                [],
                ['Appointments by Status','Count'],
                ...Object.entries(metrics.statuses).sort(([a],[b])=>a.localeCompare(b)),
                [],
                ['Appointments by Service','Count'],
                ...Object.entries(metrics.services).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))
            ];
            const summarySheet=XLSX.utils.aoa_to_sheet(summaryRows);
            summarySheet['!cols']=[{wch:36},{wch:24}];
            summarySheet['!merges']=[{s:{r:0,c:0},e:{r:0,c:1}}];
            summarySheet['!freeze']={xSplit:0,ySplit:4,topLeftCell:'A5',activePane:'bottomLeft',state:'frozen'};
            const completionCell=summarySheet['B7'];
            if(completionCell)completionCell.z='0%';
            XLSX.utils.book_append_sheet(workbook,summarySheet,'Summary');

            const addSheet=(name,headers,rows,widths)=>{
                const sheet=XLSX.utils.aoa_to_sheet([headers,...rows]);
                sheet['!cols']=widths.map(wch=>({wch}));
                sheet['!autofilter']={ref:`A1:${XLSX.utils.encode_col(headers.length-1)}${Math.max(rows.length+1,1)}`};
                sheet['!freeze']={xSplit:0,ySplit:1,topLeftCell:'A2',activePane:'bottomLeft',state:'frozen'};
                XLSX.utils.book_append_sheet(workbook,sheet,name);
            };

            addSheet('Appointments',
                ['Appointment ID','Date','Time','Patient','Doctor','Specialty','Service Type','Status','Notes'],
                [...appData.appointments].sort((a,b)=>a.date.localeCompare(b.date)||(getAppointmentTimeRange(a.time)?.start??0)-(getAppointmentTimeRange(b.time)?.start??0)).map(item=>[
                    item.id,item.date,item.time,item.patient,item.doctor,
                    appData.doctors.find(doctor=>doctor.name===item.doctor)?.specialty||'',
                    item.service,normalizeAppointmentStatus(item.status),item.notes||''
                ]),
                [18,14,27,24,30,34,36,18,50]
            );
            addSheet('Patients',
                ['Patient ID','Full Name','Date of Birth','Age','Sex','Contact Number','Email','Address','Blood Group','Allergies','Medical History','Last Visit','Status'],
                appData.patients.map(item=>[
                    item.id??'',item.full_name||item.name||'',item.date_of_birth||'',item.age??'',
                    item.sex||item.gender||'',item.contact_number||item.phone||'',item.email||'',
                    item.address||'',item.blood_group||item.blood||'',item.allergies||'',
                    item.medical_history||'',item.last_visit||item.lastVisit||'',item.status||''
                ]),
                [16,28,16,10,14,22,30,36,14,30,45,16,16]
            );
            addSheet('Doctors',
                ['Doctor ID','Name','Specialty','Office Hours','Services'],
                appData.doctors.map(item=>[
                    item.id??'',item.name||'',item.specialty||'',item.time||'',
                    Array.isArray(item.services)?item.services.join('; '):''
                ]),
                [16,30,36,60,48]
            );
            addSheet('Inquiries',
                ['Inquiry ID','Patient','Question','Status','Time'],
                appData.inquiries.map(item=>[item.id??'',item.patient||'',item.question||'',item.status||'',item.time||'']),
                [16,24,70,18,20]
            );
            addSheet('Feedback',
                ['Feedback ID','Patient','Type','Issue','Status','Rating'],
                appData.feedback.map(item=>[item.id??'',item.patient||'',item.type||'',item.issue||'',item.status||'',item.rating??'']),
                [16,24,18,70,20,12]
            );
            addSheet('Activities',
                ['User','Activity','Time'],
                appData.activities.map(item=>[item.user||'',item.action||'',item.time||'']),
                [28,70,20]
            );
            XLSX.writeFile(workbook,'babydududocs-full-report.xlsx');
            showToast('Organized full Excel report downloaded.');
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
        function normalizeAppointmentStatus(status) {
            const value=String(status||'Scheduled').trim();
            const knownStatuses={
                scheduled:'Scheduled',
                completed:'Completed',
                cancelled:'Cancelled',
                canceled:'Cancelled',
                rescheduled:'Rescheduled'
            };
            return knownStatuses[value.toLowerCase()]||value||'Unspecified';
        }

        function getAppointmentReportMetrics() {
            const services={};
            const statuses={};
            appData.appointments.forEach(appointment=>{
                const service=String(appointment.service||'').trim()||'Unspecified';
                const status=normalizeAppointmentStatus(appointment.status);
                services[service]=(services[service]||0)+1;
                statuses[status]=(statuses[status]||0)+1;
            });
            const completed=statuses.Completed||0;
            return {
                total:appData.appointments.length,
                completed,
                completionRate:appData.appointments.length?completed/appData.appointments.length*100:0,
                services,
                statuses
            };
        }

        function initCharts() {
            const ctx1 = document.getElementById('servicesChart')?.getContext('2d');
            const ctx2 = document.getElementById('statusChart')?.getContext('2d');
            const metrics=getAppointmentReportMetrics();
            const total=document.getElementById('report-total-appointments');
            const completed=document.getElementById('report-completed-appointments');
            const rate=document.getElementById('report-completion-rate');
            if(total)total.textContent=String(metrics.total);
            if(completed)completed.textContent=String(metrics.completed);
            if(rate)rate.textContent=`${metrics.completionRate.toFixed(1)}%`;
            const servicesEmpty=document.getElementById('services-chart-empty');
            const statusEmpty=document.getElementById('status-chart-empty');
            if(servicesEmpty)servicesEmpty.classList.toggle('hidden',metrics.total>0);
            if(statusEmpty)statusEmpty.classList.toggle('hidden',metrics.total>0);
            if(ctx1)ctx1.canvas.classList.toggle('hidden',metrics.total===0);
            if(ctx2)ctx2.canvas.classList.toggle('hidden',metrics.total===0);
            if(ctx1&&window.Chart.getChart(ctx1.canvas))window.Chart.getChart(ctx1.canvas).destroy();
            if(ctx2&&window.Chart.getChart(ctx2.canvas))window.Chart.getChart(ctx2.canvas).destroy();

            if (ctx1&&metrics.total) {
                const services=Object.entries(metrics.services).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
                new Chart(ctx1, {
                    type: 'bar',
                    data: {
                        labels: services.map(([service])=>service),
                        datasets: [{
                            label: 'Appointments',
                            data: services.map(([,count])=>count),
                            backgroundColor: '#3b82f6',
                            borderRadius: 12
                        }]
                    },
                    options: { responsive: true, maintainAspectRatio: false, scales:{y:{beginAtZero:true,ticks:{precision:0}}} }
                });
            }

            if (ctx2&&metrics.total) {
                const statuses=Object.entries(metrics.statuses).sort((a,b)=>a[0].localeCompare(b[0]));
                new Chart(ctx2, {
                    type: 'doughnut',
                    data: {
                        labels: statuses.map(([status])=>status),
                        datasets: [{
                            data: statuses.map(([,count])=>count),
                            backgroundColor: statuses.map(([status])=>({
                                Completed:'#10b981',
                                Scheduled:'#3b82f6',
                                Cancelled:'#ef4444',
                                Rescheduled:'#f59e0b'
                            })[status]||'#94a3b8')
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
        let appliedAppointmentFilters = {from:'',to:'',doctor:'',view:'all'};
        function dateKey(d) { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`; }
        function getFilteredAppointments() {
            const {from,to,doctor,view}=appliedAppointmentFilters;
            const today=dateKey(new Date());
            const query=(document.getElementById('appointment-search')?.value||'').trim().toLowerCase();
            return appData.appointments.filter(appointment=>
                (!from||appointment.date>=from)&&
                (!to||appointment.date<=to)&&
                (!doctor||appointment.doctor===doctor)&&
                (view==='all'||(view==='today'?appointment.date===today:appointment.date>today))&&
                (!query||`${appointment.patient} ${appointment.doctor} ${appointment.service} ${appointment.notes||''}`.toLowerCase().includes(query))
            );
        }

        function createAppointmentActions(appointment) {
            const actions=document.createElement('div');
            actions.className='mt-2 flex flex-wrap justify-end gap-1';
            const edit=document.createElement('button');
            edit.type='button';
            edit.className='rounded-lg border border-slate-200 px-1.5 py-1 text-[10px] font-semibold text-slate-700 hover:bg-slate-50';
            edit.textContent='Edit';
            edit.addEventListener('click',()=>openEditScheduleModal(appointment.id));
            const remove=document.createElement('button');
            remove.type='button';
            remove.className='rounded-lg border border-rose-200 px-1.5 py-1 text-[10px] font-semibold text-rose-700 hover:bg-rose-50';
            remove.textContent='Delete';
            remove.addEventListener('click',()=>deleteAppointment(appointment.id));
            actions.append(edit);
            if(normalizeAppointmentStatus(appointment.status)!=='Completed'){
                const complete=document.createElement('button');
                complete.type='button';
                complete.className='rounded-lg border border-emerald-200 px-1.5 py-1 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-50';
                complete.textContent='Complete';
                complete.addEventListener('click',()=>completeAppointment(appointment.id));
                actions.append(complete);
            }
            actions.append(remove);
            return actions;
        }

        function renderBookedAppointments() {
            const list=document.getElementById('booked-appointments-list');
            if(!list)return;
            const dateLabel=document.getElementById('booked-appointments-date');
            if(dateLabel)dateLabel.textContent=selectedCalendarDate.toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric',year:'numeric'});
            const appointments=getFilteredAppointments().filter(appointment=>appointment.date===dateKey(selectedCalendarDate));
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
                card.append(createAppointmentActions(appointment));
                list.append(card);
            });
        }

        function appointmentStartHour(appointment) {
            const range=getAppointmentTimeRange(appointment.time);
            return range?Math.floor(range.start/60):null;
        }

        function renderScheduleGrid() {
            const grid=document.getElementById('interactive-schedule-grid');
            if(!grid)return;
            const mode=document.getElementById('calendar-view-type')?.value||'Weekly';
            const weekStart=new Date(selectedCalendarDate);
            weekStart.setDate(weekStart.getDate()-((weekStart.getDay()+6)%7));
            const dates=mode==='Daily'
                ? [new Date(selectedCalendarDate)]
                : Array.from({length:7},(_,index)=>new Date(weekStart.getFullYear(),weekStart.getMonth(),weekStart.getDate()+index));
            const visibleAppointments=getFilteredAppointments().filter(appointment=>dates.some(date=>dateKey(date)===appointment.date));
            const columns=dates.length===1?'grid-cols-2':'grid-cols-8';
            const rows=[];
            for(let hour=8;hour<=17;hour++){
                const label=new Date(2000,0,1,hour).toLocaleTimeString(undefined,{hour:'2-digit',hour12:true});
                const cells=dates.map(date=>{
                    const appointments=visibleAppointments.filter(appointment=>
                        appointment.date===dateKey(date)&&appointmentStartHour(appointment)===hour
                    );
                    const cell=document.createElement('div');
                    cell.className='min-w-0 border-l border-slate-100 px-1 py-1 space-y-1';
                    appointments.forEach((appointment,index)=>{
                        const card=document.createElement('article');
                        const colors=[
                            'bg-purple-50 border-purple-200 text-purple-900',
                            'bg-emerald-50 border-emerald-200 text-emerald-900',
                            'bg-amber-50 border-amber-200 text-amber-900',
                            'bg-rose-50 border-rose-200 text-rose-900',
                            'bg-brand-50 border-brand-200 text-brand-900'
                        ];
                        card.className=`rounded-lg border p-1.5 ${colors[index%colors.length]}`;
                        const service=document.createElement('p');
                        service.className='truncate font-bold';
                        service.textContent=appointment.service;
                        service.title=appointment.service;
                        const patient=document.createElement('p');
                        patient.className='truncate text-[10px]';
                        patient.textContent=appointment.patient;
                        card.append(service,patient,createAppointmentActions(appointment));
                        cell.append(card);
                    });
                    return cell;
                });
                const row=document.createElement('div');
                row.className=`grid ${columns} min-h-24 items-start border-b border-slate-100`;
                const time=document.createElement('span');
                time.className='pt-2 text-center font-medium text-slate-400';
                time.textContent=label;
                row.append(time,...cells);
                rows.push(row);
            }
            grid.replaceChildren(...rows);
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
                weekHeader.className=`grid ${mode==='Daily'?'grid-cols-2':'grid-cols-8'} text-xs font-semibold text-slate-500 text-center pb-3 border-b border-slate-100`;
                weekHeader.innerHTML='<div class="text-slate-400">GMT+8</div>'+labels.map((label,i)=>{
                    const date=new Date(start);
                    date.setDate(start.getDate()+i);
                    const active=dateKey(date)===dateKey(selectedCalendarDate);
                    return mode==='Daily'?(active?`<div class="text-brand-600 font-bold">${date.toLocaleDateString(undefined,{weekday:'long',month:'short',day:'numeric'})}</div>`:''):`<div class="${active?'text-brand-600 font-bold':''}">${label} ${date.getDate()}</div>`;
                }).join('');
            }
            const period=document.getElementById('schedule-calendar-period');
            if(period){
                const {view,from,to}=appliedAppointmentFilters;
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
            const cells=[];
            for(let i=0;i<42;i++){
                let day,date,other=false;
                if(i<offset){
                    day=prevDays-offset+i+1;
                    date=new Date(calendarMonth.getFullYear(),calendarMonth.getMonth()-1,day);
                    other=true;
                }else if(i>=offset+days){
                    day=i-offset-days+1;
                    date=new Date(calendarMonth.getFullYear(),calendarMonth.getMonth()+1,day);
                    other=true;
                }else{
                    day=i-offset+1;
                    date=new Date(calendarMonth.getFullYear(),calendarMonth.getMonth(),day);
                }
                const value=dateKey(date);
                const selected=value===dateKey(selectedCalendarDate);
                const today=value===dateKey(new Date());
                const appointmentCount=appData.appointments.filter(appointment=>appointment.date===value).length;
                const colorClass=selected
                    ? 'bg-brand-600 text-white font-bold shadow-sm'
                    : today
                        ? 'border border-brand-600 text-brand-700'
                        : other
                            ? 'text-slate-300'
                            : 'hover:bg-slate-100';
                const marker=appointmentCount
                    ? `<span class="absolute bottom-0.5 h-1 w-1 rounded-full ${selected?'bg-white':'bg-brand-600'}" aria-hidden="true"></span>`
                    : '';
                const label=`${date.toLocaleDateString()}${appointmentCount?`, ${appointmentCount} appointment${appointmentCount===1?'':'s'}`:''}`;
                cells.push(`<button type="button" data-calendar-date="${value}" onclick="selectCalendarDate(this.dataset.calendarDate)" class="relative mx-auto flex h-7 w-7 items-center justify-center rounded-full ${colorClass}" aria-label="${label}">${day}${marker}</button>`);
            }
            grid.innerHTML=cells.join('');
            renderScheduleCalendarHeader();
            renderScheduleGrid();
            renderBookedAppointments();
        }
        function changeCalendarMonth(delta){calendarMonth=new Date(calendarMonth.getFullYear(),calendarMonth.getMonth()+delta,1); selectedCalendarDate=new Date(calendarMonth.getFullYear(),calendarMonth.getMonth(),Math.min(selectedCalendarDate.getDate(),new Date(calendarMonth.getFullYear(),calendarMonth.getMonth()+1,0).getDate())); renderMiniCalendar();}
        function shiftScheduleDate(delta){const mode=document.getElementById('calendar-view-type')?.value||'Weekly';if(mode==='Monthly'){changeCalendarMonth(delta<0?-1:1);return;}selectedCalendarDate=new Date(selectedCalendarDate);selectedCalendarDate.setDate(selectedCalendarDate.getDate()+(mode==='Daily'?(delta<0?-1:1):delta));calendarMonth=new Date(selectedCalendarDate.getFullYear(),selectedCalendarDate.getMonth(),1);renderMiniCalendar();}
        function selectCalendarDate(value){const [y,m,d]=value.split('-').map(Number);selectedCalendarDate=new Date(y,m-1,d);calendarMonth=new Date(y,m-1,1);renderMiniCalendar();}
        function toggleAppointmentFilters(){const panel=document.getElementById('appointment-filter-panel'),btn=document.getElementById('appointment-filter-toggle');if(!panel||!btn)return;const opening=panel.classList.contains('hidden');panel.classList.toggle('hidden');btn.setAttribute('aria-expanded',String(opening));}
        function applyAppointmentFilters(){
            const from=document.getElementById('appointment-filter-from')?.value||''; const to=document.getElementById('appointment-filter-to')?.value||''; const doctor=document.getElementById('appointment-filter-doctor')?.value||''; const view=document.getElementById('appointment-filter-view')?.value||'all';
            if(from&&to&&from>to){showToast('The start date must be before the end date.');return;}
            appliedAppointmentFilters={from,to,doctor,view};
            const count=[from,to,doctor,view!=='all'?view:''].filter(Boolean).length;const badge=document.getElementById('appointment-filter-count');if(badge){badge.textContent=count;badge.classList.toggle('hidden',!count);}
            const message=document.getElementById('appointment-filter-message');if(message)message.textContent=`Filters applied${doctor?' for '+doctor:''}${from?' from '+from:''}${to?' to '+to:''}. Calendar dates now reflect the selected range.`;
            const focusDate=from||to||(view==='today'?dateKey(new Date()):view==='upcoming'?dateKey(new Date(Date.now()+86400000)):'');
            if(focusDate){const [y,m,d]=focusDate.split('-').map(Number);selectedCalendarDate=new Date(y,m-1,d);calendarMonth=new Date(y,m-1,1);}
            renderMiniCalendar();
            // Filter visible schedule items by doctor when the schedule has doctor labels; otherwise preserve generic calendar events.
            const events=document.querySelectorAll('#interactive-schedule-grid [data-doctor]');events.forEach(el=>{el.classList.toggle('hidden',!!doctor&&el.dataset.doctor!==doctor);});document.querySelectorAll('#doctor-list-container .doctor-schedule-item').forEach(el=>{const name=el.querySelector('.doctor-schedule-name')?.textContent.trim()||'';el.classList.toggle('hidden',!!doctor&&name!==doctor);});
            showToast('Appointment filters applied.');
        }
        function resetAppointmentFilters(){['appointment-filter-from','appointment-filter-to','appointment-filter-doctor'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});const view=document.getElementById('appointment-filter-view');if(view)view.value='all';appliedAppointmentFilters={from:'',to:'',doctor:'',view:'all'};const badge=document.getElementById('appointment-filter-count');if(badge){badge.textContent='0';badge.classList.add('hidden');}const msg=document.getElementById('appointment-filter-message');if(msg)msg.textContent='Filters cleared.';document.querySelectorAll('#interactive-schedule-grid [data-doctor], #doctor-list-container .doctor-schedule-item').forEach(el=>el.classList.remove('hidden'));selectedCalendarDate=new Date();calendarMonth=new Date(selectedCalendarDate.getFullYear(),selectedCalendarDate.getMonth(),1);renderMiniCalendar();}
        function filterAppointments(){renderMiniCalendar();}
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
