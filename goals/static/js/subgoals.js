// ================================================
// SUBGOALS
// ================================================

function renderSubgoals() {
    const box = $id('subgoalsList');
    if (!box || !currentGoal) return;

    if (!currentGoal.subgoals.length) {
        box.innerHTML = `<p>No subgoals added.</p>`;
        return;
    }

    // Create the main goal container
    box.innerHTML = `
        <div class="goal-container">
            <div class="goal-header">
                <h3><span class="goal-label">Goal:</span> ${currentGoal.title}</h3>
                <div class="goal-progress">
                    <div class="goal-progress-bar">
                        <div class="goal-progress-fill" style="width: ${calculateGoalProgress(currentGoal)}%"></div>
                    </div>
                    <span class="goal-progress-text">${Math.round(calculateGoalProgress(currentGoal))}% Complete</span>
                </div>
            </div>
            <div class="subgoals-container" id="mainSubgoalsContainer">
                <!-- Subgoals will be rendered here -->
            </div>
        </div>
    `;

    const mainContainer = $id('mainSubgoalsContainer');
    renderSubgoalTree(currentGoal.subgoals, mainContainer, 0);
}

function renderSubgoalTree(list, container, depth, parentNumber = '') {
    list.forEach((sg, index) => {
        // Generate hierarchical number (1, 1.1, 1.2, 1.1.1, etc.)
        const currentNumber = parentNumber ? `${parentNumber}.${index + 1}` : `${index + 1}`;

        // Calculate completion percentage for this subgoal and its children
        const totalDays = calculateTotalDays([sg]);
        const completedDays = calculateCompletedDays([sg]);
        const nestedProgress = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : (sg.completed ? 100 : 0);

        // Create the subgoal box
        const subgoalBox = document.createElement('div');
        subgoalBox.className = `subgoal-box depth-${depth}`;
        subgoalBox.setAttribute('data-depth', depth);

        subgoalBox.innerHTML = `
            <div class="subgoal-header">
                <div class="subgoal-title-row">
                    <div class="subgoal-number-title">
                        <span class="subgoal-number">Task ${currentNumber}</span>
                        <div class="subgoal-title">${sg.title}</div>
                    </div>
                    <div class="subgoal-status ${sg.completed ? 'completed' : 'pending'}">
                        ${sg.completed ? '✓ Completed' : `${nestedProgress}% Complete`}
                    </div>
                </div>
                <div class="subgoal-meta">
                    <div class="subgoal-days">
                        <span class="days-badge assigned">${sg.assignedDays}d</span>
                        ${sg.bufferDays ? `<span class="days-badge buffer">+${sg.bufferDays}d buffer</span>` : ''}
                    </div>
                    <div class="subgoal-progress">
                        <div class="progress-bar-mini">
                            <div class="progress-fill-mini" style="width: ${nestedProgress}%"></div>
                        </div>
                        <span class="progress-text-mini">${nestedProgress}%</span>
                    </div>
                </div>
            </div>
            
            <div class="subgoal-actions">
                <button class="btn btn-xs btn-primary" data-add-nested="${sg.id}">+ Add Subgoal</button>
                <button class="btn btn-xs ${sg.completed ? 'btn-secondary' : 'btn-success'}" data-toggle="${sg.id}">
                    ${sg.completed ? 'Undo' : 'Complete'}
                </button>
                <button class="btn btn-xs btn-danger" data-delete="${sg.id}">Delete</button>
            </div>

            ${sg.subgoals?.length ? `<div class="nested-subgoals-container"></div>` : ''}
        `;

        container.appendChild(subgoalBox);

        // Add event listeners
        subgoalBox.querySelector(`[data-toggle="${sg.id}"]`).onclick = () => toggleSubgoalCompletion(sg.id);
        subgoalBox.querySelector(`[data-delete="${sg.id}"]`).onclick = () => deleteSubgoal(sg.id);
        subgoalBox.querySelector(`[data-add-nested="${sg.id}"]`).onclick = () => openAddSubgoalModal(sg.id);

        // Render nested subgoals inside this subgoal's container
        if (sg.subgoals?.length) {
            const nestedContainer = subgoalBox.querySelector('.nested-subgoals-container');
            renderSubgoalTree(sg.subgoals, nestedContainer, depth + 1, currentNumber);
        }
    });
}

