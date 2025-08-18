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
let lastNotificationTime = 0;
const NOTIFICATION_DELAY = 2000;
const MAX_NOTIFICATIONS = 5;

async function showPlayerNotification(player) {
    if (!player.absoluteLastTime) {
        console.debug(`[NOTIFY] Skipping player ${player.name} – no absoluteLastTime data.`);
        return;
    }

    // Player was banned and already shown to user
    if (player.banned && wasBanRecentlyShown(player.id)) {
        console.debug(`[NOTIFY] Skipping banned player ${player.name}, recently shown.`);
        return;
    }

    // Throttle notifications
    if (notificationStack.length >= MAX_NOTIFICATIONS) {
        const oldestNotification = notificationStack.shift();
        oldestNotification.remove();
    }

    const now = Date.now();
    const timeSinceLast = now - lastNotificationTime;

    if (timeSinceLast < NOTIFICATION_DELAY) {
        await new Promise(resolve => setTimeout(resolve, NOTIFICATION_DELAY - timeSinceLast));
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

    let rankClass = '';
    switch (player.rank) {
        case 1:
            rankClass = "Legendary";
            break;
    
        case 2:
            rankClass = "Rare";
            break;
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
    const kills = player.lastRaidKills;
    if (!isOnRaidStreak && player.lastRaidSurvived && player.lastRaidKills > 1 && allowToPlayLastRaidSound && !player.banned) {
        allowToPlayLastRaidSound = false;
        let killStreak;
        let soundFile;
        let notificationText;

        switch (true) {
            case kills === 2:
                notificationText = `${player.name} just made double kill!`;
                soundFile = '2.wav';
                break;
            case kills === 3:
                notificationText = `${player.name} is on triple kill!`;
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
            killStreak.play().then().catch(e => console.error('Audio play failed:', e));
        }
    }

    // Sounds
    if (!player.banned && allowToPlayLastRaidSound) {
        if (player.lastRaidAs === "PMC" && player.lastRaidSurvived) {
            const pmcRaid = new Audio('media/sounds/pmc-raid-run.ogg');
            pmcRaid.volume = 0.05;
            pmcRaid.play();
        } else if (player.lastRaidAs === "PMC" && !player.lastRaidSurvived) {
            const pmcRaidDied = new Audio('media/sounds/pmc-raid-died.wav');
            pmcRaidDied.volume = 0.05;
            pmcRaidDied.play();
        } else if (player.lastRaidAs === "SCAV" && player.lastRaidSurvived) {
            const pmcRaid = new Audio('media/sounds/scav-raid-run.mp3');
            pmcRaid.volume = 0.20;
            pmcRaid.play();
        } else if (player.lastRaidAs === "SCAV" && !player.lastRaidSurvived) {
            const pmcRaidDied = new Audio('media/sounds/scav-raid-died.wav');
            pmcRaidDied.volume = 0.15;
            pmcRaidDied.play();
        }
    }

    allowToPlayLastRaidSound = true;

    // Create notification element
    const notification = document.createElement('div');

    // Set backgrounds based on the game/ban
    if (player.banned) {
        notification.className = `player-notification-r died-bg border-died`;
    } else if (player.publicProfile && !player.banned) {
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
                <img src="${player.profilePicture}" alt="${player.name}'s avatar" class="notification-avatar-r" onerror="this.src='media/default_avatar.png';">
                <div class="notification-text">
                    <span class="notification-name-r" style="color:${accountColor}">
                        ${specialIconNotification}${player.teamTag ? `[${player.teamTag}]` : ``} ${player.name}
                    </span>
                    <span class="notification-info-r">
                        Finished raid • ${formatLastPlayedRaid(player.absoluteLastTime)} • ${!player.isCasual ? `<span class="${rankClass}">Rank #${player.rank}</span>` : `Casual Mode`}
                    </span>
                </div>
            </div>
            ${player.publicProfile ? `
            <div class="raid-overview-notify">
                <span class="raid-result ${player.lastRaidRanThrough ? 'run-through' : player.discFromRaid ? 'disconnected' : player.isTransition ? 'transit' : player.lastRaidSurvived ? 'survived' : 'died'}">
                    ${player.lastRaidRanThrough ? `<i class='bx  bxs-walking'></i> Runner` : player.discFromRaid ? `<i class='bx  bxs-arrow-out-left-square-half'></i> Left` : player.isTransition ? `<i class='bx bxs-refresh-cw bx-spin'></i>  In Transit (${player.lastRaidMap}
                    <i class='bx bxs-chevrons-right'></i>  ${player.lastRaidTransitionTo || 'Unknown'})` : player.lastRaidSurvived ? `<i class='bx  bxs-walking'></i> Survived` : `
                    <i class="fa-solid fa-skull-crossbones"></i> Killed in Action`}
                </span>
                <span class="raid-meta-notify">
                    ${player.lastRaidMap || 'Unknown'} • ${player.lastRaidAs || 'N/A'} ${player.lastRaidSurvived ? `` : `• Killed by ${player.agressorName}`}
                </span>
                ${kills > 3 ? `
                    <span class="notification-last-raid-streak">
                        ${streakNotificationKillText}
                    </span>
                    ` : `
                    <span class="notification-last-raid-streak-common">
                        ${streakNotificationKillText}
                    </span>
                    `}
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
    document.body.appendChild(container);
    console.debug(`[NOTIFY] Notification container created.`);
    return container;
}

function checkRecentPlayers(leaderboardData) {
    const currentTime = Math.floor(Date.now() / 1000);
    const fiveMinutesAgo = currentTime - 300;
    const twoHoursAgo = currentTime - 7200;

    // Sort notifications by the newest ones first
    const sortedPlayers = [...leaderboardData].sort((a, b) =>
        (b.absoluteLastTime || 0) - (a.absoluteLastTime || 0));

    let shownCount = 0;
    const MAX_INITIAL_NOTIFICATIONS = 3;

    for (const player of sortedPlayers) {
        if (shownCount >= MAX_INITIAL_NOTIFICATIONS) break;

        if (!player.absoluteLastTime) continue;

        if ((player.absoluteLastTime > fiveMinutesAgo) ||
            (player.banned && player.banTime > twoHoursAgo)) {

            shownCount++;
            setTimeout(() => showPlayerNotification(player), shownCount * NOTIFICATION_DELAY);
        }
    }
}

function wasBanRecentlyShown(playerId) {
    const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith(`banNotify_${playerId}=`));
    return !!cookieValue;
}

function setBanNotificationCookie(playerId) {
    const now = new Date();
    now.setTime(now.getTime() + (61 * 60 * 1000)); // 61 mins
    document.cookie = `banNotify_${playerId}=1; expires=${now.toUTCString()}; path=/`;
}

function createBanNotification(player) {
    const notification = document.createElement('div');
    notification.className = `player-notification-r died-bg border-died`;
    notification.innerHTML = `
        <div class="notification-content-r">
            <div class="notification-header-r">
                <img src="media/default_avatar.png" alt="${player.name}'s avatar" class="notification-avatar-r">
                <div class="notification-text">
                    <span class="notification-name-r">
                        ${player.teamTag ? `[${player.teamTag}]` : ``} ${player.name}
                    </span>
                </div>
            </div>
            <div class="raid-overview-notify">
                <span class="notification-ban">
                    Was ${player.permBanned ? `permanently` : ``} banned from Leaderboard.
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
