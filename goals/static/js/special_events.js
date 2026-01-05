// ================================================
// SPECIAL EVENTS
// ================================================

function openSpecialEventModal(selectedDateIso = null) {
    const modal = $id('specialEventModal');
    const dateInput = $id('eventDate');

    if (selectedDateIso) {
        dateInput.value = selectedDateIso;
    } else {
        dateInput.value = new Date().toISOString().split('T')[0];
    }

    modal.classList.remove('hidden');
    setTimeout(() => $id('eventName').focus(), 100);
}

function handleAddSpecialEvent(e) {
    e.preventDefault();

    const eventDate = $id('eventDate').value;
    const eventName = $id('eventName').value.trim();
    const eventDescription = $id('eventDescription').value.trim();
    const eventColor = $id('eventColor').value;

    if (!eventDate || !eventName) {
        showValidationModal('Please fill in both the date and event name.');
        return;
    }

    // Check if event already exists for this date
    if (specialEvents[eventDate]) {
        if (!confirm(`An event "${specialEvents[eventDate].name}" already exists on this date. Do you want to replace it?`)) {
            return;
        }
    }

    // Add the special event
    specialEvents[eventDate] = {
        name: eventName,
        description: eventDescription,
        color: eventColor,
        created: new Date().toISOString()
    };

    saveSpecialEventsToStorage();

    // Close modal and reset form
    $id('specialEventModal').classList.add('hidden');
    $id('specialEventForm').reset();

    // Refresh calendar to show the new event
    renderCalendar();

    showSuccessModal(`Special event "${eventName}" added successfully!`);
}

function openSpecialEventsListModal() {
    const modal = $id('specialEventsListModal');
    const content = $id('specialEventsListContent');

    renderSpecialEventsList(content);
    modal.classList.remove('hidden');
}

function renderSpecialEventsList(container) {
    container.innerHTML = '';

    const eventDates = Object.keys(specialEvents).sort();

    if (eventDates.length === 0) {
        container.innerHTML = `
            <div class="schedule-empty">
                <p>🎉 No special events scheduled</p>
                <p>Click "Add Special Event" to create your first event!</p>
            </div>
        `;
        return;
    }

    const eventsContainer = document.createElement('div');
    eventsContainer.className = 'special-events-list';
    eventsContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md);
        max-height: 60vh;
        overflow-y: auto;
    `;

    eventDates.forEach(dateIso => {
        const event = specialEvents[dateIso];
        const eventDate = new Date(dateIso);
        const isToday = dateIso === new Date().toISOString().split('T')[0];
        const isPast = eventDate < new Date() && !isToday;

        const eventDiv = document.createElement('div');
        eventDiv.className = 'special-event-item';
        eventDiv.style.cssText = `
            background-color: white;
            padding: var(--spacing-md);
            border-radius: 8px;
            border-left: 4px solid var(--${event.color === 'purple' ? 'primary' : event.color === 'pink' ? 'danger' : event.color === 'orange' ? 'warning' : event.color === 'yellow' ? 'warning' : event.color === 'green' ? 'secondary' : event.color === 'blue' ? 'info' : 'danger'});
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            ${isPast ? 'opacity: 0.7;' : ''}
            ${isToday ? 'border: 2px solid var(--primary); background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05));' : ''}
        `;

        eventDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--spacing-xs);">
                <div>
                    <div style="font-weight: 600; color: var(--dark); margin-bottom: var(--spacing-xs);">
                        <span class="special-event-indicator ${event.color}" style="position: static; width: 16px; height: 16px; margin-right: var(--spacing-xs); display: inline-flex;">🎉</span>
                        ${event.name}
                        ${isToday ? ' <span style="background: var(--primary); color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px;">TODAY</span>' : ''}
                    </div>
                    <div style="font-size: 14px; color: var(--gray); margin-bottom: var(--spacing-xs);">
                        📅 ${eventDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                    ${event.description ? `<div style="font-size: 14px; color: var(--dark);">${event.description}</div>` : ''}
                </div>
                <button class="btn btn-danger btn-small" onclick="deleteSpecialEvent('${dateIso}')" style="margin-left: var(--spacing-sm);">Delete</button>
            </div>
        `;

        eventsContainer.appendChild(eventDiv);
    });

    container.appendChild(eventsContainer);
}

function deleteSpecialEvent(dateIso) {
    const event = specialEvents[dateIso];
    if (!event) return;

    if (confirm(`Are you sure you want to delete the event "${event.name}"?`)) {
        delete specialEvents[dateIso];
        saveSpecialEventsToStorage();

        // Refresh the events list
        const content = $id('specialEventsListContent');
        renderSpecialEventsList(content);

        // Refresh calendar
        renderCalendar();

        showSuccessModal(`Event "${event.name}" deleted successfully!`);
    }
}
