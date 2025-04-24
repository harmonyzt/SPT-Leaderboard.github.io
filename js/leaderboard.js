// When data loaded
document.addEventListener('DOMContentLoaded', detectSeasons);

let leaderboardData = []; // For keeping data
let allSeasonsData = []; // For keeping last season data
let allSeasonsDataReady = []; // For keeping ALL players data
let sortDirection = {}; // Sort direction
let seasons = []; // Storing seasons

//  https://visuals.nullcore.net/hidden/season
let seasonPath = "/season/season"
let seasonPathEnd = ".json"

async function checkSeasonExists(seasonNumber) {
    try {
        const response = await fetch(`${seasonPath}${seasonNumber}${seasonPathEnd}`);
        return response.ok;
    } catch (error) {
        return false;
    }
}

// Detect available seasons
async function detectSeasons() {
    let seasonNumber = 1;
    seasons = [];

    // FIXME
    // Throws 404 because it tries to access not existing next season file
    while (await checkSeasonExists(seasonNumber)) {
        seasons.push(seasonNumber);
        seasonNumber++;
    }

    seasons.sort((a, b) => b - a);

    populateSeasonDropdown();

    // Determine previous winners if we have latest leaderboard
    if (seasons.length > 1) {
        loadPreviousSeasonWinners();
    }

    // Load the latest season data
    loadLeaderboardData(seasons[0]);
}

async function populateSeasonDropdown() {
    const seasonSelect = document.getElementById('seasonSelect');
    seasonSelect.innerHTML = '';

    // Casual seasons
    seasons.forEach(season => {
        const option = document.createElement('option');
        option.value = season;
        option.textContent = `Season ${season}`;
        seasonSelect.appendChild(option);
    });

    // All seasons
    const allSeasonsOption = document.createElement('option');
    allSeasonsOption.value = 'all';
    allSeasonsOption.textContent = 'Global Leaderboard';
    seasonSelect.appendChild(allSeasonsOption);

    seasonSelect.addEventListener('change', (event) => {
        const selectedValue = event.target.value;

        if (selectedValue === 'all') {
            loadAllSeasonsData();
        } else {
            loadLeaderboardData(selectedValue);
        }
    });
}