function openAddSubgoalModal(parentSubgoalId = null) {
    currentParentSubgoalId = parentSubgoalId;

    // Update modal title based on context
    const modalTitle = $id('addSubgoalModal').querySelector('h2');
    if (parentSubgoalId) {
        const parentSubgoal = findSubgoalById(currentGoal.subgoals, parentSubgoalId);
        modalTitle.textContent = `Add Subgoal to "${parentSubgoal?.title || 'Unknown'}"`;
    } else {
        modalTitle.textContent = 'Add Subgoal';
    }

    $id('addSubgoalModal').classList.remove('hidden');
}

function findSubgoalById(subgoals, id) {
    for (let sg of subgoals) {
        if (sg.id === id) return sg;
        const found = findSubgoalById(sg.subgoals || [], id);
        if (found) return found;
    }
    return null;
}

function handleAddSubgoal(e) {
    e.preventDefault();
    if (!currentGoal) return;

    const data = {
        goal_id: currentGoal.id,
        parent_subgoal_id: currentParentSubgoalId,
        title: $id('subgoalTitle').value,
        assigned_days: parseInt($id('subgoalDays').value),
        buffer_days: parseInt($id('subgoalBuffer').value) || 0
    };

    fetch('/create_subgoal/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify(data)
    })
        .then(res => res.json())
        .then(subgoal => {
            // Add the new subgoal to the local data structure
            if (currentParentSubgoalId) {
                const parentSubgoal = findSubgoalById(currentGoal.subgoals, currentParentSubgoalId);
                if (parentSubgoal) {
                    parentSubgoal.subgoals.push(subgoal);
                }
            } else {
                currentGoal.subgoals.push(subgoal);
            }

            $id('addSubgoalForm').reset();
            $id('addSubgoalModal').classList.add('hidden');
            currentParentSubgoalId = null;

            renderSubgoals();
            renderGoalDetails();
            showSuccessModal(`Subgoal "${subgoal.title}" created successfully!`);
        })
        .catch(err => {
            console.error('Error creating subgoal:', err);
            showErrorModal('Failed to create subgoal. Please try again.');
        });
}

function toggleSubgoalCompletion(id) {
    // Find the subgoal and get its current completion status
    let targetSubgoal = null;
    function findSubgoal(list) {
        for (let sg of list) {
            if (sg.id === id) {
                targetSubgoal = sg;
                return true;
            }
            if (findSubgoal(sg.subgoals || [])) return true;
        }
    }
    findSubgoal(currentGoal.subgoals);

    if (!targetSubgoal) return;

    const newCompletedStatus = !targetSubgoal.completed;

    // Update in backend first
    fetch(`/update_subgoal/${id}/`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({ completed: newCompletedStatus })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                // Update local data
                targetSubgoal.completed = newCompletedStatus;

                // Handle cascading completion
                if (newCompletedStatus) {
                    markAllChildrenComplete(targetSubgoal.subgoals || []);
                } else {
                    markAllChildrenIncomplete(targetSubgoal.subgoals || []);
                }

                // Update parent completion status
                updateParentCompletionStatus(currentGoal.subgoals);

                renderSubgoals();
                renderGoalDetails();
            }
        })
        .catch(err => {
            console.error('Error updating subgoal:', err);
            showErrorModal('Failed to update subgoal completion status. Please try again.');
        });
}

function markAllChildrenComplete(subgoals) {
    subgoals.forEach(sg => {
        if (!sg.completed) {
            sg.completed = true;
            // Update in backend
            updateSubgoalInBackend(sg.id, true);
        }
        markAllChildrenComplete(sg.subgoals || []);
    });
}

function markAllChildrenIncomplete(subgoals) {
    subgoals.forEach(sg => {
        if (sg.completed) {
            sg.completed = false;
            // Update in backend
            updateSubgoalInBackend(sg.id, false);
        }
        markAllChildrenIncomplete(sg.subgoals || []);
    });
}

