//     _____ ____  ______   __    _________    ____  __________  ____  ____  ___    ____  ____ 
//    / ___// __ \/_  __/  / /   / ____/   |  / __ \/ ____/ __ \/ __ )/ __ \/   |  / __ \/ __ \
//    \__ \/ /_/ / / /    / /   / __/ / /| | / / / / __/ / /_/ / __  / / / / /| | / /_/ / / / /  
//   ___/ / ____/ / /    / /___/ /___/ ___ |/ /_/ / /___/ _, _/ /_/ / /_/ / ___ |/ _, _/ /_/ / 
//  /____/_/     /_/    /_____/_____/_/  |_/_____/_____/_/ |_/_____/\____/_/  |_/_/ |_/_____/  

let updateInterval = 5; // seconds
let timeLeft = updateInterval;
let autoUpdateEnabled = true;
let updateTimer;

// Initialize controls from cookies
function initControlsFromCookies() {
    // Auto-update toggle
    const autoUpdateToggle = document.getElementById('autoUpdateToggle');
    const savedAutoUpdate = getCookie('autoUpdateEnabled');
    autoUpdateToggle.checked = savedAutoUpdate !== 'false';
    autoUpdateEnabled = autoUpdateToggle.checked;

    updateTimeDisplay();
}

// Save controls to cookies
function saveControlsToCookies() {
    setCookie('autoUpdateEnabled', autoUpdateEnabled);
    setCookie('updateInterval', updateInterval);
}

function initControls() {
    const autoUpdateToggle = document.getElementById('autoUpdateToggle');
    const manualUpdateBtn = document.getElementById('manualUpdate');
    const timeToUpdateSpan = document.getElementById('timeToUpdate');

    autoUpdateToggle.addEventListener('change', (e) => {
        autoUpdateEnabled = e.target.checked;
        if (autoUpdateEnabled) {
            startUpdateTimer();
        } else {
            clearTimeout(updateTimer);
            timeToUpdateSpan.textContent = "Auto-update disabled";
        }
    });


    manualUpdateBtn.addEventListener('click', () => {
        detectSeasons();
        if (autoUpdateEnabled) {
            timeLeft = updateInterval;
            updateTimeDisplay();
        }
    });

    // start timer
    startUpdateTimer();

    function startUpdateTimer() {
        updateTimer = setInterval(() => {
            updateTimeDisplay();
            timeLeft--;

            if (timeLeft <= 0) {
                detectSeasons();
                timeLeft = updateInterval;
            }
        }, 1000);
    }

    function updateTimeDisplay() {
        timeToUpdateSpan.textContent = `Next update in: ${timeLeft}s`;
    }
}