// Called upon Global Leaderboard selection in drop-down menu populateSeasonDropdown()
async function loadAllSeasonsData() {
    const loadingNotification = document.getElementById('loadingNotification');
    const emptyLeaderboardNotification = document.getElementById('emptyLeaderboardNotification');

    console.log('[DEBUG] Starting to load all seasons data...');
    emptyLeaderboardNotification.style.display = 'none';
    loadingNotification.style.display = 'block';

    try {
        const uniquePlayers = {};

        // Loop through all seasons data
        console.log(`[DEBUG] Processing ${seasons.length} seasons...`);
        for (const season of seasons) {
            console.log(`[DEBUG] Processing season: ${season}`);
            const response = await fetch(`${seasonPath}${season}${seasonPathEnd}`);
            if (!response.ok) {
                console.warn(`[DEBUG] Failed to fetch data for season ${season}, skipping...`);
                continue;
            }

            const data = await response.json();
            console.log(`[DEBUG] Season ${season} loaded, players: ${data.leaderboard?.length || 0}`);

            if (data.leaderboard && data.leaderboard.length > 0) {
                data.leaderboard.forEach((player, index) => {
                    // Use player's ID as the key instead of name
                    const playerKey = player.id || player.name; // fallback to name if id doesn't exist
                    console.log(`[DEBUG] Processing player ${index + 1}/${data.leaderboard.length}: ${playerKey}`);

                    if (!uniquePlayers[playerKey]) {
                        console.log(`[DEBUG] New player detected: ${playerKey}, season: ${season}`);
                        // New player - hasn't played in previous seasons
                        uniquePlayers[playerKey] = {
                            ...player,
                            seasonsPlayed: [season],
                            seasonsCount: 1
                        };
                    } else {
                        console.log(`[DEBUG] Existing player: ${playerKey}`);
                        // Existing player - update if this season is more recent
                        if (compareLastPlayed(player.lastPlayed, uniquePlayers[playerKey].lastPlayed) > 0) {
                            console.log(`[DEBUG] Updating player data with more recent season: ${season}`);
                            // Update player data but keep seasons info
                            const { seasonsPlayed, seasonsCount, ...rest } = uniquePlayers[playerKey];
                            uniquePlayers[playerKey] = {
                                ...player,
                                seasonsPlayed: seasonsPlayed.includes(season) ? seasonsPlayed : [...seasonsPlayed, season],
                                seasonsCount: seasonsPlayed.includes(season) ? seasonsCount : seasonsCount + 1
                            };
                        } else if (!uniquePlayers[playerKey].seasonsPlayed.includes(season)) {
                            console.log(`[DEBUG] Adding new season ${season} to existing player`);
                            // Season not in list yet - add it
                            uniquePlayers[playerKey].seasonsPlayed.push(season);
                            uniquePlayers[playerKey].seasonsCount += 1;
                        } else {
                            console.log(`[DEBUG] Season ${season} already recorded for this player`);
                        }
                    }

                    console.log(`[DEBUG] Current state for ${playerKey}:`, {
                        seasons: uniquePlayers[playerKey].seasonsPlayed,
                        count: uniquePlayers[playerKey].seasonsCount,
                        lastPlayed: uniquePlayers[playerKey].lastPlayed
                    });
                });
            }
        }

        // Convert to array
        allSeasonsCombinedData = Object.values(uniquePlayers);
        console.log('[DEBUG] Final player data:', allSeasonsCombinedData);

        if (allSeasonsCombinedData.length === 0) {
            console.warn('[DEBUG] No player data found after processing all seasons');
            emptyLeaderboardNotification.style.display = 'block';
        } else {
            console.log(`[DEBUG] Processed ${allSeasonsCombinedData.length} unique players`);
            addColorIndicators(allSeasonsCombinedData);
            calculateRanks(allSeasonsCombinedData);
            calculateOverallStats(allSeasonsCombinedData);
        }

        displayLeaderboard(allSeasonsCombinedData);
        addSortListeners();
    } catch (error) {
        console.error('[DEBUG] Error loading all seasons data:', error);
    } finally {
        console.log('[DEBUG] Finished loading all seasons data');
        loadingNotification.style.display = 'none';
    }
}
// Unix
function compareLastPlayed(dateStr1, dateStr2) {
    const parseDate = (dateStr) => {
        if (/^\d+$/.test(dateStr)) {
            return new Date(parseInt(dateStr) * 1000);
        }

        // if "dd.mm.yyyy"
        if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(dateStr)) {
            const [d, m, y] = dateStr.split('.').map(Number);
            return new Date(y, m - 1, d);
        }

        return null;
    };

    const date1 = parseDate(dateStr1);
    const date2 = parseDate(dateStr2);

    if (!date1 || !date2) {
        return "Unknown";
    }

    return date1 - date2;
}

// Called upon season detection or change by detectSeasons() + populateSeasonDropdown()
async function loadLeaderboardData(season) {
    const loadingNotification = document.getElementById('loadingNotification');
    const emptyLeaderboardNotification = document.getElementById('emptyLeaderboardNotification');

    emptyLeaderboardNotification.style.display = 'none';
    loadingNotification.style.display = 'block';

    try {
        const response = await fetch(`${seasonPath}${season}${seasonPathEnd}`);

        if (!response.ok) {
            throw new Error('Failed to load leaderboard data');
        }

        const data = await response.json();
        leaderboardData = data.leaderboard || [];

        // Show the notification if the leaderboard is empty. Displaying numbers is hacky so force to calculate nothing lmao
        // 4/4/2025 - by the way, it gets fucked when there are no players in file.. Too bad.
        if (leaderboardData.length === 0 || (leaderboardData.length === 1 && Object.keys(leaderboardData[0]).length === 0)) {
            emptyLeaderboardNotification.style.display = 'block';
            animateNumber('totalDeaths', 0);
            //animateNumber('totalDeathsFromTP', 0);
            animateNumber('totalRaids', 0);
            animateNumber('totalKills', 0);
            animateNumber('totalDamage', 0);
            animateNumber('averageKDR', 0, 2);
            animateNumber('averageSurvival', 0, 2);
            displayLeaderboard(leaderboardData);
            return;
        } else {
            // Proceed with normal leaderboard display logic
            addColorIndicators(leaderboardData);
            calculateRanks(leaderboardData);
            calculateOverallStats(leaderboardData);
            displayLeaderboard(leaderboardData);
            addSortListeners();
        }
    } catch (error) {
        console.error('Error loading leaderboard data:', error);
    } finally {
        loadingNotification.style.display = 'none';
    }
}

