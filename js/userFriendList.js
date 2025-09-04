//     _____ ____  ______   __    _________    ____  __________  ____  ____  ___    ____  ____ 
//    / ___// __ \/_  __/  / /   / ____/   |  / __ \/ ____/ __ \/ __ )/ __ \/   |  / __ \/ __ \
//    \__ \/ /_/ / / /    / /   / __/ / /| | / / / / __/ / /_/ / __  / / / / /| | / /_/ / / / /  
//   ___/ / ____/ / /    / /___/ /___/ ___ |/ /_/ / /___/ _, _/ /_/ / /_/ / ___ |/ _, _/ /_/ / 
//  /____/_/     /_/    /_____/_____/_/  |_/_____/_____/_/ |_/_____/\____/_/  |_/_/ |_/_____/  

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

async function renderFriendList(player) {
    const container = document.getElementById('friends-container');

    try {
        const friends = await checkFriends(player);

        // Hide friend list if no friends were found to have more space
        if (friends.length === 0) {
            const friendListSection = document.getElementById('friend-list');
            friendListSection.style.display = 'none';

            return;
        }

        // Then render friendlist
        const html = friends.map(friend => {
            const playerStatus = window.heartbeatMonitor.getPlayerStatus(friend.id);
            const lastOnlineTime = heartbeatMonitor.isOnline(friend.id)
                ? '<span class="player-status-lb-online">Online</span>'
                : window.heartbeatMonitor.getLastOnlineTime(playerStatus.lastUpdate || friend.lastPlayed);

            const lastGame = heartbeatMonitor.isOnline(friend.id)
                ? `<span style="min-width: 0;" class="player-status-lb ${playerStatus.statusClass}">${playerStatus.statusText} <div id="blink"></div></span>`
                : `<span class="last-online-time">${lastOnlineTime}</span>`;

            return `
                <div class="friend-item" data-player-id="${friend.id || '0'}">
                    <img src="${friend.profilePicture}" class="friend-avatar" onerror="this.src='media/default_avatar.png';">
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
                openProfile(element.dataset.playerId, true);
            });
        });
    }
}