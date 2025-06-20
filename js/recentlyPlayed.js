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

    if (player.banned && wasBanRecentlyShown(player.id)) {
        console.debug(`[NOTIFY] Skipping banned player ${player.name}, recently shown.`);
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
    let isOnRaidStreak = false;
    let streakNotificationKillText = '';

    if (player.currentWinstreak > 5 && !player.banned) {
        isOnRaidStreak = true;
        allowToPlayLastRaidSound = false;
        const pmcRaid = new Audio('media/sounds/raidstreak/5raidstreak.wav');
        pmcRaid.volume = 0.05;
        pmcRaid.play();

        streakNotificationKillText = `ON A ${player.currentWinstreak} RAID WIN STREAK!`;
    }

    // Killstreak
    if (!isOnRaidStreak && player.lastRaidSurvived && player.lastRaidKills > 1 && allowToPlayLastRaidSound && !player.banned) {
        allowToPlayLastRaidSound = false;
        let killStreak;
        let soundFile;
        let notificationText;

        const kills = player.lastRaidKills;

        switch (true) {
            case kills === 2:
                notificationText = `${player.name} JUST GOT OUT WITH DOUBLE KILL!`;
                soundFile = '2.wav';
                break;
            case kills === 3:
                notificationText = `${player.name} IS ON TRIPLE KILL!`;
                soundFile = '3.wav';
                break;
            case kills >= 6 && kills < 8:
                notificationText = `${player.name} IS WICKED WITH ${kills} KILLS!`;
                soundFile = '6.wav';
                break;
            case kills >= 8 && kills < 10:
                notificationText = `${player.name} IS UNSTOPPABLE!<br>${kills} KILLS!`;
                soundFile = '8.wav';
                break;
            case kills >= 10 && kills < 12:
                notificationText = `${player.name} IS A TARKOV DEMON!<br>${kills} KILLS!`;
                soundFile = '10.wav';
                break;
            case kills >= 12 && kills < 15:
                notificationText = `${player.name} IS GODLIKE!<br>${kills} KILLS!`;
                soundFile = '12.wav';
                break;
            case kills >= 15:
                notificationText = `SOMEONE STOP THIS MACHINE!<br>${kills} KILLS IN ONE RAID!`;
                soundFile = '15.wav';
                break;
            default:
                return;
        }

        streakNotificationKillText = notificationText;
        if (soundFile) {
            killStreak = new Audio(`media/sounds/killstreak/${soundFile}`);
            killStreak.volume = 0.04;
            killStreak.play().catch(e => console.error('Audio play failed:', e));
        }
    }

    // Sounds
    if (player.lastRaidAs === "PMC" && player.lastRaidSurvived && allowToPlayLastRaidSound && !player.banned) {
        const pmcRaid = new Audio('media/sounds/pmc-raid-run.ogg');
        pmcRaid.volume = 0.05;
        pmcRaid.play();
    } else if (player.lastRaidAs === "PMC" && !player.lastRaidSurvived) {
        const pmcRaidDied = new Audio('media/sounds/pmc-raid-died.wav');
        pmcRaidDied.volume = 0.05;
        pmcRaidDied.play();
    }

    allowToPlayLastRaidSound = true;

    const notification = document.createElement('div');
    if (player.banned) {
        notification.className = `player-notification-r died-bg border-died`;
    }

    if (player.publicProfile && !player.banned) {
        notification.className = `player-notification-r ${player.discFromRaid ? 'disconnected-bg border-died' : player.isTransition ? 'transit-bg' : player.lastRaidSurvived ? 'survived-bg border-survived' : 'died-bg border-died'}`;
    } else if (!player.publicProfile && !player.banned) {
        notification.className = `player-notification-r player-notification-private-background`;
    }

    if (player.banned) {
        const introMusic = new Audio('media/sounds/ban/ban_reveal.mp3');
        introMusic.volume = 0.10;
        introMusic.play();

        introMusic.addEventListener('ended', () => {
            const mainBanSound = new Audio('media/sounds/ban/ban.mp3');
            mainBanSound.volume = 0.15;
            mainBanSound.play();

            createBanNotification(player);
            setBanNotificationCookie(player.id);
        });

        return;
    } else {
        notification.innerHTML = `
        <div class="notification-content-r">
            <div class="notification-header-r">
                <img src="${player.profilePicture || 'media/default_avatar.png'}" alt="${player.name}'s avatar" class="notification-avatar-r" onerror="this.src='media/default_avatar.png';">
                <div class="notification-text">
                    <span class="notification-name-r" style="color:${accountColor}">
                        ${specialIconNotification}${player.teamTag ? `[${player.teamTag}]` : ``} ${player.name}
                    </span>
                    <span class="notification-info-r">
                        Finished raid • ${formatLastPlayedRaid(player.absoluteLastTime)} • ${!player.isCasual ? `Rank #${player.rank}` : `Casual Mode`}
                    </span>
                </div>
            </div>
            ${player.publicProfile ? `
            <div class="raid-overview-notify">
                <span class="raid-result ${player.lastRaidRanThrough ? 'run-through' : player.discFromRaid ? 'disconnected' : player.isTransition ? 'transit' : player.lastRaidSurvived ? 'survived' : 'died'}">
                    ${player.lastRaidRanThrough ? `<i class='bx  bxs-walking'></i> Runner` : player.discFromRaid ? `<i class='bx  bxs-arrow-out-left-square-half'></i> Left` : player.isTransition ? `<i class='bx bxs-refresh-cw bx-spin'></i>  In Transit (${player.lastRaidMap}
                    <i class='bx bxs-chevrons-right'></i>  ${player.lastRaidTransitionTo || 'Unknown'})` : player.lastRaidSurvived ? `<i class='bx  bxs-walking'></i> Survived` : `
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
    }

    const container = document.getElementById('notifications-container-r') || createNotificationsContainer();
    container.appendChild(notification);

    notificationStack.push(notification);
    updateNotificationPositions();

    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s forwards';
        console.debug(`[NOTIFY] Notification fade started for ${player.name}`);
    }, 12000);

    setTimeout(() => {
        notification.remove();
        const index = notificationStack.indexOf(notification);
        if (index > -1) {
            notificationStack.splice(index, 1);
        }
        updateNotificationPositions();
        console.debug(`[NOTIFY] Notification removed for ${player.name}`);
    }, 15000);
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

        if (player.absoluteLastTime > fiveMinutesAgo || player.banTime > fiveMinutesAgo && player.banned) {
            console.debug(`[CHECK] Player ${player.name} finished raid at ${player.absoluteLastTime}, showing notification.`);
            showPlayerNotification(player);
        }
    });
}

