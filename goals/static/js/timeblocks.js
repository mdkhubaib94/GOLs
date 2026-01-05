// ================================================
// TIMEBLOCKS
// ================================================

function openAddTimeblockModal(isFromIndex = false) {
    const today = new Date();
    const defaultStartDate = selectedDate || today;

    // Calculate default end date based on current goal or all goals
    let defaultEndDate = new Date(defaultStartDate);
    if (currentGoal) {
        // If we're on a goal page, use that goal's end date but limit to reasonable range
        const startDate = new Date(currentGoal.start_date);
        const goalEndDate = new Date(startDate.getTime() + (currentGoal.total_days * 24 * 60 * 60 * 1000));
        const maxAllowedDate = new Date(defaultStartDate.getTime() + (90 * 24 * 60 * 60 * 1000)); // Max 90 days from start
        defaultEndDate = goalEndDate < maxAllowedDate ? goalEndDate : maxAllowedDate;
    } else if (goals.length > 0) {
        // Use a reasonable default instead of calculating from all goals
        defaultEndDate.setDate(defaultEndDate.getDate() + 30); // Default 30 days
    } else {
        defaultEndDate.setDate(defaultEndDate.getDate() + 30); // Default 30 days
    }

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content modal-large">
            <div class="modal-header">
                <h2>Create Timeblock${currentGoal ? ` for ${currentGoal.title}` : isFromIndex ? '' : ` for ${defaultStartDate.toLocaleDateString()}`}</h2>
                <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <form id="advancedTimeblockForm">
                <div class="timeblock-type-selector">
                    <label>
                        <input type="radio" name="timeblockType" value="goal" checked>
                        <span>Goal-based Task</span>
                    </label>
                    <label>
                        <input type="radio" name="timeblockType" value="standalone">
                        <span>Standalone Task</span>
                    </label>
                </div>

                <div id="goalSection">
                    <div class="form-group">
                        <label for="timeblockGoal">Goal *</label>
                        <select id="timeblockGoal">
                            <option value="">Select a goal...</option>
                            ${goals.map(g => `<option value="${g.id}" ${currentGoal && currentGoal.id === g.id ? 'selected' : ''}>${g.title}</option>`).join('')}
                        </select>
                    </div>
                </div>

                <div id="standaloneSection" style="display: none;">
                    <div class="form-group">
                        <label for="taskTitle">Task Title *</label>
                        <input type="text" id="taskTitle" placeholder="e.g., Morning workout, Reading, etc.">
                    </div>
                </div>

                <div class="date-range-section">
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
                        <div class="form-group">
                            <label for="startDate">Start Date *</label>
                            <input type="date" id="startDate" value="${defaultStartDate.toISOString().split('T')[0]}" required>
                        </div>
                        <div class="form-group">
                            <label for="endDate">End Date *</label>
                            <input type="date" id="endDate" value="${defaultEndDate.toISOString().split('T')[0]}" required>
                        </div>
                    </div>
                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
                    <div class="form-group">
                        <label for="timeblockStartTime">Start Time *</label>
                        <input type="time" id="timeblockStartTime" required>
                        <small class="help-text">Times will be displayed in 12-hour format</small>
                    </div>
                    <div class="form-group">
                        <label for="timeblockEndTime">End Time *</label>
                        <input type="time" id="timeblockEndTime" required>
                    </div>
                </div>

                <div class="form-group">
                    <label for="frequency">Frequency *</label>
                    <select id="frequency" required>
                        <option value="daily">Daily</option>
                        <option value="weekdays">Weekdays (Mon-Fri)</option>
                        <option value="weekends">Weekends (Sat-Sun)</option>
                        <option value="alternate">Every Other Day</option>
                        <option value="custom">Custom Days</option>
                    </select>
                </div>

                <div id="customDaysSection" style="display: none;">
                    <div class="form-group">
                        <label>Select Days:</label>
                        <div class="custom-days-selector">
                            <label><input type="checkbox" value="0"> Sunday</label>
                            <label><input type="checkbox" value="1"> Monday</label>
                            <label><input type="checkbox" value="2"> Tuesday</label>
                            <label><input type="checkbox" value="3"> Wednesday</label>
                            <label><input type="checkbox" value="4"> Thursday</label>
                            <label><input type="checkbox" value="5"> Friday</label>
                            <label><input type="checkbox" value="6"> Saturday</label>
                        </div>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Create Timeblocks</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    // Handle type switching
    const typeRadios = modal.querySelectorAll('input[name="timeblockType"]');
    typeRadios.forEach(radio => {
        radio.onchange = () => {
            const goalSection = modal.querySelector('#goalSection');
            const standaloneSection = modal.querySelector('#standaloneSection');
            const goalSelect = modal.querySelector('#timeblockGoal');
            const taskInput = modal.querySelector('#taskTitle');

            if (radio.value === 'goal') {
                goalSection.style.display = 'block';
                standaloneSection.style.display = 'none';
                goalSelect.required = true;
                taskInput.required = false;
            } else {
                goalSection.style.display = 'none';
                standaloneSection.style.display = 'block';
                goalSelect.required = false;
                taskInput.required = true;
            }
        };
    });

    // Handle frequency change
    modal.querySelector('#frequency').onchange = (e) => {
        const customSection = modal.querySelector('#customDaysSection');
        customSection.style.display = e.target.value === 'custom' ? 'block' : 'none';
    };



    // Handle form submission
    modal.querySelector('#advancedTimeblockForm').onsubmit = (e) => {
        e.preventDefault();

        const type = modal.querySelector('input[name="timeblockType"]:checked').value;
        const frequency = modal.querySelector('#frequency').value;

        // Validate form based on type
        if (type === 'goal') {
            const goalId = modal.querySelector('#timeblockGoal').value;
            if (!goalId) {
                showValidationModal('Please select a goal from the dropdown list.');
                return;
            }
        } else {
            const taskTitle = modal.querySelector('#taskTitle').value.trim();
            if (!taskTitle) {
                showValidationModal('Please enter a task title for your standalone timeblock.');
                return;
            }
        }

        // Validate date range
        const startDate = new Date(modal.querySelector('#startDate').value);
        const endDate = new Date(modal.querySelector('#endDate').value);
        const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

        if (daysDiff < 0) {
            showValidationModal('End date must be after start date.');
            return;
        }

        if (daysDiff > 365) {
            showValidationModal('Date range cannot exceed 365 days. Please select a shorter range.');
            return;
        }

        const data = {
            start_date: modal.querySelector('#startDate').value,
            end_date: modal.querySelector('#endDate').value,
            start_time: modal.querySelector('#timeblockStartTime').value,
            end_time: modal.querySelector('#timeblockEndTime').value,
            frequency: frequency
        };

        if (type === 'goal') {
            data.goal_id = parseInt(modal.querySelector('#timeblockGoal').value);
        } else {
            data.task_title = modal.querySelector('#taskTitle').value.trim();
        }

        if (frequency === 'custom') {
            const selectedDays = Array.from(modal.querySelectorAll('#customDaysSection input:checked'))
                .map(cb => parseInt(cb.value));
            if (selectedDays.length === 0) {
                showValidationModal('Please select at least one day of the week for custom frequency.');
                return;
            }
            data.custom_days = selectedDays;
        }

        // Debug: Log the data being sent
        console.log('Sending timeblock data:', data);
        console.log('CSRF Token:', getCookie('csrftoken'));
        console.log('Current URL:', window.location.href);
        console.log('Request headers will be:', {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        });

        // Show loading state
        const submitBtn = modal.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Creating...';
        submitBtn.disabled = true;

        // Test if we can reach the server first
        console.log('Testing server connection...');

        // Send to backend
        fetch('/create_timeblock/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify(data)
        })
            .then(res => {
                console.log('Response status:', res.status);
                console.log('Response headers:', res.headers);

                // Handle both success and conflict responses
                if (res.ok || res.status === 409) {
                    return res.json();
                } else {
                    return res.text().then(text => {
                        console.error('Server error response:', text);
                        throw new Error(`Server error (${res.status}): ${text}`);
                    });
                }
            })
            .then(response => {
                console.log('Success response:', response);

                // Reset button state
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;

                if (response.success) {
                    modal.remove();
                    showSuccessModal(`Successfully created ${response.count} timeblock${response.count > 1 ? 's' : ''}!`);

                    // Refresh both goals and timeblocks data
                    Promise.all([
                        loadGoalsFromBackend(),
                        loadAllTimeblocks()
                    ]).then(() => {
                        renderCalendar(); // Re-render calendar with updated timeblock data
                        if (selectedDate) {
                            openDayScheduleModal(selectedDate);
                        }
                    });
                } else {
                    if (response.conflicts && response.conflicts.length > 0) {
                        showTimeConflictModal(response);
                    } else {
                        showErrorModal('Failed to create timeblocks: ' + (response.message || 'Unknown error occurred.'));
                    }
                }
            })
            .catch(err => {
                // Reset button state
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;

                console.error('Full error details:', err);
                console.error('Error message:', err.message);
                console.error('Error stack:', err.stack);

                // More specific error messages
                if (err.message.includes('Failed to fetch')) {
                    showErrorModal('Connection failed. Please check if the server is running and try again.');
                } else if (err.message.includes('403')) {
                    showErrorModal('Permission denied. Please log in again and try.');
                } else if (err.message.includes('500')) {
                    showErrorModal('Server error occurred. Please try again or contact support.');
                } else {
                    showErrorModal(`Error: ${err.message}`);
                }
            });
    };
}

