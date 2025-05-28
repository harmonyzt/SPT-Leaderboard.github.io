//     _____ ____  ______   __    _________    ____  __________  ____  ____  ___    ____  ____ 
//    / ___// __ \/_  __/  / /   / ____/   |  / __ \/ ____/ __ \/ __ )/ __ \/   |  / __ \/ __ \
//    \__ \/ /_/ / / /    / /   / __/ / /| | / / / / __/ / /_/ / __  / / / / /| | / /_/ / / / /  
//   ___/ / ____/ / /    / /___/ /___/ ___ |/ /_/ / /___/ _, _/ /_/ / /_/ / ___ |/ _, _/ /_/ / 
//  /____/_/     /_/    /_____/_____/_/  |_/_____/_____/_/ |_/_____/\____/_/  |_/_/ |_/_____/  

// Date for countdown
const seasonEndDate = new Date(2025, 5, 29);

document.addEventListener('DOMContentLoaded', () => {
    const timerToggle = document.getElementById('timerToggle');
    const seasonTimer = document.getElementById('seasonTimer');
    const timerDisplay = document.getElementById('timerDisplay');

    timerToggle.checked = getCookie('showTimer') === 'true';
    seasonTimer.style.display = timerToggle.checked ? 'block' : 'none';

    // Timer update
    function updateTimer() {
        const now = new Date();
        const diff = seasonEndDate - now;

        if (diff <= 0) {
            timerDisplay.textContent = "Season was ended! New starting shortly...";
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        timerDisplay.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }

    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);

    timerToggle.addEventListener('change', () => {
        setCookie('showTimer', timerToggle.checked);
        seasonTimer.style.display = timerToggle.checked ? 'block' : 'none';


        if (!timerToggle.checked) {
            clearInterval(timerInterval);
        } else {
            updateTimer();
            setInterval(updateTimer, 60000);
        }
    });
});