function wasBanRecentlyShown(playerId) {
    const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith(`banNotify_${playerId}=`));
    return !!cookieValue;
}

function setBanNotificationCookie(playerId) {
    const now = new Date();
    now.setTime(now.getTime() + (20 * 60 * 1000)); // 10 mins
    document.cookie = `banNotify_${playerId}=1; expires=${now.toUTCString()}; path=/`;
}

function createBanNotification(player) {
    const notification = document.createElement('div');
    notification.className = `player-notification-r died-bg border-died`;
    notification.innerHTML = `
        <div class="notification-content-r">
            <div class="notification-header-r">
                <img src="${player.profilePicture || 'media/default_avatar.png'}" alt="${player.name}'s avatar" class="notification-avatar-r" onerror="this.src='media/default_avatar.png';">
                <div class="notification-text">
                    <span class="notification-name-r">
                        ${player.teamTag ? `[${player.teamTag}]` : ``} ${player.name}
                    </span>
                </div>
            </div>
            <div class="raid-overview-notify">
                <span class="notification-ban">
                    Was permanently banned from Leaderboard.
                </span>
                <span class="ban-text">
                    Banned at: ${player.banTime}<br>
                    Reason: ${player.banReason}
                </span>
                <span class="ban-issued">
                    Banned by ${player.tookAction}
                </span>
            </div>
        </div>
    `;
    const container = document.getElementById('notifications-container-r') || createNotificationsContainer();
    container.appendChild(notification);
    notificationStack.push(notification);
    updateNotificationPositions();

    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s forwards';
    }, 27000);

    setTimeout(() => {
        notification.remove();
        const index = notificationStack.indexOf(notification);
        if (index > -1) {
            notificationStack.splice(index, 1);
        }
        updateNotificationPositions();
    }, 30000);
}
