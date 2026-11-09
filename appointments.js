
document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // APPOINTMENT CALENDAR
    // ==========================================

    const selectedCalendarDate = new Date();
    selectedCalendarDate.setHours(0, 0, 0, 0);

    let calendarMonth = new Date(
        selectedCalendarDate.getFullYear(),
        selectedCalendarDate.getMonth(),
        1
    );

    function calendarDateKey(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }

    function getCalendarWeekStart(date) {
        const start = new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate()
        );

        start.setDate(start.getDate() - ((start.getDay() + 6) % 7));

        return start;
    }

    function renderMiniCalendar() {
        const grid = document.getElementById('mini-calendar-grid');
        const title = document.getElementById('mini-calendar-title');

        if (!grid || !title) return;

        title.textContent = calendarMonth.toLocaleDateString(undefined, {
            month: 'long',
            year: 'numeric'
        });

        const firstOfMonth = new Date(
            calendarMonth.getFullYear(),
            calendarMonth.getMonth(),
            1
        );

        const gridStart = new Date(firstOfMonth);

        gridStart.setDate(
            firstOfMonth.getDate() -
            ((firstOfMonth.getDay() + 6) % 7)
        );

        const today = calendarDateKey(new Date());
        const selected = calendarDateKey(selectedCalendarDate);

        const buttons = [];

        for (let index = 0; index < 42; index++) {
            const date = new Date(gridStart);
            date.setDate(gridStart.getDate() + index);

            const value = calendarDateKey(date);
            const isSelected = value === selected;
            const isToday = value === today;
            const isOtherMonth =
                date.getMonth() !== calendarMonth.getMonth();

            const button = document.createElement('button');

            button.type = 'button';
            button.dataset.calendarDate = value;
            button.textContent = String(date.getDate());

            button.setAttribute(
                'aria-label',
                date.toLocaleDateString(undefined, {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                })
            );

            button.setAttribute('aria-pressed', String(isSelected));

            button.className =
                'relative mx-auto flex h-7 w-7 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-brand-500';

            if (isSelected) {
                button.classList.add(
                    'bg-brand-600',
                    'text-white',
                    'font-bold',
                    'shadow-sm'
                );
            } else if (isOtherMonth) {
                button.classList.add(
                    'text-slate-300',
                    'hover:bg-slate-100'
                );
            } else {
                button.classList.add(
                    'text-slate-700',
                    'hover:bg-slate-100'
                );
            }

            if (isToday && !isSelected) {
                button.classList.add(
                    'border',
                    'border-brand-600',
                    'text-brand-700'
                );
            }

            button.addEventListener('click', () => {
                selectCalendarDate(value);
            });

            buttons.push(button);
        }

        grid.replaceChildren(...buttons);

        renderScheduleCalendar();
    }

    function renderScheduleCalendar() {
        const title = document.getElementById('schedule-calendar-title');
        const period = document.getElementById('schedule-calendar-period');
        const header = document.getElementById('schedule-week-header');
        const grid = document.getElementById('interactive-schedule-grid');

        if (!title || !period || !header || !grid) return;

        const weekStart = getCalendarWeekStart(selectedCalendarDate);
        const selected = calendarDateKey(selectedCalendarDate);
        const today = calendarDateKey(new Date());

        title.textContent = `Week of ${weekStart.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })}`;

        period.textContent = selected === today
            ? 'Today'
            : selectedCalendarDate.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });

        const headerCells = [document.createElement('div')];

        headerCells[0].className = 'text-slate-400';
        headerCells[0].textContent = 'GMT+8';

        for (let index = 0; index < 7; index++) {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + index);

            const dateKey = calendarDateKey(date);
            const dayButton = document.createElement('button');

            dayButton.type = 'button';
            dayButton.className =
                'rounded-lg py-1 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500';

            dayButton.textContent =
                `${date.toLocaleDateString(undefined, {
                    weekday: 'short'
                }).toUpperCase()} ${date.getDate()}`;

            dayButton.setAttribute(
                'aria-label',
                date.toLocaleDateString(undefined, {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                })
            );

            dayButton.setAttribute(
                'aria-pressed',
                String(dateKey === selected)
            );

            if (dateKey === selected) {
                dayButton.classList.add(
                    'text-brand-600',
                    'font-bold'
                );
            }

            dayButton.addEventListener('click', () => {
                selectCalendarDate(dateKey);
            });

            headerCells.push(dayButton);
        }

        header.replaceChildren(...headerCells);

        const rows = [];

        for (let hour = 8; hour <= 17; hour++) {
            const row = document.createElement('div');

            row.className = 'grid min-h-10 grid-cols-8';

            const time = document.createElement('div');

            time.className = 'py-2 text-right pr-2 text-slate-400';
            time.textContent = `${String(hour).padStart(2, '0')}:00`;

            row.append(time);

            for (let day = 0; day < 7; day++) {
                const cell = document.createElement('div');

                const date = new Date(weekStart);
                date.setDate(weekStart.getDate() + day);

                cell.className = 'border-l border-slate-100';

                if (calendarDateKey(date) === selected) {
                    cell.classList.add('bg-brand-50/40');
                }

                row.append(cell);
            }

            rows.push(row);
        }

        grid.replaceChildren(...rows);
    }

    function changeCalendarMonth(delta) {
        const month = new Date(
            calendarMonth.getFullYear(),
            calendarMonth.getMonth() + delta,
            1
        );

        const lastDay = new Date(
            month.getFullYear(),
            month.getMonth() + 1,
            0
        ).getDate();

        selectedCalendarDate.setFullYear(
            month.getFullYear(),
            month.getMonth(),
            Math.min(selectedCalendarDate.getDate(), lastDay)
        );

        calendarMonth = month;

        renderMiniCalendar();
    }

    function shiftScheduleDate(delta) {
        selectedCalendarDate.setDate(
            selectedCalendarDate.getDate() + delta
        );

        calendarMonth = new Date(
            selectedCalendarDate.getFullYear(),
            selectedCalendarDate.getMonth(),
            1
        );

        renderMiniCalendar();
    }

    function selectCalendarDate(value) {
        const [year, month, day] = value.split('-').map(Number);

        const date = new Date(year, month - 1, day);

        if (calendarDateKey(date) !== value) return;

        selectedCalendarDate.setTime(date.getTime());

        calendarMonth = new Date(year, month - 1, 1);

        renderMiniCalendar();
    }

    // ==========================================
    // APPOINTMENT MODAL
    // ==========================================

    function openNewAppointmentModal() {
        const modal = document.getElementById('modal-book-appointment');

        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    function closeModal(modalId) {
        const modal = document.getElementById(modalId);

        if (modal) {
            modal.classList.add('hidden');
        }
    }

    // ==========================================
    // APPOINTMENT SUBMISSION
    // No temporary records or arrays.
    // ==========================================

    function handleBookAppointment(event) {
        event.preventDefault();

        showAppointmentMessage(
            'Appointment booking is not available yet. Database connection is required. No appointment was saved.'
        );
    }

    function showAppointmentMessage(message) {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toast-message');

        if (!toast || !toastMessage) {
            alert(message);
            return;
        }

        toastMessage.textContent = message;

        toast.classList.remove(
            'translate-y-20',
            'opacity-0'
        );

        setTimeout(() => {
            toast.classList.add(
                'translate-y-20',
                'opacity-0'
            );
        }, 3500);
    }

    // ==========================================
    // MAKE FUNCTIONS AVAILABLE TO HTML
    // ==========================================

    window.changeCalendarMonth = changeCalendarMonth;
    window.shiftScheduleDate = shiftScheduleDate;
    window.openNewAppointmentModal = openNewAppointmentModal;
    window.closeModal = closeModal;
    window.handleBookAppointment = handleBookAppointment;

    // ==========================================
    // INITIALIZE
    // ==========================================

    renderMiniCalendar();

    if (window.lucide) {
        window.lucide.createIcons();
    }
});
