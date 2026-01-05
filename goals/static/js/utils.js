// ================================================
// HELPER FUNCTIONS
// ================================================

function $id(id) { return document.getElementById(id); }
function safeRun(fn) { try { fn(); } catch (err) { console.error(err); } }

// Time format conversion utilities
function convertTo12Hour(time24) {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${hour12}:${minutes} ${ampm}`;
}

function convertTo24Hour(time12) {
    if (!time12) return '';
    const [time, ampm] = time12.split(' ');
    const [hours, minutes] = time.split(':');
    let hour = parseInt(hours);

    if (ampm === 'AM' && hour === 12) {
        hour = 0;
    } else if (ampm === 'PM' && hour !== 12) {
        hour += 12;
    }

    return `${hour.toString().padStart(2, '0')}:${minutes}`;
}

function formatTimeFor12Hour(timeString) {
    // If already in 12-hour format, return as is
    if (timeString.includes('AM') || timeString.includes('PM')) {
        return timeString;
    }
    // Convert from 24-hour to 12-hour
    return convertTo12Hour(timeString);
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            cookie = cookie.trim();
            if (cookie.startsWith(name + '=')) {
                cookieValue = decodeURIComponent(cookie.slice(name.length + 1));
                break;
            }
        }
    }

    // If no cookie found and we're looking for csrftoken, try meta tag
    if (!cookieValue && name === 'csrftoken') {
        const metaTag = document.querySelector('meta[name="csrf-token"]');
        if (metaTag) {
            cookieValue = metaTag.getAttribute('content');
        }
    }

    return cookieValue;
}

function formatDate(str) {
    return new Date(str).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    });
}

function saveUserDataToLocalStorage() {
    localStorage.setItem('accountabilityUserData', JSON.stringify({
        userName
    }));
}