async function displayLeaderboard(data) {
    const tableBody = document.querySelector('#leaderboardTable tbody');
    tableBody.innerHTML = '';

    data.forEach(player => {
        const row = document.createElement('tr');

        let rankClass = '';
        let nameClass = '';
        if (player.rank === 1) {
            rankClass = 'gold';
            nameClass = 'gold-name';
        } else if (player.rank === 2) {
            rankClass = 'silver';
            nameClass = 'silver-name';
        } else if (player.rank === 3) {
            rankClass = 'bronze';
            nameClass = 'bronze-name';
        }

        // Format the date from user profile (Last Raid row in Unix now)
        function formatLastPlayed(unixTimestamp) {
            if (typeof unixTimestamp !== 'number' || unixTimestamp <= 0) {
                return 'Unknown';
            }

            const date = new Date(unixTimestamp * 1000);
            const now = new Date();
            const diffInSeconds = Math.floor((now - date) / 1000);
            const diffInMinutes = Math.floor(diffInSeconds / 60)

            if (diffInMinutes < 60) {
                return 'In raid <div id="blink"></div>';
            }

            const diffInHours = Math.floor(diffInMinutes / 60);
            if (diffInHours < 24) {
                return `${diffInHours}h ago`;
            }

            const diffInDays = Math.floor(diffInHours / 24);
            if (diffInDays === 1) {
                return '1d ago';
            }
            if (diffInDays < 30) {
                return `${diffInDays}d ago`;
            }

            const diffInMonths = Math.floor(diffInDays / 30);
            const remainingDays = diffInDays % 30;
            if (diffInMonths < 12) {
                return `${diffInMonths}mo${remainingDays > 0 ? ` ${remainingDays}d` : ''} ago`;
            }

            const diffInYears = Math.floor(diffInMonths / 12);
            const remainingMonths = diffInMonths % 12;
            return `${diffInYears}y${remainingMonths > 0 ? ` ${remainingMonths}mo` : ''} ago`;
        }

        // Turning last game into 'x days/weeks ago'
        let lastGame = formatLastPlayed(player.lastPlayed)

        if (lastGame === "In raid") {
            player.isOnline = true;
        } else {
            player.isOnline = false;
        }

        // EFT Account icons and colors handling
        let accountIcon = '';
        let accountColor = '';
        if (player.disqualified === "false") {
            switch (player.accountType) {
                case 'edge_of_darkness':
                    accountIcon = '<img src="media/EOD.png" alt="EOD" class="account-icon">';
                    accountColor = '#be8301';
                    break;
                case 'unheard_edition':
                    accountIcon = '<img src="media/Unheard.png" alt="Unheard" class="account-icon">';
                    accountColor = '#54d0e7';
                    break;
            }
        } else {
            accountIcon = '';
            accountColor = '#787878';
        }

        // If using Twitch Players
        //let TPicon = '';
        //if (player.isUsingTwitchPlayers) {
        //    TPicon = '✅';
        //} else {
        //    TPicon = '❌';
        //}

        //let fikaIcon = '';
        //if (player.fika === "true") {
        //    fikaIcon = '✅';
        //} else {
        //    fikaIcon = '❌';
        //}

        // Prestige
        const prestigeImg = player.prestige === 1 || player.prestige === 2
            ? `<img src="media/prestige${player.prestige}.png" style="width: 30px; height: 30px" class="prestige-icon" alt="Prestige ${player.prestige}">`
            : '';

        // Get skill
        const rankLabel = getRankLabel(player.totalScore);

        row.innerHTML = `
            <td class="rank ${rankClass}">${player.rank} ${player.medal}</td>
            <td class="player-name ${nameClass}" style="color: ${accountColor}" data-player-id="${player.id || '0'}"> ${accountIcon} ${player.name} ${prestigeImg}</td>
            <td>${lastGame || 'N/A'}</td>
            <td>${player.pmcLevel}</td>
            <td>${player.totalRaids}</td>
            <td class="${player.survivedToDiedRatioClass}">${player.survivedToDiedRatio}%</td>
            <td class="${player.killToDeathRatioClass}">${player.killToDeathRatio}</td>
            <td class="${player.averageLifeTimeClass}">${player.averageLifeTime}</td>
            <td>${player.totalScore <= 0 ? 'Calibrating...' : player.totalScore.toFixed(2)} ${player.totalScore <= 0 ? '' : `(${rankLabel})`}</td>
            <td>${player.sptVer}</td>
        `;

        tableBody.appendChild(row);
    });

    // Clickity for names in leaderboard (profiles)
    document.querySelectorAll('.player-name').forEach(element => {
        element.addEventListener('click', () => {
            openProfile(element.dataset.playerId);
        });
    });

    return { status: 'success', data: leaderboardData };
}