function handleAddGoalTimeblock(e) {
    e.preventDefault();
    if (!currentGoal) return;

    const from = $id('goalTimeblockFromDate').value;
    const till = $id('goalTimeblockTillDate').value;
    const start = $id('goalTimeblockStartTime').value;
    const end = $id('goalTimeblockEndTime').value;
    const freq = $id('goalTimeblockFrequency').value;
    const subgoal = $id('goalTimeblockSubgoal').value;

    const d1 = new Date(from);
    const d2 = new Date(till);

    const dates = [];
    for (let d = new Date(d1); d <= d2; d.setDate(d.getDate() + 1)) {
        const day = d.getDay();
        const diff = Math.floor((d - d1) / 86400000);

        if (freq === 'alternate' && diff % 2 !== 0) continue;
        if (freq === 'weekdays' && (day === 0 || day === 6)) continue;
        if (freq === 'weekends' && (day !== 0 && day !== 6)) continue;

        dates.push(new Date(d));
    }

    dates.forEach(dt => {
        currentGoal.timeblocks.push({
            date: dt.toISOString().split('T')[0],
            startTime: start,
            endTime: end,
            subgoalTitle: subgoal
        });
    });

    // TODO: Save timeblocks to backend when timeblock model is implemented
    $id('addGoalTimeblockForm').reset();
    $id('goalTimeblockModal').classList.add('hidden');

    // Refresh timeblocks and calendar
    Promise.all([
        loadGoalsFromBackend(),
        loadAllTimeblocks()
    ]).then(() => {
        renderCalendar();
    });
}
// ====== DAY SCHEDULE MODAL ====== //
function openDayScheduleModal(date) {
    const modal = $id('dayScheduleModal');
    if (!modal) return;

    selectedDate = date;
    const iso = date.toISOString().split('T')[0];

    $id('dayScheduleTitle').textContent = date.toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric'
    });

    const content = $id('dayScheduleContent');
    content.innerHTML = "";

    // Add day management buttons
    const dayControls = document.createElement('div');
    dayControls.className = 'day-controls';

    const isUnavailable = unavailableDays[iso];

    dayControls.innerHTML = `
        <div class="day-control-buttons">
            <button class="btn btn-primary btn-small" onclick="openAddTimeblockModal()">+ Add Timeblock</button>
            <button class="btn ${isUnavailable ? 'btn-secondary' : 'btn-danger'} btn-small" onclick="toggleDayAvailability()">
                ${isUnavailable ? 'Mark Available' : 'Mark Unavailable'}
            </button>
        </div>
        ${isUnavailable ? `<div class="unavailable-reason"><strong>Unavailable:</strong> ${isUnavailable}</div>` : ''}
    `;
    content.appendChild(dayControls);

    // Fetch timeblocks for this date from backend
    fetch(`/get_timeblocks/?date=${iso}`)
        .then(res => res.json())
        .then(data => {
            const blocks = data.timeblocks || [];
            renderTimeblocks(blocks, content);
        })
        .catch(err => {
            console.error('Error fetching timeblocks:', err);
            renderTimeblocks([], content);
        });

    modal.classList.remove('hidden');
}

