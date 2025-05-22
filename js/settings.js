document.addEventListener('DOMContentLoaded', () => {
    const notifToggle = document.getElementById('notificationsToggle');
    const timerToggle = document.getElementById('timerToggle');

    // Set default cookies
    notifToggle.checked = getCookie('notificationsEnabled') === 'true';
    timerToggle.checked = getCookie('showTimer') === 'true';

    // Watch for checks
    notifToggle.addEventListener('change', () => {
        setCookie('notificationsEnabled', notifToggle.checked);
    });

    timerToggle.addEventListener('change', () => {
        setCookie('showTimer', timerToggle.checked);
    });
});