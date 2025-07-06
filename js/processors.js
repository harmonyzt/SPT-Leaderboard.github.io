//     _____ ____  ______   __    _________    ____  __________  ____  ____  ___    ____  ____ 
//    / ___// __ \/_  __/  / /   / ____/   |  / __ \/ ____/ __ \/ __ )/ __ \/   |  / __ \/ __ \
//    \__ \/ /_/ / / /    / /   / __/ / /| | / / / / __/ / /_/ / __  / / / / /| | / /_/ / / / /  
//   ___/ / ____/ / /    / /___/ /___/ ___ |/ /_/ / /___/ _, _/ /_/ / /_/ / ___ |/ _, _/ /_/ / 
//  /____/_/     /_/    /_____/_____/_/  |_/_____/_____/_/ |_/_____/\____/_/  |_/_/ |_/_____/  

/**
 * Detects all available seasons by calling checkSeasonExists(seasonNumber) until 404 is received
 * @returns {Promise<void>}
 */
async function loadAndStoreSeasons() {
    // Seasons start from 1
    // Clean up before initialize
    let seasonNumber = 1;
    seasons = [];

    while (true) {
        const exists = await checkSeasonExists(seasonNumber);
        if (!exists) break;

        seasons.push(seasonNumber);
        seasonNumber++;
    }

    // Load previous winners and run it only once
    if (seasons.length > 1 && !ranOnlyOnce) {
        ranOnlyOnce = true;
        loadPreviousSeasonWinners();
    }

    // Sort from newest to oldest
    seasons.sort((a, b) => b - a);

    populateSeasonDropdown();

    // Load data if we found any seasons
    if (seasons.length > 0) {
        await Promise.all([
            loadAllSeasonsData(),
            loadSeasonData(seasons[0])
        ]);
        saveCurrentStats();
    }
}

/**
 * Loads and processes data for specified season called by other functions
 * @param {number} season - Season number to load
 * @returns {Promise<void>}
 */
async function loadSeasonData(season) {
    const emptyLeaderboardNotification = document.getElementById('emptyLeaderboardNotification');
    emptyLeaderboardNotification.style.display = 'none';
    isDataReady = false;

    try {
        const response = await fetch(`${seasonPath}${season}${seasonPathEnd}`);

        if (!response.ok) {
            throw new Error('Failed to load season data');
        }

        const data = await response.json();

        leaderboardData = data.leaderboard || [];

        // Leaderboard data is empty. Clean and do nothing
        if (leaderboardData.length === 0 || (leaderboardData.length === 1 && Object.keys(leaderboardData[0]).length === 0)) {
            emptyLeaderboardNotification.style.display = 'block';
            resetStats();
        } else {
            processSeasonData(leaderboardData);
            displayLeaderboard(leaderboardData);
        }
    } finally {
        checkRecentPlayers(leaderboardData);
        initProfileWatchList(leaderboardData);
    }
}