function renderTimeblocks(blocks, content) {
    // Remove any existing timeblock containers
    const existingContainer = content.querySelector('.timeblocks-container, .no-timeblocks');
    if (existingContainer) {
        existingContainer.remove();
    }

    if (!blocks.length) {
        const noTimeblocks = document.createElement('div');
        noTimeblocks.className = 'no-timeblocks';
        noTimeblocks.innerHTML = '<p>No timeblocks scheduled for this day.</p>';
        content.appendChild(noTimeblocks);
    } else {
        const timeblockContainer = document.createElement('div');
        timeblockContainer.className = 'timeblocks-container';

        blocks.sort((a, b) => a.start_time.localeCompare(b.start_time));
        blocks.forEach(tb => {
            const d = document.createElement('div');
            d.className = 'timeblock';
            d.innerHTML = `
                <div class="timeblock-content">
                    <div class="timeblock-time">${formatTimeFor12Hour(tb.start_time)} - ${formatTimeFor12Hour(tb.end_time)}</div>
                    <div class="timeblock-details">
                        <div class="timeblock-goal">${tb.goal_title}</div>
                        <div class="timeblock-subgoal">${tb.task_title || 'Main Goal'}</div>
                    </div>
                </div>
                <div class="timeblock-actions">
                    <button class="btn btn-small btn-secondary" onclick="editTimeblockById(${tb.id})">Edit</button>
                    <button class="btn btn-small btn-danger" onclick="deleteTimeblockById(${tb.id})">Delete</button>
                </div>
            `;
            timeblockContainer.appendChild(d);
        });
        content.appendChild(timeblockContainer);
    }
}