function updateSubgoalInBackend(id, completed) {
    fetch(`/update_subgoal/${id}/`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({ completed })
    })
        .catch(err => console.error('Error updating subgoal in backend:', err));
}

function updateParentCompletionStatus(subgoals) {
    subgoals.forEach(sg => {
        // First, recursively update all nested subgoals
        if (sg.subgoals && sg.subgoals.length > 0) {
            updateParentCompletionStatus(sg.subgoals);

            // Check if all children are completed
            const allChildrenComplete = sg.subgoals.every(child => child.completed);
            const anyChildIncomplete = sg.subgoals.some(child => !child.completed);

            // Auto-complete parent if all children are complete
            if (allChildrenComplete && !sg.completed) {
                sg.completed = true;
                console.log(`Auto-completed parent subgoal: ${sg.title}`);
            }

            // Auto-incomplete parent if any child is incomplete and parent is complete
            // This handles the case where a child was marked incomplete after parent was auto-completed
            if (anyChildIncomplete && sg.completed) {
                // Check if this parent has any incomplete direct children
                // If so, it should be marked incomplete
                sg.completed = false;
                console.log(`Auto-incompleted parent subgoal: ${sg.title}`);
            }
        }
    });
}

function deleteSubgoal(id) {
    // Find the subgoal to get its details for the confirmation modal
    let targetSubgoal = null;
    function findSubgoal(list) {
        for (let sg of list) {
            if (sg.id === id) {
                targetSubgoal = sg;
                return true;
            }
            if (findSubgoal(sg.subgoals || [])) return true;
        }
    }
    findSubgoal(currentGoal.subgoals);

    if (!targetSubgoal) return;

    showDeleteSubgoalModal(targetSubgoal);
}

function showDeleteSubgoalModal(subgoal) {
    // Count nested subgoals
    const nestedCount = countNestedSubgoals(subgoal.subgoals || []);

    const modal = document.createElement('div');
    modal.className = 'modal delete-modal';
    modal.innerHTML = `
        <div class="modal-content delete-content">
            <div class="delete-icon">⚠️</div>
            <h2>Delete Subgoal</h2>
            <div class="delete-details">
                <p><strong>Subgoal:</strong> "${subgoal.title}"</p>
                <p><strong>Assigned Days:</strong> ${subgoal.assignedDays} days</p>
                ${subgoal.bufferDays ? `<p><strong>Buffer Days:</strong> +${subgoal.bufferDays} days</p>` : ''}
                ${nestedCount > 0 ? `<p><strong>Nested Subgoals:</strong> ${nestedCount} will also be deleted</p>` : ''}
            </div>
            <div class="delete-warning">
                <p>⚠️ <strong>This action cannot be undone!</strong></p>
                ${nestedCount > 0 ? `<p>All ${nestedCount} nested subgoals will be permanently deleted.</p>` : ''}
            </div>
            <div class="form-actions">
                <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                <button class="btn btn-danger" onclick="confirmDeleteSubgoal(${subgoal.id})">Delete Subgoal</button>
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

function countNestedSubgoals(subgoals) {
    let count = 0;
    subgoals.forEach(sg => {
        count += 1;
        count += countNestedSubgoals(sg.subgoals || []);
    });
    return count;
}

function confirmDeleteSubgoal(id) {
    // Close the modal first
    const modal = document.querySelector('.delete-modal');
    if (modal) modal.remove();

    fetch(`/delete_subgoal/${id}/`, {
        method: 'DELETE',
        headers: {
            'X-CSRFToken': getCookie('csrftoken')
        }
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                // Remove from local data
                function remove(list) {
                    const x = list.findIndex(s => s.id === id);
                    if (x !== -1) return list.splice(x, 1);
                    for (let sg of list) if (remove(sg.subgoals || [])) return true;
                }
                remove(currentGoal.subgoals);

                // After deletion, update parent completion status
                updateParentCompletionStatus(currentGoal.subgoals);

                renderSubgoals();
                renderGoalDetails();
                showSuccessModal('Subgoal deleted successfully!');
            }
        })
        .catch(err => {
            console.error('Error deleting subgoal:', err);
            showErrorModal('Failed to delete subgoal. Please try again.');
        });
}
