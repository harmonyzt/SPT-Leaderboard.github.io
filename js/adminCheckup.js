//     _____ ____  ______   __    _________    ____  __________  ____  ____  ___    ____  ____ 
//    / ___// __ \/_  __/  / /   / ____/   |  / __ \/ ____/ __ \/ __ )/ __ \/   |  / __ \/ __ \
//    \__ \/ /_/ / / /    / /   / __/ / /| | / / / / __/ / /_/ / __  / / / / /| | / /_/ / / / /  
//   ___/ / ____/ / /    / /___/ /___/ ___ |/ /_/ / /___/ _, _/ /_/ / /_/ / ___ |/ _, _/ /_/ / 
//  /____/_/     /_/    /_____/_____/_/  |_/_____/_____/_/ |_/_____/\____/_/  |_/_/ |_/_____/  

async function updateAdminsStatus() {
    const container = document.getElementById('admins-container');
    const contentWrapper = container.querySelector('.content-wrapper');
    const loadingOverlay = container.querySelector('.loading-overlay');

    // Show loading overlay with smooth transition
    loadingOverlay.classList.add('active');

    try {
        const response = await fetch(`/api/admins_online.json?t=${Date.now()}`);
        const usersObject = await response.json();
        const users = Object.values(usersObject);

        if (!users || users.length === 0) {
            throw new Error('No users data');
        }

        // Build HTML always clean
        let html = '<h3><i class="bx bx-shield-alt"></i> Staff</h3>';

        // Separate admins and moderators
        const adminUsernames = ['harmony', 'LeKita', 'Kat','YukkiPookie'];
        const admins = users.filter(u => adminUsernames.includes(u.username));
        const moderators = users.filter(u => !adminUsernames.includes(u.username));

        // Display admins
        if (admins.length > 0) {
            admins.forEach(user => {
                if (!user.username)
                    return;

                const isOnline = (Date.now() / 1000 - user.last_seen < 600);
                html += `
                    <div class="admin-status admin ${isOnline ? 'online' : 'offline'}">
                        <div class="user-info">
                            <span class="username">${user.username}</span>
                            <span class="role-badge">ADMIN</span>
                        </div>
                        <div class="status-info">
                            <span class="status-dot"></span>
                            <span>${isOnline ? 'Online' : formatLastSeen(user.last_seen)}</span>
                        </div>
                    </div>
                `;
            });
        } else {
            html += '<div class="admin-status offline"><span>No admins online</span></div>';
        }

        // Display moderators if they exist
        if (moderators.length > 0) {
            html += '<div class="admin-divider"></div>';

            moderators.forEach(user => {
                const isOnline = user.online || (Date.now() / 1000 - user.last_seen < 300);
                html += `
                    <div class="admin-status moderator ${isOnline ? 'online' : 'offline'}">
                        <div class="user-info">
                            <span class="username">${user.username}</span>
                            <span class="role-badge">MOD</span>
                        </div>
                        <div class="status-info">
                            <span class="status-dot"></span>
                            <span>${isOnline ? 'Online' : formatLastSeen(user.last_seen)}</span>
                        </div>
                    </div>
                `;
            });
        }

        // Update content
        contentWrapper.innerHTML = html;

    } catch (error) {
        contentWrapper.innerHTML = `
            <h3><i class="bx bx-shield-alt"></i> Staff Online</h3>
            <div class="error-message">Failed to load staff status</div>
        `;
    } finally {
        // Hide loading overlay
        setTimeout(() => {
            loadingOverlay.classList.remove('active');
        }, 300);
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
document.addEventListener('DOMContentLoaded', updateAdminsStatus);

// Update every 60 seconds
setInterval(updateAdminsStatus, 60000);