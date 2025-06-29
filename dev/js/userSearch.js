//     _____ ____  ______   __    _________    ____  __________  ____  ____  ___    ____  ____ 
//    / ___// __ \/_  __/  / /   / ____/   |  / __ \/ ____/ __ \/ __ )/ __ \/   |  / __ \/ __ \
//    \__ \/ /_/ / / /    / /   / __/ / /| | / / / / __/ / /_/ / __  / / / / /| | / /_/ / / / /  
//   ___/ / ____/ / /    / /___/ /___/ ___ |/ /_/ / /___/ _, _/ /_/ / /_/ / ___ |/ _, _/ /_/ / 
//  /____/_/     /_/    /_____/_____/_/  |_/_____/_____/_/ |_/_____/\____/_/  |_/_/ |_/_____/  

const AppState = (() => {
    let autoUpdateEnabled = true;
    let searchActive = false;

    return {
        setAutoUpdate(enabled) {
            autoUpdateEnabled = enabled && !this.isSearchActive();
            if (typeof AutoUpdater !== 'undefined') {
                AutoUpdater.setEnabled(autoUpdateEnabled);
            }
        },

        setSearchActive(active) {
            searchActive = active;
            this.setAutoUpdate(!active);
        },

        isSearchActive() {
            return searchActive;
        },

        isAutoUpdateEnabled() {
            return autoUpdateEnabled;
        }
    };
})();

function setCookie(name, value, days) {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

function getCookie(name) {
    const cookie = document.cookie.split(';')
        .map(c => c.trim())
        .find(c => c.startsWith(`${name}=`));
    return cookie ? decodeURIComponent(cookie.split('=')[1]) : null;
}

function normalizeText(text) {
    return text.toLowerCase().trim().replace(/\s+/g, ' ').replace(/[^\w\s]/g, '');
}

function searchPlayers() {
    const searchTerm = normalizeText(document.getElementById('playerSearch').value);
    const rows = document.querySelectorAll('tbody tr');

    let foundAny = false;

    // Search is active
    AppState.setSearchActive(searchTerm !== '');

    rows.forEach(row => {
        const playerNameCell = row.querySelector('.player-name');
        if (!playerNameCell) return;

        const playerName = normalizeText(Array.from(playerNameCell.childNodes)
            .filter(node => node.nodeType === Node.TEXT_NODE)
            .map(node => node.textContent)
            .join(' '));

        const shouldShow = searchTerm === '' || playerName.includes(searchTerm);
        row.style.display = shouldShow ? '' : 'none';
        if (shouldShow) foundAny = true;
    });
}

document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('playerSearch');
    const clearButton = document.getElementById('clearSearch');

    // Restore search
    const savedSearch = getCookie('playerSearch');
    if (savedSearch) {
        searchInput.value = savedSearch;
        setTimeout(() => {
            searchPlayers();
        }, 100);
    }

    let searchTimeout;
    searchInput.addEventListener('input', function () {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            setCookie('playerSearch', this.value, 7);
            searchPlayers();
        }, 200);
    });

    clearButton.addEventListener('click', function () {
        searchInput.value = '';
        setCookie('playerSearch', '', -1);
        searchPlayers();
        searchInput.focus();
    });

    // Sync with AutoUpdater
    if (typeof AutoUpdater !== 'undefined') {
        AutoUpdater.init();
        AppState.setAutoUpdate(AutoUpdater.getStatus());
    }
});