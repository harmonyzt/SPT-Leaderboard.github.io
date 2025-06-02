//     _____ ____  ______   __    _________    ____  __________  ____  ____  ___    ____  ____ 
//    / ___// __ \/_  __/  / /   / ____/   |  / __ \/ ____/ __ \/ __ )/ __ \/   |  / __ \/ __ \
//    \__ \/ /_/ / / /    / /   / __/ / /| | / / / / __/ / /_/ / __  / / / / /| | / /_/ / / / /  
//   ___/ / ____/ / /    / /___/ /___/ ___ |/ /_/ / /___/ _, _/ /_/ / /_/ / ___ |/ _, _/ /_/ / 
//  /____/_/     /_/    /_____/_____/_/  |_/_____/_____/_/ |_/_____/\____/_/  |_/_/ |_/_____/  

const shownPlayerNotifications = new Set();
const playerLastRaidTimes = new Map();
const notificationStack = [];
const playerNotificationData = new Map();
let allowToPlayLastRaidSound = true;

function showPlayerNotification(player) {
    if (!player.absoluteLastTime) {
        console.debug(`[NOTIFY] Skipping player ${player.name} – no absoluteLastTime data.`);
        return;
    }

    const lastRaidTime = player.absoluteLastTime;
    const currentData = playerNotificationData.get(player.id);

    if (currentData && currentData.lastRaidTime === lastRaidTime) {
        console.debug(`[NOTIFY] Player ${player.name} already shown for this raid at ${lastRaidTime}.`);
        return;
    }

    playerNotificationData.set(player.id, {
        lastRaidTime: lastRaidTime
    });

    let specialIconNotification = '';
    let accountColor = '';

    loadTeamsData();

    // Tester
    if (player.trusted) {
        specialIconNotification = '<img src="media/trusted.png" alt="Tester" class="account-icon">';
        accountColor = '#ba8bdb';
    }

    // Developer
    if (player.dev) {
        specialIconNotification = `<img src="media/leaderboard_icons/icon_developer.png" alt="Developer" style="width: 15px; height: 15px" class="account-icon">`;
        accountColor = '#2486ff';
    }

    // Raidstreak/Killstreaks
    let isOnKillStreak = false;
    let isOnRaidStreak = false;
    let streakNotificationKillText = '';

    if (player.currentWinstreak > 5) {
        isOnRaidStreak = true;
        allowToPlayLastRaidSound = false;
        const pmcRaid = new Audio('media/sounds/raidstreak/5raidstreak.wav');
        pmcRaid.volume = 0.05;
        pmcRaid.play();

        streakNotificationKillText = `ON A ${player.currentWinstreak} RAID WIN STREAK!`;
    }

    // Killstreak
    if (!isOnRaidStreak && player.lastRaidSurvived && player.lastRaidKills > 5 && allowToPlayLastRaidSound) {
        allowToPlayLastRaidSound = false;
        isOnKillStreak = true;
        let killStreak;

        switch (true) {
            case player.lastRaidKills >= 6 && player.lastRaidKills < 8:
                streakNotificationKillText = `${player.name} IS WHICKED WITH ${player.lastRaidKills} KILLS!`;
                killStreak = new Audio('media/sounds/killstreak/6.wav');
                killStreak.volume = 0.04;
                killStreak.play();
                break;
            case player.lastRaidKills >= 8 && player.lastRaidKills < 10:
                streakNotificationKillText = `${player.name} IS UNSTOPPABLE!<br> ${player.lastRaidKills} KILLS!`;
                killStreak = new Audio('media/sounds/killstreak/8.wav');
                killStreak.volume = 0.04;
                killStreak.play();
                break;
            case player.lastRaidKills >= 10 && player.lastRaidKills < 15:
                streakNotificationKillText = `${player.name} IS A TARKOV DEMON!<br> ${player.lastRaidKills} KILLS!`;
                killStreak = new Audio('media/sounds/killstreak/10.wav');
                killStreak.volume = 0.04;
                killStreak.play();
                break;
            case player.lastRaidKills >= 15:
                streakNotificationKillText = `SOMEONE STOP THIS MACHINE!<br> ${player.lastRaidKills} KILLS IN ONE RAID!`;
                killStreak = new Audio('media/sounds/killstreak/15.wav');
                killStreak.volume = 0.04;
                killStreak.play();
                break;
        }
    }

    // Sounds
    if (player.lastRaidAs === "PMC" && player.lastRaidSurvived && allowToPlayLastRaidSound) {
        const pmcRaid = new Audio('media/sounds/pmc-raid-run.ogg');
        pmcRaid.volume = 0.07;
        pmcRaid.play();
    } else if (player.lastRaidAs === "PMC" && !player.lastRaidSurvived) {
        const pmcRaidDied = new Audio('media/sounds/pmc-raid-died.wav');
        pmcRaidDied.volume = 0.07;
        pmcRaidDied.play();
    }

    allowToPlayLastRaidSound = true;

    const notification = document.createElement('div');
    if (player.publicProfile) {
        notification.className = `player-notification-r ${player.discFromRaid ? 'disconnected-bg border-died' : player.isTransition ? 'transit-bg' : player.lastRaidSurvived ? 'survived-bg border-survived' : 'died-bg border-died'}`;
    } else {
        notification.className = `player-notification-r player-notification-private-background`;
    }

    notification.innerHTML = `
        <div class="notification-content-r">
            <div class="notification-header-r">
                <img src="${player.profilePicture || 'media/default_avatar.png'}" alt="${player.name}'s avatar" class="notification-avatar-r" onerror="this.src='media/default_avatar.png';">
                <div class="notification-text">
                    <span class="notification-name-r" style="color:${accountColor}">
                        ${specialIconNotification}${player.teamTag ? `[${player.teamTag}]` : ``} ${player.name}
                    </span>
                    <span class="notification-info-r">
                        Finished raid • ${formatLastPlayedRaid(player.absoluteLastTime)} • Rank #${player.rank}
                    </span>
                </div>
            </div>
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

                ${streakNotificationKillText ? `
                <span class="notification-last-raid-streak">
                    ${streakNotificationKillText}
                </span>
                ` : ''}
            </div>
            `: ''}
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
    const currentTime = Math.floor(Date.now() / 1000);
    const fiveMinutesAgo = currentTime - 1200;

    console.debug(`[CHECK] Checking for recent players... Time now: ${currentTime}`);

    leaderboardData.forEach(player => {
        if (!player.absoluteLastTime) {
            console.debug(`[CHECK] Skipping player ${player.name} - no absoluteLastTime.`);
            return;
        }

        if (player.absoluteLastTime > fiveMinutesAgo) {
            console.debug(`[CHECK] Player ${player.name} finished raid at ${player.absoluteLastTime}, showing notification.`);
            showPlayerNotification(player);
        }
    });
}
