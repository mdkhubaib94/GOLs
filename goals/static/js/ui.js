// ================================================
// UI / MODALS
// ================================================

function showSuccessModal(message) {
    const modal = document.createElement('div');
    modal.className = 'modal success-modal';
    modal.innerHTML = `
        <div class="modal-content success-content">
            <div class="success-icon">✓</div>
            <h2>Success!</h2>
            <p>${message}</p>
            <button class="btn btn-primary" onclick="this.closest('.modal').remove()">OK</button>
        </div>
    `;

    document.body.appendChild(modal);

    // Auto-close after 3 seconds
    setTimeout(() => {
        if (modal.parentNode) {
            modal.remove();
        }
    }, 3000);

    // Close on click outside
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    };
}

function showErrorModal(message, title = 'Error') {
    const modal = document.createElement('div');
    modal.className = 'modal error-modal';
    modal.innerHTML = `
        <div class="modal-content error-content">
            <div class="error-icon">❌</div>
            <h2>${title}</h2>
            <p>${message}</p>
            <button class="btn btn-primary" onclick="this.closest('.modal').remove()">OK</button>
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

function showValidationModal(message, title = 'Validation Error') {
    const modal = document.createElement('div');
    modal.className = 'modal validation-modal';
    modal.innerHTML = `
        <div class="modal-content validation-content">
            <div class="validation-icon">⚠️</div>
            <h2>${title}</h2>
            <p>${message}</p>
            <button class="btn btn-primary" onclick="this.closest('.modal').remove()">OK</button>
        </div>
    `;

    document.body.appendChild(modal);

    // Auto-focus on OK button
    setTimeout(() => {
        const okButton = modal.querySelector('.btn');
        if (okButton) okButton.focus();
    }, 100);

    // Close on click outside
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    };
}

function showTimeConflictModal(response) {
    const modal = document.createElement('div');
    modal.className = 'modal validation-modal';

    let conflictDetails = '';
    response.conflicts.forEach(conflict => {
        conflictDetails += `
            <div class="conflict-item">
                <strong>${conflict.date}</strong><br>
                Existing: ${conflict.existing_title} (${conflict.existing_time})<br>
                New: ${conflict.new_time}
            </div>
        `;
    });

    modal.innerHTML = `
        <div class="modal-content validation-content">
            <div class="validation-icon">⚠️</div>
            <h2>Time Conflicts Detected</h2>
            <p>${response.message}</p>
            <div class="conflict-details">
                ${conflictDetails}
            </div>
            ${response.partial_success ? `<p><strong>Note:</strong> ${response.created_count} timeblock(s) were created successfully for non-conflicting dates.</p>` : ''}
            <button class="btn btn-primary" onclick="this.closest('.modal').remove()">OK</button>
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
