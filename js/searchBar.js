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

    // Restoring search history
    const savedSearch = getCookie('playerSearch');
    if (savedSearch) {
        searchInput.value = savedSearch;
        setTimeout(searchPlayers, 100);
    }

    // Поиск с задержкой 300мс
    let searchTimeout;
    searchInput.addEventListener('input', function () {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            setCookie('playerSearch', this.value, 7);
            searchPlayers();
        }, 300);
    });

    // Очистка поиска
    clearButton.addEventListener('click', function () {
        searchInput.value = '';
        setCookie('playerSearch', '', -1);
        searchPlayers();
        searchInput.focus();
    });

});