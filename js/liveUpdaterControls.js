//     _____ ____  ______   __    _________    ____  __________  ____  ____  ___    ____  ____ 
//    / ___// __ \/_  __/  / /   / ____/   |  / __ \/ ____/ __ \/ __ )/ __ \/   |  / __ \/ __ \
//    \__ \/ /_/ / / /    / /   / __/ / /| | / / / / __/ / /_/ / __  / / / / /| | / /_/ / / / /  
//   ___/ / ____/ / /    / /___/ /___/ ___ |/ /_/ / /___/ _, _/ /_/ / /_/ / ___ |/ _, _/ /_/ / 
//  /____/_/     /_/    /_____/_____/_/  |_/_____/_____/_/ |_/_____/\____/_/  |_/_/ |_/_____/  

// Usage:
// AutoUpdater.setEnabled(false);
// AutoUpdater.setInterval(10);
// AutoUpdater.forceUpdate();

const AutoUpdater = (() => {
    let updateInterval = 5; // seconds
    let timeLeft = updateInterval;
    let autoUpdateEnabled = true;
    let updateTimer;
    let timeToUpdateSpan;
    let autoUpdateToggle;

    // Private
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        return parts.length === 2 ? parts.pop().split(';').shift() : null;
    }

    function setCookie(name, value, days = 30) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${value};expires=${date.toUTCString()};path=/`;
    }

    function startUpdateTimer() {
        clearInterval(updateTimer);
        updateTimeDisplay();

        updateTimer = setInterval(() => {
            timeLeft--;
            updateTimeDisplay();

            if (timeLeft <= 0) {
                loadSeasonData(seasons[0]);
                timeLeft = updateInterval;
            }
        }, 1000);
    }

    function updateTimeDisplay() {
        if (!timeToUpdateSpan) return;
        timeToUpdateSpan.textContent = autoUpdateEnabled
            ? `Next update in: ${timeLeft}s`
            : "Auto-update disabled";
    }

    // Public
    return {
        init(updateToggleId = 'autoUpdateToggle', timeDisplayId = 'timeToUpdate') {
            autoUpdateToggle = document.getElementById(updateToggleId);
            timeToUpdateSpan = document.getElementById(timeDisplayId);

            autoUpdateEnabled = getCookie('autoUpdateEnabled') !== 'false';
            if (autoUpdateToggle) autoUpdateToggle.checked = autoUpdateEnabled;

            if (autoUpdateToggle) {
                autoUpdateToggle.addEventListener('change', (e) => {
                    this.setEnabled(e.target.checked);
                });
            }

            // Init timer
            if (autoUpdateEnabled) {
                startUpdateTimer();
            } else if (timeToUpdateSpan) {
                timeToUpdateSpan.textContent = "Auto-update disabled";
            }
        },

        setEnabled(enabled) {
            autoUpdateEnabled = enabled;
            setCookie('autoUpdateEnabled', enabled, 30);
            if (autoUpdateToggle) autoUpdateToggle.checked = enabled;

            if (enabled) {
                timeLeft = updateInterval;
                startUpdateTimer();
            } else {
                clearInterval(updateTimer);
                if (timeToUpdateSpan) timeToUpdateSpan.textContent = "Auto-update disabled";
            }
        },

        setInterval(seconds) {
            updateInterval = seconds;
            timeLeft = seconds;
            if (autoUpdateEnabled) {
                startUpdateTimer();
            }
        },

        getStatus() {
            return autoUpdateEnabled;
        },

        forceUpdate() {
            if (autoUpdateEnabled) {
                timeLeft = updateInterval;
                updateTimeDisplay();
            }
            loadSeasonData(seasons[0]);
        }
    };
})();

document.addEventListener('DOMContentLoaded', () => {
    AutoUpdater.init();
});