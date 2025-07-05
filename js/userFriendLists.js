//     _____ ____  ______   __    _________    ____  __________  ____  ____  ___    ____  ____ 
//    / ___// __ \/_  __/  / /   / ____/   |  / __ \/ ____/ __ \/ __ )/ __ \/   |  / __ \/ __ \
//    \__ \/ /_/ / / /    / /   / __/ / /| | / / / / __/ / /_/ / __  / / / / /| | / /_/ / / / /  
//   ___/ / ____/ / /    / /___/ /___/ ___ |/ /_/ / /___/ _, _/ /_/ / /_/ / ___ |/ _, _/ /_/ / 
//  /____/_/     /_/    /_____/_____/_/  |_/_____/_____/_/ |_/_____/\____/_/  |_/_/ |_/_____/  

let profileSettingsData = null;
let profileSettingsPromise = null;

document.addEventListener('DOMContentLoaded', () => {
    profileSettingsPromise = getProfileSettings();
});

async function getProfileSettings() {
    try {
        const response = await fetch(`${profileSettingsPath}`);
        if (!response.ok) throw new Error('Failed to load settings');

        profileSettingsData = await response.json();

        return profileSettingsData;
    } catch (error) {
        console.error('Error loading settings:', error);

        profileSettingsData = {};

        throw error;
    }
}

async function checkFriends(player) {
    return new Promise((resolve) => {
        const friends = [];
        const friendLink = player.friendLink;

        if (!friendLink) {
            resolve([]);
            return;
        }

        for (const playerId in leaderboardData) {
            const p = leaderboardData[playerId];
            if (p.friendLink === friendLink && p.id !== player.id) {
                friends.push(p);
            }
        }

        resolve(friends);

    });
}

/**
 * Gets a PFP of a player with given player id
 * @param {string} playerId - Player ID
 * @returns {Promise<string>} URL of PFP or default PFP
 */
async function getPlayerPfp(playerId) {
    try {
        // Wait for leaderboard data to be ready before doing anything
        waitForDataReady(() => {
            if (leaderboardData[playerId]?.profilePicture) {
                return leaderboardData[playerId].profilePicture;
            }
        });

        if (profileSettingsData !== null) {
            return profileSettingsData[playerId]?.pfp || 'media/default_avatar.png';
        }

        if (!profileSettingsPromise) {
            profileSettingsPromise = getProfileSettings();
        }

        await profileSettingsPromise;

        return profileSettingsData[playerId]?.pfp || 'media/default_avatar.png';

    } catch {
        return 'media/default_avatar.png';
    }
}

/**
 * Gets a name or custom name of a player
 * @param {string} playerId - Player ID
 * @returns {Promise<string>} Name or Custom name
 */
async function getPlayerName(playerId) {
    try {
        // Wait for leaderboard data to be ready before doing anything
        waitForDataReady(() => {
            // Get custom name
            if (!profileSettingsPromise) {
                profileSettingsPromise = getProfileSettings();
            }

            if (profileSettingsData !== null) {
                return profileSettingsData[playerId].name || leaderboardData[playerId].name;
            }
        });

        await profileSettingsPromise;

        return profileSettingsData[playerId]?.name || leaderboardData[playerId].name;
    } catch {
        return leaderboardData[playerId]?.name;
    }
}

async function renderFriendList(player) {
    const container = document.getElementById('friends-container');

    try {
        const friends = await checkFriends(player);

        if (friends.length === 0) {
            container.innerHTML = '<div class="no-friends">No friends found :(</div>';
            return;
        }

        // First load all pfps
        const friendsWithPfp = await Promise.all(friends.map(async friend => {
            const pfp = await getPlayerPfp(friend.id).catch(() => null);
            return {
                ...friend,
                displayPfp: pfp || friend.profilePicture
            };
        }));

        // Then render friendlist
        const html = friendsWithPfp.map(friend => {
            const playerStatus = window.heartbeatMonitor.getPlayerStatus(friend.id);
            const lastOnlineTime = heartbeatMonitor.isOnline(friend.id)
                ? '<span class="player-status-lb-online">Online</span>'
                : window.heartbeatMonitor.getLastOnlineTime(playerStatus.lastUpdate || friend.lastPlayed);

            const lastGame = heartbeatMonitor.isOnline(friend.id)
                ? `<span style="min-width: 0;" class="player-status-lb ${playerStatus.statusClass}">${playerStatus.statusText} <div id="blink"></div></span>`
                : `<span class="last-online-time">${lastOnlineTime}</span>`;

            return `
                <div class="friend-item" data-player-id="${friend.id || '0'}">
                    <img src="${friend.displayPfp}" class="friend-avatar" onerror="this.src='media/default_avatar.png';">
                    <div class="friend-name">${friend.name}</div>
                    <div class="friend-status">${lastGame}</div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    } catch (error) {
        container.innerHTML = '<div class="no-friends">There was an error loading friends</div>';
        console.error('Error loading friends:', error);
    } finally {
        // Add click handlers for player items so you can open them :D
        document.querySelectorAll('.friend-item').forEach(element => {
            element.addEventListener('click', () => {
                openProfile(element.dataset.playerId);
            });
        });
    }
}