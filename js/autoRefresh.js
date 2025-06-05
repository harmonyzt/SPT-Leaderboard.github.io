//     _____ ____  ______   __    _________    ____  __________  ____  ____  ___    ____  ____ 
//    / ___// __ \/_  __/  / /   / ____/   |  / __ \/ ____/ __ \/ __ )/ __ \/   |  / __ \/ __ \
//    \__ \/ /_/ / / /    / /   / __/ / /| | / / / / __/ / /_/ / __  / / / / /| | / /_/ / / / /  
//   ___/ / ____/ / /    / /___/ /___/ ___ |/ /_/ / /___/ _, _/ /_/ / /_/ / ___ |/ _, _/ /_/ / 
//  /____/_/     /_/    /_____/_____/_/  |_/_____/_____/_/ |_/_____/\____/_/  |_/_/ |_/_____/  

let updateInterval = 5; // seconds
let timeLeft = updateInterval;
let autoUpdateEnabled = true;
let updateTimer;

function initControls() {
    const autoUpdateToggle = document.getElementById('autoUpdateToggle');
    const timeToUpdateSpan = document.getElementById('timeToUpdate');

    // Init form cookies
    autoUpdateToggle.checked = getCookie('autoUpdateEnabled') !== 'false';
    autoUpdateEnabled = autoUpdateToggle.checked;

    autoUpdateToggle.addEventListener('change', (e) => {
        autoUpdateEnabled = e.target.checked;
        setCookie('autoUpdateEnabled', autoUpdateEnabled);

        if (autoUpdateEnabled) {
            startUpdateTimer();
        } else {
            clearInterval(updateTimer);
            timeToUpdateSpan.textContent = "Auto-update disabled";
        }
    });

    startUpdateTimer();

    function startUpdateTimer() {
        // Clear old interval
        clearInterval(updateTimer);

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
        timeToUpdateSpan.textContent = `Next update in: ${timeLeft}s`;
    }
}