// ====== DAY MANAGEMENT FUNCTIONS ====== //
function toggleDayAvailability() {
    if (!selectedDate) return;

    const iso = selectedDate.toISOString().split('T')[0];

    if (unavailableDays[iso]) {
        // Mark as available
        delete unavailableDays[iso];
        saveUnavailableDaysToStorage();
        renderCalendar(); // Refresh calendar
        if (selectedDate) {
            openDayScheduleModal(selectedDate); // Refresh modal
        }
    } else {
        // Mark as unavailable - show modal for reason
        openUnavailableReasonModal();
    }
}

function openUnavailableReasonModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Mark Day as Unavailable</h2>
                <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <form id="unavailableReasonForm">
                <div class="form-group">
                    <label for="unavailableReason">Reason for unavailability *</label>
                    <textarea id="unavailableReason" required placeholder="e.g., Family event, Travel, Sick day, etc." rows="3"></textarea>
                </div>
                <div class="unavailable-suggestions">
                    <p><strong>Quick options:</strong></p>
                    <div class="reason-buttons">
                        <button type="button" class="btn btn-small btn-secondary" onclick="setReason('Family event')">Family event</button>
                        <button type="button" class="btn btn-small btn-secondary" onclick="setReason('Travel')">Travel</button>
                        <button type="button" class="btn btn-small btn-secondary" onclick="setReason('Sick day')">Sick day</button>
                        <button type="button" class="btn btn-small btn-secondary" onclick="setReason('Work commitment')">Work commitment</button>
                        <button type="button" class="btn btn-small btn-secondary" onclick="setReason('Personal emergency')">Personal emergency</button>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                    <button type="submit" class="btn btn-danger">Mark Unavailable</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    // Add global function for quick reason setting
    window.setReason = (reason) => {
        modal.querySelector('#unavailableReason').value = reason;
    };

    // Handle form submission
    modal.querySelector('#unavailableReasonForm').onsubmit = (e) => {
        e.preventDefault();

        const reason = modal.querySelector('#unavailableReason').value.trim();
        if (reason) {
            const iso = selectedDate.toISOString().split('T')[0];
            unavailableDays[iso] = reason;
            saveUnavailableDaysToStorage();

            // Cleanup
            delete window.setReason;
            modal.remove();
            renderCalendar(); // Refresh calendar
            if (selectedDate) {
                openDayScheduleModal(selectedDate); // Refresh modal
            }
        }
    };

    // Handle modal close cleanup
    const closeButtons = modal.querySelectorAll('.close-btn, .btn-secondary');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            delete window.setReason;
        });
    });

    // Focus on textarea
    setTimeout(() => modal.querySelector('#unavailableReason').focus(), 100);
}

