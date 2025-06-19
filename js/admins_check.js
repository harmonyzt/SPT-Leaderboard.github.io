//     _____ ____  ______   __    _________    ____  __________  ____  ____  ___    ____  ____ 
//    / ___// __ \/_  __/  / /   / ____/   |  / __ \/ ____/ __ \/ __ )/ __ \/   |  / __ \/ __ \
//    \__ \/ /_/ / / /    / /   / __/ / /| | / / / / __/ / /_/ / __  / / / / /| | / /_/ / / / /  
//   ___/ / ____/ / /    / /___/ /___/ ___ |/ /_/ / /___/ _, _/ /_/ / /_/ / ___ |/ _, _/ /_/ / 
//  /____/_/     /_/    /_____/_____/_/  |_/_____/_____/_/ |_/_____/\____/_/  |_/_/ |_/_____/  

async function updateAdminsStatus() {
    try {
        const response = await fetch('https://visuals.nullcore.net/SPT/admins_online.json');
        const users = await response.json();
        
        const container = document.getElementById('admins-container');
        container.innerHTML = '<h3><i class="bx bx-shield-alt"></i> Team</h3>';
        
        const admins = users.filter(u => u.username === 'harmony');
        const moderators = users.filter(u => u.username !== 'harmony');
        
        // display
        admins.forEach(user => {
            const isOnline = user.online || (Date.now()/1000 - user.last_seen < 300);
            const element = document.createElement('div');
            element.className = `admin-status ${isOnline ? 'online' : 'offline'}`;
            element.innerHTML = `
                <span class="username">${user.username}</span>
                <span class="status">${isOnline ? 'Online' : formatLastSeen(user.last_seen)}</span>
            `;
            container.appendChild(element);
        });
        
        if (moderators.length > 0) {
            const divider = document.createElement('div');
            divider.className = 'admin-divider';
            container.appendChild(divider);
            
            moderators.forEach(user => {
                const isOnline = user.online || (Date.now()/1000 - user.last_seen < 300);
                const element = document.createElement('div');
                element.className = `admin-status ${isOnline ? 'online' : 'offline'}`;
                element.innerHTML = `
                    <span class="username">${user.username}</span>
                    <span class="status">${isOnline ? 'Online' : formatLastSeen(user.last_seen)}</span>
                `;
                container.appendChild(element);
            });
        }
        
    } catch (error) {
        console.error('Error:', error);
        container.innerHTML = '<div class="error">Error loading admins online</div>';
    }
}

function formatLastSeen(timestamp) {
    const minutes = Math.floor((Date.now()/1000 - timestamp) / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} h ago`;
    return new Date(timestamp * 1000).toLocaleString();
}

setInterval(updateAdminsStatus, 10000);
updateAdminsStatus();