function addSortListeners() {
    const headers = document.querySelectorAll('#leaderboardTable th[data-sort]');
    headers.forEach(header => {
        header.addEventListener('click', () => {
            const sortKey = header.getAttribute('data-sort');
            sortLeaderboard(sortKey);
        });
    });
}

function sortLeaderboard(sortKey) {
    if (!sortDirection[sortKey]) {
        sortDirection[sortKey] = 'asc';
    } else {
        sortDirection[sortKey] = sortDirection[sortKey] === 'asc' ? 'desc' : 'asc';
    }

    leaderboardData.sort((a, b) => {
        let valueA = a[sortKey];
        let valueB = b[sortKey];

        if (sortKey === 'rank') {
            valueA = a.rank;
            valueB = b.rank;
        }

        if (sortKey === 'pmcLevel' || sortKey === 'totalRaids' || sortKey === 'survivedToDiedRatio' || sortKey === 'killToDeathRatio' || sortKey === 'totalScore') {
            valueA = parseFloat(valueA);
            valueB = parseFloat(valueB);
        }

        if (sortKey === 'averageLifeTime') {
            valueA = convertTimeToSeconds(valueA);
            valueB = convertTimeToSeconds(valueB);
        }

        if (valueA < valueB) {
            return sortDirection[sortKey] === 'asc' ? -1 : 1;
        }
        if (valueA > valueB) {
            return sortDirection[sortKey] === 'asc' ? 1 : -1;
        }
        return 0;
    });

    displayLeaderboard(leaderboardData);
}

function convertTimeToSeconds(time) {
    const [minutes, seconds] = time.split(':').map(Number);
    return minutes * 60 + seconds;
}

function addColorIndicators(data) {
    data.forEach(player => {
        // Survived/Died Ratio
        if (player.survivedToDiedRatio < 30) { // Less than 30%
            player.survivedToDiedRatioClass = 'bad';
        } else if (player.survivedToDiedRatio >= 30 && player.survivedToDiedRatio < 55) { // 30% - 54%
            player.survivedToDiedRatioClass = 'average';
        } else if (player.survivedToDiedRatio >= 55 && player.survivedToDiedRatio < 65) { // 55% - 64%
            player.survivedToDiedRatioClass = 'good';
        } else { // 65% and above
            player.survivedToDiedRatioClass = 'impressive';
        }

        // Kill/Death Ratio
        if (player.killToDeathRatio < 5) { // Less than 5
            player.killToDeathRatioClass = 'bad';
        } else if (player.killToDeathRatio >= 5 && player.killToDeathRatio < 12) { // 5 - 7.99
            player.killToDeathRatioClass = 'average';
        } else if (player.killToDeathRatio >= 12 && player.killToDeathRatio < 15) { // 8 - 14.99
            player.killToDeathRatioClass = 'good';
        } else { // 15 and above
            player.killToDeathRatioClass = 'impressive';
        }

        // Average Life Time
        const lifeTimeSeconds = convertTimeToSeconds(player.averageLifeTime);
        if (lifeTimeSeconds < 300) { // Less than 5 minutes
            player.averageLifeTimeClass = 'bad';
        } else if (lifeTimeSeconds >= 300 && lifeTimeSeconds < 900) { // 5 - 14.99 minutes
            player.averageLifeTimeClass = 'average';
        } else if (lifeTimeSeconds >= 900 && lifeTimeSeconds < 1200) { // 15 - 19.99 minutes
            player.averageLifeTimeClass = 'good';
        } else { // 20 minutes and above
            player.averageLifeTimeClass = 'impressive';
        }
    });
}