function editTimeblockById(timeblockId) {
    // Fetch timeblock details from backend
    fetch(`/get_timeblocks/`)
        .then(res => res.json())
        .then(data => {
            const tb = data.timeblocks.find(t => t.id === timeblockId);
            if (!tb) return;

            openEditTimeblockModal(tb);
        })
        .catch(err => console.error('Error fetching timeblock:', err));
}

function openEditTimeblockModal(tb) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Edit Timeblock</h2>
                <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <form id="editTimeblockForm">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
                    <div class="form-group">
                        <label for="editStartTime">Start Time *</label>
                        <input type="time" id="editStartTime" value="${convertTo24Hour(tb.start_time)}" required>
                    </div>
                    <div class="form-group">
                        <label for="editEndTime">End Time *</label>
                        <input type="time" id="editEndTime" value="${convertTo24Hour(tb.end_time)}" required>
                    </div>
                </div>
                <div class="form-group">
                    <label for="editTaskTitle">Task Title</label>
                    <input type="text" id="editTaskTitle" value="${tb.task_title || ''}" placeholder="e.g., Arrays practice">
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Update Timeblock</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#editTimeblockForm').onsubmit = (e) => {
        e.preventDefault();

        const updateData = {
            start_time: modal.querySelector('#editStartTime').value,
            end_time: modal.querySelector('#editEndTime').value,
            task_title: modal.querySelector('#editTaskTitle').value || 'Main Goal'
        };

        fetch(`/update_timeblock/${tb.id}/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify(updateData)
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    modal.remove();
                    // Refresh both goals and timeblocks data
                    Promise.all([
                        loadGoalsFromBackend(),
                        loadAllTimeblocks()
                    ]).then(() => {
                        renderCalendar(); // Re-render calendar with updated data
                        if (selectedDate) {
                            openDayScheduleModal(selectedDate); // Refresh modal
                        }
                    });
                }
            })
            .catch(err => {
                console.error('Error updating timeblock:', err);
                showErrorModal('Failed to update timeblock. Please try again.');
            });
    };
}

function deleteTimeblockById(timeblockId) {
    showDeleteTimeblockModal(timeblockId);
}

function showDeleteTimeblockModal(timeblockId) {
    const modal = document.createElement('div');
    modal.className = 'modal delete-modal';
    modal.innerHTML = `
        <div class="modal-content delete-content">
            <div class="delete-icon">⚠️</div>
            <h2>Delete Timeblock</h2>
            <div class="delete-details">
                <p>Are you sure you want to delete this timeblock?</p>
            </div>
            <div class="delete-warning">
                <p>⚠️ <strong>This action cannot be undone!</strong></p>
            </div>
            <div class="form-actions">
                <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                <button class="btn btn-danger" onclick="confirmDeleteTimeblock(${timeblockId})">Delete Timeblock</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Close on click outside
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    };
}

