//     _____ ____  ______   __    _________    ____  __________  ____  ____  ___    ____  ____ 
//    / ___// __ \/_  __/  / /   / ____/   |  / __ \/ ____/ __ \/ __ )/ __ \/   |  / __ \/ __ \
//    \__ \/ /_/ / / /    / /   / __/ / /| | / / / / __/ / /_/ / __  / / / / /| | / /_/ / / / /  
//   ___/ / ____/ / /    / /___/ /___/ ___ |/ /_/ / /___/ _, _/ /_/ / /_/ / ___ |/ _, _/ /_/ / 
//  /____/_/     /_/    /_____/_____/_/  |_/_____/_____/_/ |_/_____/\____/_/  |_/_/ |_/_____/  

const shownPlayerNotifications = new Set();
const playerLastRaidTimes = new Map();
const notificationStack = [];
const playerNotificationData = new Map();

function showPlayerNotification(player) {
    if (!player.lastPlayed) {
        console.debug(`[NOTIFY] Skipping player ${player.name} – no lastPlayed data.`);
        return;
    }

    const lastRaidTime = player.lastPlayed;
    const currentData = playerNotificationData.get(player.id);

    if (currentData && currentData.lastRaidTime === lastRaidTime) {
        console.debug(`[NOTIFY] Player ${player.name} already shown for this raid at ${lastRaidTime}.`);
        return;
    }

    if (currentData && currentData.timeoutId) {
        console.debug(`[NOTIFY] Clearing existing timeout for player ${player.name}.`);
        clearTimeout(currentData.timeoutId);
    }

    const timeoutId = setTimeout(() => {
        console.debug(`[NOTIFY] Timeout expired – removing data for player ${player.name}.`);
        playerNotificationData.delete(player.id);
    }, 400000); // 5 min

    playerNotificationData.set(player.id, {
        lastRaidTime: lastRaidTime,
        timeoutId: timeoutId
    });

    //console.debug(`[NOTIFY] Showing notification for player ${player.name}, lastPlayed: ${lastRaidTime}`);

    let specialIconNotification = '';
    let accountColor = '';

    // Tester
    if (player.trusted) {
        specialIconNotification = '<img src="media/trusted.png" alt="Tester" class="account-icon">';
        accountColor = '#ba8bdb';
    }

    // Developer
    if (player.dev) {
        specialIconNotification = `<img src="media/leaderboard_icons/icon_developer.png" alt="Developer"  style="width: 15px; height: 15px" class="account-icon">`;
        accountColor = '#2486ff';
    }

    // Sounds
    // NOTE: Works only if user interacted with website or allowed sounds
    if(player.lastRaidAs === "PMC"){
        const pmcRaid = new Audio('media/sounds/pmc-raid-run.ogg'); 
        pmcRaid.volume = 0.2;
        pmcRaid.play();
    } else if (player.lastRaidAs === "SCAV") {
        const scavRaid = new Audio('media/sounds/scav-raid-run.mp3');
        scavRaid.volume = 0.2;
        scavRaid.play();
    }

    const notification = document.createElement('div');
    notification.className = 'player-notification-r';
    notification.innerHTML = `
        <div class="notification-content-r">
            <div class="notification-text">
                <span class="notification-name-r" style="color:${accountColor}">${specialIconNotification} ${player.name}</span>
                <span class="notification-info-r">Finished raid • ${formatLastPlayedRaid(player.lastPlayed)}</span>
        ${player.publicProfile ? `
            <div class="raid-overview-notify">
            <span class="raid-result-r ${player.discFromRaid ? 'disconnected' : player.isTransition ? 'transit' : player.lastRaidSurvived ? 'survived' : 'died'}">
                ${player.discFromRaid ? `<em class="bx bxs-log-out"></em> Left` : player.isTransition ? `<i class="bx bx-loader-alt bx-spin" style="line-height: 0 !important;"></i> In Transit (${player.lastRaidMap}
                <em class="bx bxs-chevrons-right" style="position: relative; top: 2px;"></em> ${player.lastRaidTransitionTo || 'Unknown'})` : player.lastRaidSurvived ? `<em class="bx bx-walk"></em> Survived` : `
                <em class="bx bxs-skull"></em> Killed in Action`}
            </span>
            <span class="raid-meta-notify">
                ${player.lastRaidMap || 'Unknown'} • ${player.lastRaidAs || 'N/A'}
            </span>
        </div>
        `: ''}
            </div>
        </div>
    `;

    const container = document.getElementById('notifications-container-r') || createNotificationsContainer();
    container.appendChild(notification);

    notificationStack.push(notification);
    updateNotificationPositions();

    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s forwards';
        console.debug(`[NOTIFY] Notification fade started for ${player.name}`);
    }, 67000);

    setTimeout(() => {
        notification.remove();
        const index = notificationStack.indexOf(notification);
        if (index > -1) {
            notificationStack.splice(index, 1);
        }
        updateNotificationPositions();
        console.debug(`[NOTIFY] Notification removed for ${player.name}`);
    }, 70000);
}

function updateNotificationPositions() {
    const offset = 10;
    let topPosition = 100;

    notificationStack.forEach((notif, index) => {
        notif.style.top = `${topPosition}px`;
        notif.style.right = '10px';
        notif.style.zIndex = 1000 + index;
        topPosition += notif.offsetHeight + offset;
    });
}

function createNotificationsContainer() {
    const container = document.createElement('div');
    container.id = 'notifications-container-r';
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.right = '0';
    container.style.width = '300px';
    container.style.pointerEvents = 'none';
    document.body.appendChild(container);
    console.debug(`[NOTIFY] Notification container created.`);
    return container;
}

function checkRecentPlayers(leaderboardData) {
    // Don't show anything if user has notifications disabled...
    if (getCookie('notificationsEnabled') === 'false') {
        return;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const fiveMinutesAgo = currentTime - 1200;

    console.debug(`[CHECK] Checking for recent players... Time now: ${currentTime}`);

    leaderboardData.forEach(player => {
        if (!player.lastPlayed) {
            console.debug(`[CHECK] Skipping player ${player.name} - no lastPlayed.`);
            return;
        }

        if (player.lastPlayed > fiveMinutesAgo) {
            console.debug(`[CHECK] Player ${player.name} finished raid at ${player.lastPlayed}, showing notification.`);
            showPlayerNotification(player);
        }
    });
}