// Ranking calculation (needed comments for this one)
function calculateRanks(data) {
    data.forEach(player => {
        const kdrScore = player.killToDeathRatio * 0.1; // 20% weight
        const sdrScore = player.survivedToDiedRatio * 0.2; // 20% weight
        const raidsScore = player.totalRaids * 0.5; // 50% weight
        const pmcLevelScore = player.pmcLevel * 0.1; // 10% weight

        const MIN_RAIDS = 50;
        const SOFT_CAP_RAIDS = 100;

        // Total score
        player.totalScore = kdrScore + sdrScore + Math.log(raidsScore) + pmcLevelScore;

        // Tune the player skill score down if he has less than 50 raids
        if (player.totalRaids <= MIN_RAIDS) {
            player.totalScore *= 0.3;  // Setting rating lower by 70%
        } else if (player.totalRaids < SOFT_CAP_RAIDS) {
            const progress = (player.totalRaids - MIN_RAIDS) / (SOFT_CAP_RAIDS - MIN_RAIDS);
            player.totalScore *= 0.3 + (0.7 * progress);
        }

        // Disquilify Player
        if (player.disqualified === "true") {
            player.totalScore = 0;
            player.damage = 0;
            player.killToDeathRatio = 0;
            player.survivedToDiedRatio = 0;
            player.publicProfile = "false";
        }

        // If player is not using Twitch Players (with intent that it's gonna be easier) tune down his total score
        //if (!player.isUsingTwitchPlayers) {
        //    player.totalScore -= 5;
        //}

        // If player is using Fika (with intent that it's gonna be easier) tune down his total score
        //if (player.fika) {
        //    player.totalScore -= 5;
        //}

    });

    // Sorting by skill score
    data.sort((a, b) => b.totalScore - a.totalScore);

    // Ranks and medals :D
    data.forEach((player, index) => {
        player.rank = index + 1;
        if (player.rank === 1) {
            player.medal = '🥇';
        } else if (player.rank === 2) {
            player.medal = '🥈';
        } else if (player.rank === 3) {
            player.medal = '🥉';
        } else {
            player.medal = '';
        }
    });
}

function getRankLabel(totalScore) {
    if (totalScore < 5) return 'L-';
    if (totalScore < 10) return 'L';
    if (totalScore < 17) return 'L+';
    if (totalScore < 18) return 'M-';
    if (totalScore < 19) return 'M';
    if (totalScore < 20) return 'M+';
    if (totalScore < 21) return 'H-';
    if (totalScore < 23) return 'H';
    if (totalScore < 24) return 'H+';
    if (totalScore < 25) return 'P-';
    if (totalScore < 27) return 'P';
    if (totalScore < 32) return 'P+';
    return 'G';
}

// Overall stats calc
function calculateOverallStats(data) {
    let totalDeaths = 0;
    let totalRaids = 0;
    let totalKills = 0;
    let totalKDR = 0;
    let totalSurvival = 0;
    let totalDamage = 0;

    //let totalDeathsFromTwitchPlayers = 0;

    data.forEach(player => {
        //if (player.isUsingTwitchPlayers) {
        //    totalDeaths += Math.round(player.totalRaids * (100 - player.survivedToDiedRatio) / 100);
        //    totalDeathsFromTwitchPlayers += Math.round(player.totalRaids * (100 - player.survivedToDiedRatio) / 100);
        //} else {
        if (player.disqualified == "false") {
            totalDeaths += Math.round(player.totalRaids * (100 - player.survivedToDiedRatio) / 100);
            totalRaids += parseInt(player.totalRaids);
            totalKills += parseFloat(player.killToDeathRatio) * Math.round(player.totalRaids * (100 - player.survivedToDiedRatio) / 100);
            totalKDR += parseFloat(player.killToDeathRatio);
            totalSurvival += parseFloat(player.survivedToDiedRatio);

            if (player.publicProfile === "true") {
                totalDamage += player.damage;
            }
        }
    });

    const averageKDR = (totalKDR / data.length).toFixed(2);
    const averageSurvival = (totalSurvival / data.length).toFixed(2);

    // Update all stats
    animateNumber('totalDeaths', totalDeaths);
    //animateNumber('totalDeathsFromTP', totalDeathsFromTwitchPlayers);
    animateNumber('totalRaids', totalRaids);
    animateNumber('totalKills', Math.round(totalKills));
    animateNumber('totalDamage', totalDamage);
    animateNumber('averageKDR', averageKDR, 2);
    animateNumber('averageSurvival', averageSurvival, 2);
}

// Simple number animation (CountUp.js)
let countTimer = 2;
function animateNumber(elementId, targetValue, decimals = 0) {
    const element = document.getElementById(elementId);
    const suffix = elementId === 'averageSurvival' ? '%' : '';

    const countUp = new CountUp(element, targetValue, {
        startVal: 0,
        duration: countTimer += 0.3,
        decimalPlaces: decimals,
        separator: ',',
        suffix: suffix
    });

    if (!countUp.error) {
        countUp.start();
    } else {
        console.error(countUp.error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const elements = {
        infoModal: document.getElementById('infoModal'),
        infoButton: document.getElementById('infoButton'),
        closeButtons: document.querySelectorAll('.close'),
        modals: document.querySelectorAll('.modal')
    };

    const toggleModal = (modal, show) => {
        if (show) {
            modal.style.display = 'block';
            setTimeout(() => {
                modal.style.opacity = '1';
                modal.style.visibility = 'visible';
            }, 10);
        } else {
            modal.style.opacity = '0';
            modal.style.visibility = 'hidden';
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
    };

    // Event listeners
    elements.infoButton.addEventListener('click', () => toggleModal(elements.infoModal, true));

    // Close modal if close button was clicked
    elements.closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            toggleModal(elements.infoModal, false);
        });
    });

    // Close modal if user clicked outside of it
    window.addEventListener('click', (event) => {
        if (event.target === elements.infoModal) toggleModal(elements.infoModal, false);
    });
});

