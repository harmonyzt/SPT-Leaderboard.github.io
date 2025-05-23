document.addEventListener('DOMContentLoaded', () => {
    const notifToggle = document.getElementById('notificationsToggle');
    const timerToggle = document.getElementById('timerToggle');
    const seasonTimer = document.getElementById('seasonTimer');
    const timerDisplay = document.getElementById('timerDisplay');


    const seasonEndDate = new Date(2025, 4, 30);

    notifToggle.checked = getCookie('notificationsEnabled') === 'true';
    timerToggle.checked = getCookie('showTimer') === 'true';
    seasonTimer.style.display = timerToggle.checked ? 'block' : 'none';

    // Timer update
    function updateTimer() {
        const now = new Date();
        const diff = seasonEndDate - now;

        if (diff <= 0) {
            timerDisplay.textContent = "Season was ended!";
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        timerDisplay.textContent = `${days}d ${hours}h ${minutes}m`;
    }


    updateTimer();
    const timerInterval = setInterval(updateTimer, 60000);

    notifToggle.addEventListener('change', () => {
        setCookie('notificationsEnabled', notifToggle.checked);
    });

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