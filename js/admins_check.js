//     _____ ____  ______   __    _________    ____  __________  ____  ____  ___    ____  ____ 
//    / ___// __ \/_  __/  / /   / ____/   |  / __ \/ ____/ __ \/ __ )/ __ \/   |  / __ \/ __ \
//    \__ \/ /_/ / / /    / /   / __/ / /| | / / / / __/ / /_/ / __  / / / / /| | / /_/ / / / /  
//   ___/ / ____/ / /    / /___/ /___/ ___ |/ /_/ / /___/ _, _/ /_/ / /_/ / ___ |/ _, _/ /_/ / 
//  /____/_/     /_/    /_____/_____/_/  |_/_____/_____/_/ |_/_____/\____/_/  |_/_/ |_/_____/  

async function updateAdminsStatus() {
    const container = document.getElementById('admins-container');

    try {
        // Show loading state
        container.innerHTML = `
            <h3><i class="bx bx-shield-alt"></i> Staff Online</h3>
            <div class="loading-spinner"></div>
        `;

        const response = await fetch('https://visuals.nullcore.net/SPT/admins_online.json');
        const users = await response.json();

        // Clear container
        container.innerHTML = '<h3><i class="bx bx-shield-alt"></i> Staff Online</h3>';

        // Separate admins and moderators
        const admins = users.filter(u => u.username === 'harmony');
        const moderators = users.filter(u => u.username !== 'harmony');

        // Display admins
        if (admins.length > 0) {
            admins.forEach(user => {
                const isOnline = user.online || (Date.now() / 1000 - user.last_seen < 300);
                const element = document.createElement('div');
                element.className = `admin-status admin ${isOnline ? 'online' : 'offline'}`;
                element.innerHTML = `
                    <div class="user-info">
                        <span class="username">${user.username}</span>
                        <span class="role-badge">ADMIN</span>
                    </div>
                    <div class="status-info">
                        <span class="status-dot"></span>
                        <span>${isOnline ? 'Online' : formatLastSeen(user.last_seen)}</span>
                    </div>
                `;
                container.appendChild(element);
            });
        } else {
            const noAdmins = document.createElement('div');
            noAdmins.className = 'admin-status offline';
            noAdmins.innerHTML = '<span>No admins online</span>';
            container.appendChild(noAdmins);
        }

        // Display moderators if they exist
        if (moderators.length > 0) {
            const divider = document.createElement('div');
            divider.className = 'admin-divider';
            container.appendChild(divider);

            moderators.forEach(user => {
                const isOnline = user.online || (Date.now() / 1000 - user.last_seen < 300);
                const element = document.createElement('div');
                element.className = `admin-status moderator ${isOnline ? 'online' : 'offline'}`;
                element.innerHTML = `
                    <div class="user-info">
                        <span class="username">${user.username}</span>
                        <span class="role-badge">MOD</span>
                    </div>
                    <div class="status-info">
                        <span class="status-dot"></span>
                        <span>${isOnline ? 'Online' : formatLastSeen(user.last_seen)}</span>
                    </div>
                `;
                container.appendChild(element);
            });
        }

    } catch (error) {
        console.error('Error:', error);
        container.innerHTML = `
            <h3><i class="bx bx-shield-alt"></i> Staff Online</h3>
            <div class="error-message">Failed to load staff status</div>
        `;
    }
}

function formatLastSeen(timestamp) {
    if (!timestamp) return 'Long time ago';

    const seconds = Math.floor(Date.now() / 1000 - timestamp);
    if (seconds < 60) return 'Just now';

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

// Initial load
document.addEventListener('DOMContentLoaded', () => {
    updateAdminsStatus();
});

// Update every 60 seconds
setInterval(updateAdminsStatus, 60000);