// This is used for announcement if needed
// Close announcement modal function
//document.addEventListener('DOMContentLoaded', function () {
//    const announcement = document.getElementById('seasonAnnouncement');
//   const closeBtn = document.getElementById('closeAnnouncement');
//
//    if (localStorage.getItem('announcementClosed') === 'true') {
//        announcement.style.display = 'none';
//    }
//
//    closeBtn.addEventListener('click', function () {
//        announcement.style.display = 'none';
//        localStorage.setItem('announcementClosed', 'true');
//    });
//
//    document.addEventListener('keydown', function (e) {
//        if (e.key === 'Escape') {
//            closeBtn.click();
//        }
//    });
//});

// Loading previous season for leaders
async function loadPreviousSeasonWinners() {
    if (seasons.length < 2) {
        console.log("Not enough seasons to show previous winners. Skipping... loadPreviousSeasonWinners()");
        return;
    }

    const previousSeason = seasons[seasons.length - 1];

    try {
        const response = await fetch(`${seasonPath}${previousSeason}${seasonPathEnd}`);

        // Throws us at season1 + 1. This is some serious SHIT
        if (!response.ok) throw new Error('Failed to load previous season data');

        const data = await response.json();
        const previousSeasonData = data.leaderboard;

        calculateRanks(previousSeasonData);
        displayWinners(previousSeasonData);
    } catch (error) {
        console.error('Error loading previous season:', error);
    }
}

// Display winners (from previous season)
function displayWinners(data) {
    const winnersTab = document.getElementById('winners');

    winnersTab.innerHTML = `
        <h2>Our previous season Champions!</h2>
    `;

    const top3Players = data.filter(player => player.rank <= 3);
    const winnersContainer = document.createElement('div');
    winnersContainer.className = 'winners-container';

    const orderedPlayers = [
        top3Players.find(p => p.rank === 2),
        top3Players.find(p => p.rank === 1),
        top3Players.find(p => p.rank === 3)
    ].filter(Boolean);

    orderedPlayers.forEach(player => {
        winnersContainer.innerHTML += `
            <div class="winner-card">
                <p class="winner-name">${player.medal} ${player.name}</p>
                <p class="winner-rank">${getRankText(player.rank)}</p>
                <p class="winner-skill">Skill score: ${player.totalScore.toFixed(2)}</p>
                <p class="winner-stats">Raids: ${player.totalRaids} | KDR: ${player.killToDeathRatio}</p>
            </div>
        `;
    });

    winnersTab.appendChild(winnersContainer);
}

// Get ranks for leaders of previous season
function getRankText(rank) {
    switch (rank) {
        case 1: return '👑 First place 👑';
        case 2: return 'Second place';
        case 3: return 'Third place';
        default: return '';
    }
}

// Welcome screen
document.addEventListener('DOMContentLoaded', function () {
    const continueBtn = document.getElementById('continueBtn');
    const welcomePopup = document.getElementById('welcomePopup');

    if (localStorage.getItem('welcomePopupClosed') === 'true') {
        welcomePopup.style.display = 'none';
    } else if (localStorage.getItem('welcomePopupClosed') === 'false') {
        welcomePopup.style.display = 'flex';
        setTimeout(() => {
            welcomePopup.style.opacity = '1';
            welcomePopup.style.transform = 'translateY(0)';
        }, 10);
    }

    continueBtn.addEventListener('click', function () {
        welcomePopup.style.opacity = '0';
        welcomePopup.style.transform = 'translateY(-20px)';
        welcomePopup.style.transition = 'opacity 0.3s ease, transform 0.3s ease';

        localStorage.setItem('welcomePopupClosed', 'true');

        setTimeout(() => {
            welcomePopup.style.display = 'none';
        }, 300);
    });
});

