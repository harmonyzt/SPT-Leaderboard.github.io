//     _____ ____  ______   __    _________    ____  __________  ____  ____  ___    ____  ____ 
//    / ___// __ \/_  __/  / /   / ____/   |  / __ \/ ____/ __ \/ __ )/ __ \/   |  / __ \/ __ \
//    \__ \/ /_/ / / /    / /   / __/ / /| | / / / / __/ / /_/ / __  / / / / /| | / /_/ / / / /  
//   ___/ / ____/ / /    / /___/ /___/ ___ |/ /_/ / /___/ _, _/ /_/ / /_/ / ___ |/ _, _/ /_/ / 
//  /____/_/     /_/    /_____/_____/_/  |_/_____/_____/_/ |_/_____/\____/_/  |_/_/ |_/_____/  

document.addEventListener('DOMContentLoaded', function () {
    const closeButton = document.querySelector('.close-notification');
    const notification = document.querySelector('.leaderboard-notification');

    if (closeButton && notification) {
        closeButton.addEventListener('click', function () {
            closeNotification();
        });

        // 12 second timeout
        const autoCloseTimer = setTimeout(closeNotification, 12000);

        function closeNotification() {
            clearTimeout(autoCloseTimer);
            notification.classList.add('hide');

            notification.addEventListener('animationend', function handler() {
                notification.removeEventListener('animationend', handler);
                notification.remove();
            });
        }
    }
});