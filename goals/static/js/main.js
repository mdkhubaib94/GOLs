// ================================================
// ACCOUNTABILITY SYSTEM - DJANGO CLEAN VERSION
// ================================================

// ====== INIT ====== //
document.addEventListener('DOMContentLoaded', () => {
    loadUnavailableDaysFromStorage();
    loadSpecialEventsFromStorage();

    Promise.all([
        loadGoalsFromBackend(),
        loadAllTimeblocks()
    ]).then(() => {
        if (currentGoalId) {
            currentGoal = goals.find(g => g.id === currentGoalId) || null;
        }

        updateHeader();

        safeRun(renderProgressBars);
        safeRun(renderCalendar);

        if (currentGoal) {
            safeRun(renderGoalDetails);
            safeRun(renderSubgoals);
        }
    });

    setupEventListeners();
});

// ====== EVENT LISTENERS ====== //
function setupEventListeners() {

    // New Goal Modal (index page)
    if ($id('newGoalBtn')) $id('newGoalBtn').onclick = () => $id('newGoalModal').classList.remove('hidden');
    if ($id('closeGoalModal')) $id('closeGoalModal').onclick = () => $id('newGoalModal').classList.add('hidden');
    if ($id('cancelGoalBtn')) $id('cancelGoalBtn').onclick = () => $id('newGoalModal').classList.add('hidden');
    if ($id('newGoalForm')) $id('newGoalForm').onsubmit = handleCreateGoal;

    // New Timeblock from index
    if ($id('newTimeblockBtn')) $id('newTimeblockBtn').onclick = () => openAddTimeblockModal(true);

    // Delete Confirmation Modal
    if ($id('closeDeleteModal')) $id('closeDeleteModal').onclick = () => $id('deleteConfirmModal').classList.add('hidden');
    if ($id('cancelDeleteBtn')) $id('cancelDeleteBtn').onclick = () => $id('deleteConfirmModal').classList.add('hidden');
    if ($id('confirmDeleteBtn')) $id('confirmDeleteBtn').onclick = handleDeleteGoal;

    // Calendar nav
    if ($id('prevMonthBtn')) $id('prevMonthBtn').onclick = () => {
        currentMonth.setMonth(currentMonth.getMonth() - 1);
        renderCalendar();
    };
    if ($id('nextMonthBtn')) $id('nextMonthBtn').onclick = () => {
        currentMonth.setMonth(currentMonth.getMonth() + 1);
        renderCalendar();
    };

    // Goal page navigation
    if ($id('backBtn')) $id('backBtn').onclick = () => window.location.href = window.indexUrl;

    // Calendar toggle switch
    if ($id('toggleCalendarSwitch')) {
        $id('toggleCalendarSwitch').onchange = (e) => {
            const calendarSection = $id('calendarSection');
            if (calendarSection) {
                calendarSection.style.display = e.target.checked ? 'block' : 'none';
            }
        };
    }

    // Subgoal modal
    if ($id('addSubgoalBtn')) $id('addSubgoalBtn').onclick = () => openAddSubgoalModal(null);
    if ($id('closeSubgoalModal')) $id('closeSubgoalModal').onclick = () => $id('addSubgoalModal').classList.add('hidden');
    if ($id('cancelSubgoalBtn')) $id('cancelSubgoalBtn').onclick = () => $id('addSubgoalModal').classList.add('hidden');
    if ($id('addSubgoalForm')) $id('addSubgoalForm').onsubmit = handleAddSubgoal;

    // Day Schedule Modal
    if ($id('closeDayScheduleModal')) $id('closeDayScheduleModal').onclick = () => $id('dayScheduleModal').classList.add('hidden');

    // Timeblock modal (updated to use new advanced modal)
    if ($id('addGoalTimeblockBtn')) $id('addGoalTimeblockBtn').onclick = () => openAddTimeblockModal(false);
    if ($id('closeGoalTimeblockModal')) $id('closeGoalTimeblockModal').onclick = () => $id('goalTimeblockModal').classList.add('hidden');
    if ($id('cancelGoalTimeblockBtn')) $id('cancelGoalTimeblockBtn').onclick = () => $id('goalTimeblockModal').classList.add('hidden');
    if ($id('addGoalTimeblockForm')) $id('addGoalTimeblockForm').onsubmit = handleAddGoalTimeblock;

    // Today's Schedule Button
    if ($id('todayScheduleBtn')) $id('todayScheduleBtn').onclick = toggleTodaySchedule;
    if ($id('closeScheduleBtn')) $id('closeScheduleBtn').onclick = closeTodaySchedule;

    // Special Events
    if ($id('addSpecialEventBtn')) $id('addSpecialEventBtn').onclick = () => openSpecialEventModal();
    if ($id('viewSpecialEventsBtn')) $id('viewSpecialEventsBtn').onclick = () => openSpecialEventsListModal();
    if ($id('closeSpecialEventModal')) $id('closeSpecialEventModal').onclick = () => $id('specialEventModal').classList.add('hidden');
    if ($id('cancelSpecialEventBtn')) $id('cancelSpecialEventBtn').onclick = () => $id('specialEventModal').classList.add('hidden');
    if ($id('closeSpecialEventsListModal')) $id('closeSpecialEventsListModal').onclick = () => $id('specialEventsListModal').classList.add('hidden');
    if ($id('specialEventForm')) $id('specialEventForm').onsubmit = handleAddSpecialEvent;

    // Clicking outside modals closes them
    window.addEventListener('click', (e) => {
        ["newGoalModal", "dayScheduleModal", "addSubgoalModal", "goalTimeblockModal", "deleteConfirmModal", "specialEventModal", "specialEventsListModal"].forEach(id => {
            const modal = $id(id);
            if (modal && e.target === modal) modal.classList.add('hidden');
        });
    });
}