function openProfile(playerId) {
    const modal = document.getElementById('playerProfileModal');
    const modalContent = document.getElementById('modalPlayerInfo');

    modalContent.innerHTML = '';

    // If no id data-player-id="0" (shouldn't be happening)
    if (!playerId || playerId === '0') {
        showPrivateProfile(modalContent, "Unknown Player");
        modal.style.display = 'block';
        setupModalCloseHandlers(modal);
        return;
    }

    // Finding Player in data
    const player = leaderboardData.find(p => p.id === playerId);

    // Couldn't find
    if (!player) {
        showPrivateProfile(modalContent, "Player Not Found");
        modal.style.display = 'block';
        setupModalCloseHandlers(modal);
        return;
    }

    const isPublic = player.publicProfile === "true";

    // If disqualified
    if (player.disqualified === "true") {
        modal.style.display = 'block';
        showDisqualProfile(modalContent, player)
        return;
    }

    // Privated profile
    if (!isPublic) {
        showPrivateProfile(modalContent, player);
        modal.style.display = 'block';
        setupModalCloseHandlers(modal);
        return;
    }

    // Showing public profile
    showPublicProfile(modalContent, player);
    modal.style.display = 'block';
    setupModalCloseHandlers(modal);
}

// Private profile HTML
function showPrivateProfile(container, player) {
    container.innerHTML = `
    <div class="profile-content-overlay">
      <h3 class="player-profile-header">${player.name}</h3>
      <div class="private-profile-message">
        <div class="lock-icon">🔒</div>
        <p>This profile is private</p>
        <p class="small-text">This player has restricted access to additional stats</p>
      </div>
    </div>
    `;
}

// Disqualified profile HTML
function showDisqualProfile(container, player) {
    container.innerHTML = `
    <div class="profile-content-overlay">
      <h3 class="player-profile-header">${player.name}</h3>
      <div class="private-profile-message">
        <div class="lock-icon">👻</div>
        <p>This player is banned</p>
        <p class="small-text">This player has been disqualified | banned from leaderboard</p>
      </div>
    </div
    `;
}

