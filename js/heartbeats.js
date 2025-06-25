//     _____ ____  ______   __    _________    ____  __________  ____  ____  ___    ____  ____ 
//    / ___// __ \/_  __/  / /   / ____/   |  / __ \/ ____/ __ \/ __ )/ __ \/   |  / __ \/ __ \
//    \__ \/ /_/ / / /    / /   / __/ / /| | / / / / __/ / /_/ / __  / / / / /| | / /_/ / / / /  
//   ___/ / ____/ / /    / /___/ /___/ ___ |/ /_/ / /___/ _, _/ /_/ / /_/ / ___ |/ _, _/ /_/ / 
//  /____/_/     /_/    /_____/_____/_/  |_/_____/_____/_/ |_/_____/\____/_/  |_/_/ |_/_____/  

class HeartbeatMonitor {
    constructor() {
        this.heartbeatData = {};
        this.lastUpdateTime = 0;
        this.onlineThreshold = 1200;
    }

    async fetchHeartbeats() {
        try {
            const response = await fetch(`${heartbeatsPath}`);
            if (!response.ok) throw new Error('Failed to load heartbeats');

            this.heartbeatData = await response.json();
            this.lastUpdateTime = Date.now();
            return true;
        } catch (error) {
            console.error('Error loading heartbeats:', error);
            return false;
        }
    }

    getOnlineCount() {
        const currentTime = Date.now() / 1000;
        let onlineCount = 0;

        for (const id in this.heartbeatData) {
            const heartbeat = this.heartbeatData[id];
            const timeDiff = currentTime - heartbeat.timestamp;

            if (timeDiff <= this.onlineThreshold) {
                onlineCount++;
            }
        }

        return onlineCount;
    }

    isOnline(id) {
        const heartbeat = this.heartbeatData[id];
        if (!heartbeat) return false;

        const currentTime = Date.now() / 1000;
        const timeDiff = currentTime - heartbeat.timestamp;

        // onlineThreshold check
        return timeDiff <= this.onlineThreshold;
    }

    getPlayerStatus(playerId) {
        const heartbeat = this.heartbeatData[playerId];

        if (heartbeat) {
            const isRecentlyInRaid = (heartbeat.type === 'in_raid' && (Date.now() / 1000 - heartbeat.timestamp) < 3000);

            return {
                isOnline: true,
                status: heartbeat.type,
                statusClass: this._getStatusClass(heartbeat.type),
                statusText: this._getStatusText(heartbeat.type),
                isRecentlyInRaid: isRecentlyInRaid,
                lastUpdate: heartbeat.timestamp
            };
        }

        return {
            isOnline: false,
            status: 'offline',
            statusClass: 'player-status-lb-offline',
            statusText: 'Offline',
            lastUpdate: null
        };
    }

    getLastOnlineTime(timestamp) {
        if (!timestamp) return "Never online";

        const now = Date.now() / 1000;
        const diff = now - timestamp;

        if (diff < 60) return "Just now";
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
        return `${Math.floor(diff / 2592000)}m ago`;
    }

    _getStatusClass(statusType) {
        const classes = {
            'online': 'player-status-lb-online',
            'in_menu': 'player-status-lb-menu',
            'raid_start': 'player-status-lb-raid',
            'in_stash': 'player-status-lb-stash',
            'raid_end': 'player-status-lb-finished'
        };
        return classes[statusType] || 'player-status-lb-offline';
    }

    _getStatusText(statusType) {
        const texts = {
            'online': 'Online',
            'in_menu': 'In Menu',
            'raid_start': 'In Raid',
            'in_stash': 'In Stash',
            'raid_end': 'Finished Raid'
        };
        return texts[statusType] || 'Offline';
    }
}

// Make this app global where included
window.heartbeatMonitor = new HeartbeatMonitor();

setInterval(() => {
    heartbeatMonitor.fetchHeartbeats();
}, 5000);

// Load this bad boy
heartbeatMonitor.fetchHeartbeats();