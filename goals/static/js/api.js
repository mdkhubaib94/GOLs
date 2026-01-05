// ================================================
// BACKEND DATA / API
// ================================================

function loadGoalsFromBackend() {
    return fetch('/get_goals/')
        .then(res => res.json())
        .then(data => {
            goals = data.goals || [];
            // Load user name from localStorage for now (you can add user model later)
            const userData = JSON.parse(localStorage.getItem('accountabilityUserData') || '{}');
            userName = userData.userName || "User";
        })
        .catch(err => {
            console.error('Error loading goals:', err);
            goals = [];
        });
}

function loadAllTimeblocks() {
    return fetch('/get_timeblocks/')
        .then(res => res.json())
        .then(data => {
            window.allTimeblocks = data.timeblocks || [];
            console.log('Loaded all timeblocks:', window.allTimeblocks.length);
        })
        .catch(err => {
            console.error('Error loading timeblocks:', err);
            window.allTimeblocks = [];
        });
}

function loadUnavailableDaysFromStorage() {
    try {
        const data = localStorage.getItem('unavailableDays');
        unavailableDays = data ? JSON.parse(data) : {};
    } catch (e) {
        console.error('Error loading unavailable days:', e);
        unavailableDays = {};
    }
}

function loadSpecialEventsFromStorage() {
    try {
        const data = localStorage.getItem('specialEvents');
        specialEvents = data ? JSON.parse(data) : {};
    } catch (e) {
        console.error('Error loading special events:', e);
        specialEvents = {};
    }
}

function saveUnavailableDaysToStorage() {
    localStorage.setItem('unavailableDays', JSON.stringify(unavailableDays));
}

function saveSpecialEventsToStorage() {
    localStorage.setItem('specialEvents', JSON.stringify(specialEvents));
}