// Public profile
// Updated showPublicProfile function for the new layout
function showPublicProfile(container, player) {
    const regDate = player.registrationDate
        ? new Date(player.registrationDate * 1000).toLocaleDateString('en-EN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
        : 'Unknown';

    const factionImages = {
        'Bear': 'media/Bear.png',
        'Usec': 'media/Usec.png',
    };

    const factionImg = factionImages[player.faction] || '';

    // Prestige and other badges
    const prestigeBadge = player.prestige === 1 || player.prestige === 2
        ? `<div class="badge" title="Prestige ${player.prestige}"><img src="media/prestige${player.prestige}.png" width="30" alt="Prestige"></div>`
        : '';

    const achievementBadges = player.achievements
        ? player.achievements.map(ach =>
            `<div class="badge" title="${ach.name}"><img src="media/achievements/${ach.id}.png" width="24" alt="${ach.name}"></div>`
        ).join('')
        : '';

    container.innerHTML = `
        <div class="player-sidebar">
            <img src="${player.avatar || 'media/default-avatar.png'}" class="player-avatar" alt="${player.name}">
            <h2 class="player-name">${player.name}</h2>
            <div class="player-level">Level ${player.level}</div>
            
            ${factionImg ? `<img src="${factionImg}" class="faction-icon" alt="${player.faction}">` : ''}
            
            <div class="online-status">
                <div class="online-dot" style="background-color: ${player.isOnline ? 'rgb(106, 255, 163)' : 'rgb(121, 121, 121)'}"></div>
                <span class="online-text">${player.isOnline ? 'Online now' : 'Offline'}</span>
            </div>
            
            <div class="badges-container">
                ${prestigeBadge}
                ${achievementBadges}
            </div>
        </div>
        
        <div class="profile-content">
            <div class="profile-tabs">
                <button class="profile-tab active" data-tab="pmc">PMC Stats</button>
                <button class="profile-tab" data-tab="scav">SCAV Stats</button>
                <button class="profile-tab" data-tab="lastraid">Last Raid</button>
            </div>
            
            <div class="player-stats-container" id="pmc-stats">
                <div class="player-stat-row">
                    <div class="profile-stat-label">Registered</div>
                    <div class="profile-stat-value">${regDate}</div>
                </div>
                
                ${player.damage ? `
                <div class="player-stat-row">
                    <div class="profile-stat-label">Overall Damage</div>
                    <div class="profile-stat-value">${player.damage.toLocaleString()}</div>
                </div>
                ` : ''}
                
                <div class="player-stat-row">
                    <div class="profile-stat-label">Successful Raids</div>
                    <div class="profile-stat-value">${player.currentWinstreak}</div>
                </div>
                
                ${player.kdRatio ? `
                <div class="player-stat-row">
                    <div class="profile-stat-label">K/D Ratio</div>
                    <div class="profile-stat-value">${player.kdRatio.toFixed(2)}</div>
                </div>
                ` : ''}
                
                ${player.survivalRate ? `
                <div class="player-stat-row">
                    <div class="profile-stat-label">Survival Rate</div>
                    <div class="profile-stat-value">${player.survivalRate}%</div>
                </div>
                ` : ''}
                
                ${player.longestShot ? `
                <div class="player-stat-row">
                    <div class="profile-stat-label">Longest Shot</div>
                    <div class="profile-stat-value">${player.longestShot.toLocaleString()}m</div>
                </div>
                ` : ''}
                
                ${player.raidsCount ? `
                <div class="player-stat-row">
                    <div class="profile-stat-label">Total Raids</div>
                    <div class="profile-stat-value">${player.raidsCount}</div>
                </div>
                ` : ''}
            </div>
            
            <div class="player-stats-container hidden" id="scav-stats">
                <div class="player-stat-row">
                    <div class="profile-stat-label">SCAV Level</div>
                    <div class="profile-stat-value">${player.scavLevel || 'N/A'}</div>
                </div>
                
                <div class="player-stat-row">
                    <div class="profile-stat-label">SCAV Raids</div>
                    <div class="profile-stat-value">${player.scavRaids || 0}</div>
                </div>
                
                <div class="player-stat-row">
                    <div class="profile-stat-label">SCAV Survives</div>
                    <div class="profile-stat-value">${player.scavSurvives || 0}</div>
                </div>
                
                <div class="player-stat-row">
                    <div class="profile-stat-label">SCAV Survival Rate</div>
                    <div class="profile-stat-value">${player.scavSurvRate ? player.scavSurvRate + '%' : 'N/A'}</div>
                </div>
                
                ${player.scavKdRatio ? `
                <div class="player-stat-row">
                    <div class="profile-stat-label">SCAV K/D Ratio</div>
                    <div class="profile-stat-value">${player.scavKdRatio.toFixed(2)}</div>
                </div>
                ` : ''}
            </div>
            
            <div class="player-stats-container hidden" id="lastraid-stats">
                <h3 class="last-raid-header">Last Raid Details</h3>
                
                <div class="player-stat-row">
                    <div class="profile-stat-label">Map</div>
                    <div class="profile-stat-value">${player.lastRaidMap || 'Unknown'}</div>
                </div>
                
                <div class="player-stat-row">
                    <div class="profile-stat-label">Result</div>
                    <div class="profile-stat-value">${player.lastRaidSurvived ? 'Survived' : 'Died'}</div>
                </div>
                
                <div class="player-stat-row">
                    <div class="profile-stat-label">Kills</div>
                    <div class="profile-stat-value">${player.lastRaidKills || 0}</div>
                </div>
                
                <div class="player-stat-row">
                    <div class="profile-stat-label">Damage</div>
                    <div class="profile-stat-value">${player.lastRaidDamage || 'Unknown'}</div>
                </div>
                
                ${player.lastRaidTime ? `
                <div class="player-stat-row">
                    <div class="profile-stat-label">Duration</div>
                    <div class="profile-stat-value">${formatRaidTime(player.lastRaidTime)}</div>
                </div>
                ` : ''}
                
                ${player.lastRaidLoot ? `
                <div class="player-stat-row">
                    <div class="profile-stat-label">Loot Value</div>
                    <div class="profile-stat-value">${player.lastRaidLoot.toLocaleString()} ₽</div>
                </div>
                ` : ''}
            </div>
        </div>
    `;

    // Tab switching functionality
    const tabs = container.querySelectorAll('.profile-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Hide all stats containers
            document.getElementById('pmc-stats').classList.add('hidden');
            document.getElementById('scav-stats').classList.add('hidden');
            document.getElementById('lastraid-stats').classList.add('hidden');

            // Show selected stats
            const tabName = tab.getAttribute('data-tab');
            document.getElementById(`${tabName}-stats`).classList.remove('hidden');
        });
    });
}

// Helper function to format raid time
function formatRaidTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
}

// Close modals on click or out of bounds click
function setupModalCloseHandlers(modal) {
    const closeBtn = modal.querySelector('.profile-close-btn');
    if (closeBtn) {
        closeBtn.onclick = () => modal.style.display = 'none';
    }

    window.addEventListener('click', function closeModal(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
            window.removeEventListener('click', closeModal);
        }
    });
}