function confirmDeleteTimeblock(timeblockId) {
    // Close the modal first
    const modal = document.querySelector('.delete-modal');
    if (modal) modal.remove();

    fetch(`/delete_timeblock/${timeblockId}/`, {
        method: 'DELETE',
        headers: {
            'X-CSRFToken': getCookie('csrftoken')
        }
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                // Refresh both goals and timeblocks data
                Promise.all([
                    loadGoalsFromBackend(),
                    loadAllTimeblocks()
                ]).then(() => {
                    renderCalendar(); // Re-render calendar with updated data
                    if (selectedDate) {
                        openDayScheduleModal(selectedDate); // Refresh modal
                    }
                    showSuccessModal('Timeblock deleted successfully!');
                });
            }
        })
        .catch(err => {
            console.error('Error deleting timeblock:', err);
            showErrorModal('Failed to delete timeblock. Please try again.');
        });
}

// ====== TODAY'S SCHEDULE FUNCTIONALITY ====== //
function toggleTodaySchedule() {
    const scheduleSection = $id('todayScheduleSection');
    const mainContainer = document.querySelector('.main-content-container');

    if (scheduleVisible) {
        closeTodaySchedule();
    } else {
        openTodaySchedule();
    }
}

function openTodaySchedule() {
    const scheduleSection = $id('todayScheduleSection');
    const mainContainer = document.querySelector('.main-content-container');
    const btn = $id('todayScheduleBtn');

    scheduleSection.classList.remove('hidden');
    mainContainer.classList.add('schedule-open');
    btn.textContent = '📅 Hide Schedule';
    scheduleVisible = true;

    loadTodaySchedule();
}

function closeTodaySchedule() {
    const scheduleSection = $id('todayScheduleSection');
    const mainContainer = document.querySelector('.main-content-container');
    const btn = $id('todayScheduleBtn');

    scheduleSection.classList.add('hidden');
    mainContainer.classList.remove('schedule-open');
    btn.textContent = '📅 Today\'s Schedule';
    scheduleVisible = false;
}

function loadTodaySchedule() {
    const today = new Date();
    const todayIso = today.toISOString().split('T')[0];

    const scheduleTitle = $id('scheduleTitle');
    const scheduleContent = $id('scheduleContent');

    scheduleTitle.textContent = `Today's Schedule - ${today.toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric'
    })}`;

    // Fetch today's timeblocks
    fetch(`/get_timeblocks/?date=${todayIso}`)
        .then(res => res.json())
        .then(data => {
            const blocks = data.timeblocks || [];
            renderTodaySchedule(blocks, scheduleContent);
        })
        .catch(err => {
            console.error('Error fetching today\'s timeblocks:', err);
            scheduleContent.innerHTML = `
                <div class="schedule-empty">
                    <p>❌ Error loading schedule</p>
                    <p>Please try again later</p>
                </div>
            `;
        });
}

function renderTodaySchedule(blocks, container) {
    container.innerHTML = '';

    if (!blocks.length) {
        container.innerHTML = `
            <div class="schedule-empty">
                <p>📅 No timeblocks scheduled for today</p>
                <p>Click "Add Timeblock" to schedule your day!</p>
            </div>
        `;
        return;
    }

    // Sort blocks by start time
    blocks.sort((a, b) => a.start_time.localeCompare(b.start_time));

    blocks.forEach(block => {
        const blockDiv = document.createElement('div');
        blockDiv.className = 'schedule-timeblock';

        blockDiv.innerHTML = `
            <div class="schedule-timeblock-time">${block.start_time} - ${block.end_time}</div>
            <div class="schedule-timeblock-title">${block.goal_title}</div>
            <div class="schedule-timeblock-task">${block.task_title || 'Main Goal'}</div>
        `;

        container.appendChild(blockDiv);
    });
}
