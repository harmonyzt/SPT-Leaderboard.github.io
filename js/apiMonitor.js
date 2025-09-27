//     _____ ____  ______   __    _________    ____  __________  ____  ____  ___    ____  ____ 
//    / ___// __ \/_  __/  / /   / ____/   |  / __ \/ ____/ __ \/ __ )/ __ \/   |  / __ \/ __ \
//    \__ \/ /_/ / / /    / /   / __/ / /| | / / / / __/ / /_/ / __  / / / / /| | / /_/ / / / /  
//   ___/ / ____/ / /    / /___/ /___/ ___ |/ /_/ / /___/ _, _/ /_/ / /_/ / ___ |/ _, _/ /_/ / 
//  /____/_/     /_/    /_____/_____/_/  |_/_____/_____/_/ |_/_____/\____/_/  |_/_/ |_/_____/   

async function getServerStatus() {
    try {
        const response = await fetch(`/api/main/online.json?t=${Date.now()}`);
        if (!response.ok) throw new Error('API is not responding');

        return await response.json();
    } catch (error) {
        return {
            online: false,
            underWork: false,
            workText: "Couldn't connect with API"
        };
    }
}

async function updateServerStatus() {
    const status = await getServerStatus();
    const statusElement = document.getElementById('serverStatus');

    statusElement.className = 'live-data-label server-status';
    statusElement.removeAttribute('data-tooltip');

    if (status.outage) {
        statusElement.textContent = 'API Degradation';
        statusElement.classList.add('server-maintenance');
        if (status.workText) {
            statusElement.setAttribute('data-tooltip', status.workText);
        }
    } else if (status.underWork) {
        statusElement.textContent = 'API is Updating';
        statusElement.classList.add('server-maintenance');
        if (status.workText) {
            statusElement.setAttribute('data-tooltip', status.workText);
        }
    } else if (status.online) {
        statusElement.textContent = 'API is Online';
        statusElement.classList.add('server-online');
    } else {
        statusElement.textContent = 'API is Unreachable';
        statusElement.classList.add('server-offline');
        if (status.workText) {
            statusElement.setAttribute('data-tooltip', status.workText);
        }
    }

    if (seasonPath === "fallbacks/season") {
        statusElement.textContent = 'Using Fallback instead API';
        statusElement.setAttribute('data-tooltip', "Using fallback instead of connecting to the API. Try refreshing the page")
        statusElement.classList.add('server-maintenance');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    updateServerStatus();
    setInterval(updateServerStatus, 30000);

    const statusElement = document.getElementById('serverStatus');
    statusElement.addEventListener('mouseenter', showTooltip);
    statusElement.addEventListener('mouseleave', hideTooltip);
});

function showTooltip(e) {
    if (!this.hasAttribute('data-tooltip')) return;

    const tooltip = document.createElement('div');
    tooltip.className = 'server-tooltip';
    tooltip.textContent = this.getAttribute('data-tooltip');

    document.body.appendChild(tooltip);

    const rect = this.getBoundingClientRect();
    tooltip.style.left = `${rect.left + rect.width / 2 - tooltip.offsetWidth / 2}px`;
    tooltip.style.top = `${rect.bottom + 5}px`;
}

function hideTooltip() {
    const tooltip = document.querySelector('.server-tooltip');
    if (tooltip) tooltip.remove();
}