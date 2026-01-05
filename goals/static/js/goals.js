// ================================================
// GOALS
// ================================================

function handleCreateGoal(e) {
    e.preventDefault();

    const data = {
        title: $id('goalTitle').value,
        purpose: $id('goalPurpose').value,
        carrot: $id('goalCarrot').value,
        stick: $id('goalStick').value,
        total_days: parseInt($id('goalDays').value)
    };

    fetch('/create_goal/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify(data)
    })
        .then(res => res.json())
        .then(goal => {
            goals.push(goal); // store newly created goal with real DB ID
            renderProgressBars();
            updateDayNumber();
            $id('newGoalForm').reset();
            $id('newGoalModal').classList.add('hidden');
            showSuccessModal(`Goal "${goal.title}" created successfully!`);
        })
        .catch(err => console.error(err));
}

function renderProgressBars() {
    const container = $id('progressBarsContainer');
    if (!container) return;

    container.innerHTML = "";

    if (!goals.length) {
        container.innerHTML = `<p>No goals yet. Create your first goal to get started!</p>`;
        return;
    }

    goals.forEach(goal => {
        const p = calculateGoalProgress(goal);

        const div = document.createElement('div');
        div.className = "progress-bar-item";

        div.innerHTML = `
            <div class="progress-bar-content" style="cursor: pointer;">
                <div class="progress-bar-item-title">${goal.title}</div>
                <div class="progress-bar-wrapper">
                    <div class="progress-fill" style="width:${p}%">${Math.round(p)}%</div>
                </div>
                <div class="progress-bar-item-stats">
                    <span>Days: ${goal.total_days}</span>
                </div>
            </div>
            <div class="progress-bar-actions">
                <button class="btn btn-danger btn-small" onclick="showDeleteConfirmation(${goal.id}, '${goal.title.replace(/'/g, "\\'")}')">Delete</button>
            </div>
        `;

        // Navigate using real Django database ID - only on the content area
        const contentArea = div.querySelector('.progress-bar-content');
        contentArea.onclick = () => window.location.href = `/goal/${goal.id}/`;

        container.appendChild(div);
    });
}

function calculateGoalProgress(goal) {
    if (!goal.subgoals || goal.subgoals.length === 0) return 0;

    const totalDays = calculateTotalDays(goal.subgoals);
    const completedDays = calculateCompletedDays(goal.subgoals);

    return totalDays > 0 ? (completedDays / totalDays) * 100 : 0;
}

// Calculate total days weighted by assigned days
// Example: 10 subgoals with 1 day each = 10 total days
// Each subgoal with 2 nested (0.5 days each) = 10 + (10 * 2 * 0.5) = 20 total days
function calculateTotalDays(subgoals) {
    return subgoals.reduce((total, sg) => {
        let subgoalWeight = sg.assignedDays || 1;

        // If this subgoal has children, distribute its weight among children
        if (sg.subgoals && sg.subgoals.length > 0) {
            const childrenTotalDays = calculateTotalDays(sg.subgoals);
            return total + childrenTotalDays;
        }

        return total + subgoalWeight;
    }, 0);
}

// Calculate completed days weighted by assigned days
function calculateCompletedDays(subgoals) {
    return subgoals.reduce((completed, sg) => {
        let subgoalWeight = sg.assignedDays || 1;

        // If this subgoal has children, calculate based on children
        if (sg.subgoals && sg.subgoals.length > 0) {
            const childrenCompletedDays = calculateCompletedDays(sg.subgoals);
            return completed + childrenCompletedDays;
        }

        // If no children, count full weight if completed
        return completed + (sg.completed ? subgoalWeight : 0);
    }, 0);
}

function renderGoalDetails() {
    if (!currentGoal) return;

    $id('goalTitle').textContent = currentGoal.title;
    $id('goalPurpose').textContent = currentGoal.purpose;
    $id('goalCarrot').textContent = currentGoal.carrot;
    $id('goalStick').textContent = currentGoal.stick;

    const start = new Date(currentGoal.start_date);
    const today = new Date();
    const daysSince = Math.floor((today - start) / 86400000);

    const end = new Date(start.getTime() + currentGoal.total_days * 86400000);
    const daysLeft = Math.max(0, Math.floor((end - today) / 86400000));

    $id('daysSinceStart').textContent = daysSince;
    $id('totalDaysAssigned').textContent = currentGoal.total_days;
    $id('daysLeft').textContent = daysLeft;

    const p = calculateGoalProgress(currentGoal);
    $id('goalProgressFill').style.width = `${p}%`;
    $id('goalProgressText').textContent = `${Math.round(p)}%`;
}

// ====== DELETE FUNCTIONALITY ====== //
let goalToDelete = null;

function showDeleteConfirmation(goalId, goalTitle) {
    goalToDelete = goalId;
    $id('deleteGoalTitle').textContent = goalTitle;
    $id('deleteConfirmModal').classList.remove('hidden');
}

function handleDeleteGoal() {
    if (!goalToDelete) return;

    fetch(`/delete_goal/${goalToDelete}/`, {
        method: 'DELETE',
        headers: {
            'X-CSRFToken': getCookie('csrftoken')
        }
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                // Remove goal from local array
                goals = goals.filter(g => g.id !== goalToDelete);
                renderProgressBars();
                updateDayNumber();
                $id('deleteConfirmModal').classList.add('hidden');
                goalToDelete = null;
            } else {
                showErrorModal('Failed to delete goal: ' + data.message);
            }
        })
        .catch(err => {
            console.error('Delete error:', err);
            showErrorModal('Network error occurred while deleting goal. Please try again.');
        });
}
