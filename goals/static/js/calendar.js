// ================================================
// CALENDAR
// ================================================

function renderCalendar() {
    const grid = $id('calendarGrid');
    if (!grid) return;

    const y = currentMonth.getFullYear();
    const m = currentMonth.getMonth();

    const first = new Date(y, m, 1).getDay();
    const days = new Date(y, m + 1, 0).getDate();

    if ($id('currentMonth'))
        $id('currentMonth').textContent = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    grid.innerHTML = "";

    for (let i = 0; i < first; i++) grid.appendChild(createDateCell(null, true));
    for (let d = 1; d <= days; d++) grid.appendChild(createDateCell(new Date(y, m, d), false));
}

function createDateCell(date, placeholder) {
    const div = document.createElement('div');
    div.className = "calendar-date";

    if (placeholder) {
        div.classList.add("other-month");
        return div;
    }

    const iso = date.toISOString().split('T')[0];
    const today = new Date();
    const todayIso = today.toISOString().split('T')[0];
    const isToday = iso === todayIso;
    const isPast = date < today && !isToday;
    const isFuture = date > today;
    const isUnavailable = unavailableDays[iso];
    const hasSpecialEvent = specialEvents[iso];

    // Count timeblocks for this date from all sources (goals + standalone)
    let timeblockCount = 0;

    // Count goal-based timeblocks
    goals.forEach(goal => {
        if (goal.timeblocks && Array.isArray(goal.timeblocks)) {
            const goalTimeblocks = goal.timeblocks.filter(tb => tb.date === iso);
            timeblockCount += goalTimeblocks.length;
        }
    });

    // Count standalone timeblocks
    if (window.allTimeblocks) {
        const standaloneTimeblocks = window.allTimeblocks.filter(tb => tb.date === iso && !tb.goal_id);
        timeblockCount += standaloneTimeblocks.length;

        // Debug logging for today's date
        const todayIso = new Date().toISOString().split('T')[0];
        if (iso === todayIso && standaloneTimeblocks.length > 0) {
            console.log(`Found ${standaloneTimeblocks.length} standalone timeblocks for today:`, standaloneTimeblocks);
        }
    }

    // Apply CSS classes based on date status
    if (isToday) div.classList.add("today");
    if (isPast) div.classList.add("past-day");
    if (isFuture) div.classList.add("future-day");
    if (isUnavailable) div.classList.add("unavailable");
    if (timeblockCount > 0) div.classList.add("has-timeblocks");
    if (hasSpecialEvent) div.classList.add("has-special-event");

    // Create the date cell content
    div.innerHTML = `
        <div class="calendar-date-number">${date.getDate()}</div>
        ${timeblockCount > 0 ? `<div class="timeblock-indicator">${timeblockCount}</div>` : ''}
        ${isUnavailable ? `<div class="unavailable-indicator">✗</div>` : ''}
        ${hasSpecialEvent ? `
            <div class="special-event-indicator ${hasSpecialEvent.color}">🎉</div>
            <div class="special-event-name">${hasSpecialEvent.name}</div>
        ` : ''}
    `;

    // Use enhanced click handler
    div.onclick = (e) => {
        e.stopPropagation();
        enhancedCalendarDateClick(date);
    };

    return div;
}

function updateHeader() {
    const today = new Date();

    if ($id('todayDate')) {
        $id('todayDate').textContent = today.toLocaleDateString('en-US', {
            month: 'long', day: 'numeric', year: 'numeric'
        });
    }

    if ($id('todayDay')) {
        $id('todayDay').textContent = today.toLocaleDateString('en-US', { weekday: 'long' });
    }

    if ($id('userName')) $id('userName').textContent = userName;

    updateDayNumber();
}

function updateDayNumber() {
    if (!$id('dayNumber')) return;
    if (!goals.length) return ($id('dayNumber').textContent = 0);

    const earliest = Math.min(...goals.map(g => new Date(g.start_date)));
    const diff = Math.floor((Date.now() - earliest) / 86400000) + 1;
    $id('dayNumber').textContent = Math.max(0, diff);
}

// ====== ENHANCED CALENDAR DATE CLICK ====== //
// Override the existing calendar date click to include special event options
function enhancedCalendarDateClick(date) {
    const iso = date.toISOString().split('T')[0];
    const hasSpecialEvent = specialEvents[iso];

    // Create a context menu for the date
    const contextMenu = document.createElement('div');
    contextMenu.className = 'calendar-context-menu';
    contextMenu.style.cssText = `
        position: fixed;
        background: white;
        border: 1px solid var(--border);
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        padding: var(--spacing-sm);
        z-index: 1000;
        min-width: 200px;
    `;

    contextMenu.innerHTML = `
        <div style="font-weight: 600; margin-bottom: var(--spacing-sm); padding-bottom: var(--spacing-sm); border-bottom: 1px solid var(--border);">
            ${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
        <button class="btn btn-primary btn-small" onclick="openDayScheduleModal(new Date('${iso}T12:00:00')); removeContextMenu();" style="width: 100%; margin-bottom: var(--spacing-xs);">
            📅 View Schedule
        </button>
        <button class="btn btn-warning btn-small" onclick="openSpecialEventModal('${iso}'); removeContextMenu();" style="width: 100%; margin-bottom: var(--spacing-xs);">
            🎉 ${hasSpecialEvent ? 'Edit' : 'Add'} Special Event
        </button>
        ${hasSpecialEvent ? `
            <button class="btn btn-danger btn-small" onclick="deleteSpecialEvent('${iso}'); removeContextMenu();" style="width: 100%;">
                🗑️ Delete Event
            </button>
        ` : ''}
    `;

    // Position the context menu
    const rect = event.target.getBoundingClientRect();
    contextMenu.style.left = `${rect.left}px`;
    contextMenu.style.top = `${rect.bottom + 5}px`;

    // Adjust position if it goes off screen
    document.body.appendChild(contextMenu);
    const menuRect = contextMenu.getBoundingClientRect();
    if (menuRect.right > window.innerWidth) {
        contextMenu.style.left = `${window.innerWidth - menuRect.width - 10}px`;
    }
    if (menuRect.bottom > window.innerHeight) {
        contextMenu.style.top = `${rect.top - menuRect.height - 5}px`;
    }

    // Close menu when clicking outside
    setTimeout(() => {
        document.addEventListener('click', function closeMenu(e) {
            if (!contextMenu.contains(e.target)) {
                removeContextMenu();
                document.removeEventListener('click', closeMenu);
            }
        });
    }, 100);
}

function removeContextMenu() {
    const existingMenu = document.querySelector('.calendar-context-menu');
    if (existingMenu) {
        existingMenu.remove();
    }
}
