//     _____ ____  ______   __    _________    ____  __________  ____  ____  ___    ____  ____ 
//    / ___// __ \/_  __/  / /   / ____/   |  / __ \/ ____/ __ \/ __ )/ __ \/   |  / __ \/ __ \
//    \__ \/ /_/ / / /    / /   / __/ / /| | / / / / __/ / /_/ / __  / / / / /| | / /_/ / / / /  
//   ___/ / ____/ / /    / /___/ /___/ ___ |/ /_/ / /___/ _, _/ /_/ / /_/ / ___ |/ _, _/ /_/ / 
//  /____/_/     /_/    /_____/_____/_/  |_/_____/_____/_/ |_/_____/\____/_/  |_/_/ |_/_____/  

let leaderboardData = []; // For keeping current season data
let heartbeatData = {};
let allSeasonsCombinedData = []; // For keeping combined data from all seasons
let sortDirection = {}; // Sort direction
let seasons = []; // Storing available seasons
let ranOnlyOnce = false;
let isDataReady = false; // To tell whenever the live update was done

// For debugging purposes
// Will use local paths for some files/fallbacks
let debug = 0;

// For dynamic stats counters
let oldTotalRaids = 0;
let oldTotalKills = 0;
let oldTotalDeaths = 0;
let oldTotalDamage = 0;
let oldTotalKDR = 0;
let oldTotalSurvival = 0;
let oldValidPlayers = 0;
let oldTotalPlayers = 0;
let oldOnlinePlayers = 0;
let oldTotalPlayTime = 0;

// Paths
let seasonPath = "https://visuals.nullcore.net/SPT/data/seasons/season";
let seasonPathEnd = `.json?t=${Date.now()}`;
let lastRaidsPath = `https://visuals.nullcore.net/SPT/data/shared/player_raids.json?t=${Date.now()}`;
let profileSettingsPath = `https://visuals.nullcore.net/SPT/data/profile_settings.json?t=${Date.now()}`;
let weaponStatsPath = `https://visuals.nullcore.net/SPT/data/shared/weapon_counters.json?t=${Date.now()}`;
let profileUrlPath = `https://harmonyzt.github.io/SPT-Leaderboard.github.io/#id=`;
let heartbeatsPath = `https://visuals.nullcore.net/SPT/api/heartbeat/heartbeats.json?t=${Date.now()}`;

// Paths for local files if debug is on
if (debug) {
    seasonPath = "fallbacks/season";
    lastRaidsPath = `fallbacks/shared/player_raids.json?t=${Date.now()}`;
    profileSettingsPath = `fallbacks/profile_settings.json?t=${Date.now()}`;
    weaponStatsPath = `../fallbacks/shared/weapon_counters.json?t=${Date.now()}`;
    profileUrlPath = `127.0.0.1:5500/#id=`;
    heartbeatsPath = `fallbacks/heartbeats.json?t=${Date.now()}`;
}

// Call on DOM load
document.addEventListener('DOMContentLoaded', detectSeasons);

/**
 * Checks if a season with the given number exists on the server
 * @param {number} seasonNumber - The season number to check
 * @returns {Promise<boolean>} - True if season exists, false otherwise
 */
async function checkSeasonExists(seasonNumber) {

    try {
        const response = await fetch(`${seasonPath}${seasonNumber}${seasonPathEnd}`);

        // If response status is 404 - season doesn't exist
        if (response.status === 404) {
            return false;
        }

        // consider season exists if response is ok
        return response.ok;
    } catch (error) {
        // Network errors or other issues - treat as non-existent season
        console.error(`Error checking season ${seasonNumber}:`, error);
        return false;
    }
}

/**
 * Detects all available seasons by calling checkSeasonExists(seasonNumber) until 404 is received
 * @returns {Promise<void>}
 */
async function detectSeasons() {
    let seasonNumber = 1;
    seasons = [];

    while (true) {
        const exists = await checkSeasonExists(seasonNumber);
        if (!exists) break;

        seasons.push(seasonNumber);
        seasonNumber++;
    }

    // Load previous winners

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
 * Loads and displays winners from the previous season (if available)
 * 
 * @description
 * Fetches data for the previous season if there are more than 2 available seasons
 * 
 * @returns {Promise<void>} Doesn't return any value
 * 
 * 
 */
async function loadPreviousSeasonWinners() {
    if (seasons.length < 2) return;

    const previousSeason = seasons[seasons.length - 2];

    try {
        const response = await fetch(`${seasonPath}${previousSeason}${seasonPathEnd}`);
        if (!response.ok) return;

        const data = await response.json();
        const previousSeasonData = data.leaderboard || [];

        calculateRanks(previousSeasonData);
        displayWinners(previousSeasonData);
    } catch (error) {
        console.error('Error loading previous season:', error);
    }
}

/**
 * Displays top 3 winners in the UI
 * @param {Array<Object>} data - Leaderboard entries of previous season from loadPreviousSeasonWinners()
 */
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
                <p class="winner-stats">Raids: ${player.pmcRaids} | KDR: ${player.killToDeathRatio}</p>
            </div>
        `;
    });

    winnersTab.appendChild(winnersContainer);
}

/**
 * Returns text based on player rankings for displayWinners()
 * @param {Array<Object>} rank - 3 winners determined by displayWinners() - player.rank
 */
function getRankText(rank) {
    switch (rank) {
        case 1: return '👑 First place 👑';
        case 2: return 'Second place';
        case 3: return 'Third place';
        default: return '';
    }
}

/**
 * For each existing season fills the dropdown menu where you can select seasons
 */
function populateSeasonDropdown() {
    const seasonSelect = document.getElementById('seasonSelect');
    seasonSelect.innerHTML = '';

    // Add individual seasons
    seasons.forEach(season => {
        const option = document.createElement('option');
        option.value = season;
        option.textContent = `Season ${season}`;
        seasonSelect.appendChild(option);
    });

    seasonSelect.addEventListener('change', (event) => {
        AppState.setAutoUpdate(false);

        const selectedValue = event.target.value;
        loadSeasonData(selectedValue);

        if (selectedValue == seasons[0]) {
            AppState.setAutoUpdate(true);
        } else {
            showToast("Live Data Flow was automatically disabled", "info", 8000);
        }
    });
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
    }
}

function getHash(obj) {
    const str = JSON.stringify(obj, Object.keys(obj).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
    }
    return hash;
}
/**
 * Loads all of the seasons and determines who played in previous seasons
 * @returns {Promise<void>}
 */
async function loadAllSeasonsData() {
    try {
        const uniquePlayers = {};

        for (const season of seasons) {
            try {
                const response = await fetch(`${seasonPath}${season}${seasonPathEnd}`);

                const data = await response.json();
                if (!data.leaderboard || data.leaderboard.length === 0) continue;

                data.leaderboard.forEach(player => {
                    const playerKey = player.id || player.name;

                    if (!uniquePlayers[playerKey]) {
                        // New player - initialize with current season data
                        uniquePlayers[playerKey] = {
                            ...player,
                            seasonsPlayed: [season],
                            seasonsCount: 1
                        };
                    } else {
                        // Existing player - update if this season is more recent
                        if (compareLastPlayed(player.lastPlayed, uniquePlayers[playerKey].lastPlayed) > 0) {
                            const { seasonsPlayed, seasonsCount, ...rest } = uniquePlayers[playerKey];
                            uniquePlayers[playerKey] = {
                                ...player,
                                seasonsPlayed: seasonsPlayed.includes(season) ? seasonsPlayed : [...seasonsPlayed, season],
                                seasonsCount: seasonsPlayed.includes(season) ? seasonsCount : seasonsCount + 1
                            };
                        } else if (!uniquePlayers[playerKey].seasonsPlayed.includes(season)) {
                            // Add seasons to player's record
                            uniquePlayers[playerKey].seasonsPlayed.push(season);
                            uniquePlayers[playerKey].seasonsCount += 1;
                        }
                    }
                });
            } catch (error) {
                console.error(`Error processing season ${season}:`, error);
                continue;
            }
        }

        allSeasonsCombinedData = Object.values(uniquePlayers);

    } catch (error) {
        console.error('Error loading all seasons data:', error);
    }
}

/**
 * Processes season data when it was loaded
 * @returns {Promise<void>}
 */
function processSeasonData(data) {
    addColorIndicators(data);
    calculateRanks(data);
    calculateOverallStats(data);
}

/**
 * Resets global statistic counters when called
 * @returns {Promise<void>}
 */
function resetStats() {
    animateNumber('totalDeaths', 0);
    animateNumber('totalRaids', 0);
    animateNumber('totalKills', 0);
    animateNumber('totalDamage', 0);
    animateNumber('averageKDR', 0, 2);
    animateNumber('averageSurvival', 0, 2);
}

// Compare last played dates (supports both Unix timestamps and "dd.mm.yyyy" format)
function compareLastPlayed(dateStr1, dateStr2) {
    const parseDate = (dateStr) => {
        if (/^\d+$/.test(dateStr)) {
            return new Date(parseInt(dateStr) * 1000);
        }

        if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(dateStr)) {
            const [d, m, y] = dateStr.split('.').map(Number);
            return new Date(y, m - 1, d);
        }

        return null;
    };

    const date1 = parseDate(dateStr1);
    const date2 = parseDate(dateStr2);

    if (!date1 || !date2) return 0;
    return date1 - date2;
}

// To 00:00
function formatSeconds(seconds) {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
}

/**
 * Renders player leaderboard data in a table
 * @param {Array<Object>} data - Leaderboard data with all the season entries
 * @returns {void}
 */
function displayLeaderboard(data) {
    const tableBody = document.querySelector('#leaderboardTable tbody');
    tableBody.innerHTML = '';
    let lastGame;

    data.forEach(player => {
        const row = document.createElement('tr');

        // Check HeartbeatMonitor
        const playerStatus = window.heartbeatMonitor.getPlayerStatus(player.id);
        if (!player.banned) {
            const lastOnlineTime = heartbeatMonitor.isOnline(player.id)
                ? '<span class="player-status-lb-online">Online</span>'
                : window.heartbeatMonitor.getLastOnlineTime(playerStatus.lastUpdate || player.lastPlayed);

            // For lastGame
            if (heartbeatMonitor.isOnline(player.id)) {
                lastGame = `<span class="player-status-lb ${playerStatus.statusClass}">${playerStatus.statusText} <div id="blink"></div></span>`;
            } else {
                lastGame = `<span class="last-online-time">${lastOnlineTime}</span>`;
            }
        } else {
            lastGame = `<span class="last-online-time">Banned</span>`;
        }

        // Determine rank classes
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

        // Add profile standing
        let badge = '';
        if (player?.suspicious == true && !player.isCasual) {
            badge = `<div class="badge-lb tooltip">
            <em class='bx bxs-x-shield bx-flashing' style="color:rgb(255, 123, 100);"></em>
            <span class="tooltiptext">This player was marked as suspicious by SkillIssueDetector™. Their statistics may be innacurate</span>
          </div>`;
        } else {
            badge = `<div class="badge-lb tooltip">
            <em class='bx  bxs-shield-alt-2' style="color:rgb(100, 255, 165);"></em>
            <span class="tooltiptext">Profile in good standing</span>
          </div>`;
        }

        let profileOpenIcon = `Private <em class='bx bxs-lock' style="font-size: 23px"></em>`
        if (player.publicProfile) {
            profileOpenIcon = `Public`
        }

        // Account type handling
        let accountIcon = '';
        let accountColor = '';
        if (!player.disqualified) {
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

        // Tester overwrite every icon and color text on top
        if (player.trusted) {
            accountIcon = '<img src="media/trusted.png" alt="Tester" class="account-icon">';
            accountColor = '#ba8bdb';
        }

        // Developer
        if (player.dev) {
            accountIcon = `<img src="media/leaderboard_icons/icon_developer.png" alt="Developer"  style="width: 15px; height: 15px" class="account-icon">`;
            accountColor = '#2486ff';
        }

        // Prestige icon
        const prestigeImg = [1, 2].includes(player.prestige)
            ? `<img src="media/leaderboard_icons/Prestige_Icon${player.prestige}.png" style="width: 25px; height: 25px" class="prestige-icon" alt="Prestige ${player.prestige}">`
            : '';

        // Skill rank label
        const rankLabel = player.isCasual ? 'Casual' : getRankLabel(player.totalScore);

        row.innerHTML = `
            <td class="rank ${rankClass}">${player.rank} ${player.medal}</td>
            <td class="teamtag" data-team="${player.teamTag ? player.teamTag : ``}">${player.teamTag ? `[${player.teamTag}]` : ``}</td>
            <td class="player-name ${nameClass}" style="color: ${accountColor};" data-player-id="${player.id || '0'}"> ${accountIcon} ${player.name} ${prestigeImg}</td>
            <td>${lastGame || 'N/A'}</td>
            <td>${player.publicProfile ? `<button style="share-button" onclick="copyProfile('${player.id}')">${profileOpenIcon} <i class='bx  bxs-share'></i> </button>` : `${profileOpenIcon}`}</td>
            <td>${badge}</td>
            <td>${player.pmcRaids}</td>
            <td class="${player.survivedToDiedRatioClass}">${player.survivalRate}%</td>
            <td class="${player.killToDeathRatioClass}">${player.killToDeathRatio}</td>
            <td class="${player.averageLifeTimeClass}">${formatSeconds(player.averageLifeTime)}</td>
            <td>${player.totalScore <= 0 ? 'Calibrating...' : player.totalScore.toFixed(2)} ${player.totalScore <= 0 ? '' : `(${rankLabel})`}</td>
            <td>${player.sptVer}</td>
        `;

        tableBody.appendChild(row);
    });

    // Add click handlers for player names
    document.querySelectorAll('.player-name').forEach(element => {
        element.addEventListener('click', () => {
            openProfile(element.dataset.playerId);
        });
    });

    document.querySelectorAll('.teamtag').forEach(element => {
        element.addEventListener('click', () => {
            openTeam(element.dataset.team);
        });
    });

    // Add sort listeners
    addSortListeners();

    isDataReady = true;
}

/**
 * Returns an array of text (date) depending on when was Unix timestamp set to
 * @param {Array<Object>} unixTimestamp - Unix timestamp
 * @returns Array of text (date)
 * @example In game <div id="blink"></div> | 1d ago | 1m 2d ago
 * 
 */
function formatLastPlayed(unixTimestamp) {
    if (typeof unixTimestamp !== 'number' || unixTimestamp <= 0) {
        return 'Unknown';
    }

    const date = new Date(unixTimestamp * 1000);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);

    if (diffInMinutes < 30) {
        return '<span class="player-status-lb player-status-lb-finished">Finished Raid <div id="blink"></div></span>';
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

// Add color indicators to player stats
function addColorIndicators(data) {
    data.forEach(player => {
        // Survived/Died Ratio
        if (player.survivalRate < 30) {
            player.survivedToDiedRatioClass = 'bad';
        } else if (player.survivalRate < 55) {
            player.survivedToDiedRatioClass = 'average';
        } else if (player.survivalRate < 70) {
            player.survivedToDiedRatioClass = 'good';
        } else {
            player.survivedToDiedRatioClass = 'impressive';
        }

        // Kill/Death Ratio
        if (player.killToDeathRatio < 3) {
            player.killToDeathRatioClass = 'bad';
        } else if (player.killToDeathRatio < 5) {
            player.killToDeathRatioClass = 'average';
        } else if (player.killToDeathRatio < 15) {
            player.killToDeathRatioClass = 'good';
        } else {
            player.killToDeathRatioClass = 'impressive';
        }
    });
}

// Convert time string to seconds
function convertTimeToSeconds(time) {
    if (!time) return 0;
    const [minutes, seconds] = time.split(':').map(Number);
    return minutes * 60 + seconds;
}

/**
 * Calculates and assigns ranks to players based on their stats
 * @param {Array<Object>} data - Leaderboard data with all the season entries
 * @returns {void}
 * 
 * @description
 * Calculates player skill scores considering:
 * - Kill/death ratio
 * - Survival rate
 * - Raid count
 * - Average lifetime
 * Applies penalties for low raid count and short lifetimes
 */
function calculateRanks(data) {
    const MIN_RAIDS = 50;
    const SOFT_CAP_RAIDS = 100;
    const MIN_LIFE_TIME = 8; // tracking skill issue
    const MAX_LIFE_TIME = 45;

    const maxKDR = Math.max(...data.map(p => p.killToDeathRatio));
    const maxSurvival = Math.max(...data.map(p => p.survivalRate));
    const maxRaids = Math.max(...data.map(p => p.pmcRaids));
    const maxAvgLifeTime = Math.max(...data.map(p => Math.min(p.averageLifeTime, MAX_LIFE_TIME)));

    data.forEach(player => {
        if (player.disqualified) {
            player.totalScore = 0;
            player.damage = 0;
            player.killToDeathRatio = 0;
            player.survivedToDiedRatio = 0;
            return;
        }

        const normKDR = maxKDR ? player.killToDeathRatio / maxKDR : 0;
        const normSurvival = maxSurvival ? player.survivalRate / maxSurvival : 0;
        const normRaids = maxRaids ? player.pmcRaids / maxRaids : 0;

        // Max 45 mins. No raid overhaul BS
        const clampedLifeTime = Math.min(player.averageLifeTime, MAX_LIFE_TIME);
        const normAvgLifeTime = maxAvgLifeTime ? clampedLifeTime / maxAvgLifeTime : 0;

        let score = (normKDR * 0.10) + (normSurvival * 0.1) + (normRaids * 0.4) + (normAvgLifeTime * 0.3);

        // Soft Cap for raids
        if (player.pmcRaids <= MIN_RAIDS) {
            score *= 0.3;
        } else if (player.pmcRaids < SOFT_CAP_RAIDS) {
            const progress = (player.pmcRaids - MIN_RAIDS) / (SOFT_CAP_RAIDS - MIN_RAIDS);
            score *= 0.3 + (0.7 * progress);
        }

        if ((player.averageLifeTime / 60) < MIN_LIFE_TIME) {
            score *= 0.6; // -60% penalty
        }

        player.totalScore = score;

        if (player.isCasual) {
            player.totalScore = 0.15;
        }
    });

    data.sort((a, b) => b.totalScore - a.totalScore);

    data.forEach((player, index) => {
        if (!player.isCasual) {
            player.rank = index + 1;
            player.medal = ['🥇', '🥈', '🥉'][index] || '';
        } else {
            player.rank = 0;
            player.medal = '';
        }
    });
}

// Get skill rank label
function getRankLabel(totalScore) {
    if (totalScore < 0.2) return 'L-';
    if (totalScore < 0.35) return 'L';
    if (totalScore < 0.45) return 'L+';
    if (totalScore < 0.55) return 'M-';
    if (totalScore < 0.65) return 'M';
    if (totalScore < 0.72) return 'M+';
    if (totalScore < 0.78) return 'H-';
    if (totalScore < 0.84) return 'H';
    if (totalScore < 0.9) return 'H+';
    if (totalScore < 0.94) return 'P-';
    if (totalScore < 0.97) return 'P';
    if (totalScore < 0.99) return 'P+';
    return 'G';
}

// Calculate all stats + dynamic update support
function calculateOverallStats(data) {
    // Save old values before calculating new ones
    const previousStats = {
        raids: oldTotalRaids,
        kills: oldTotalKills,
        deaths: oldTotalDeaths,
        damage: oldTotalDamage,
        kdr: oldTotalKDR,
        survival: oldTotalSurvival,
        players: oldValidPlayers,
        totalPlayers: oldTotalPlayers,
        onlinePlayers: oldOnlinePlayers,
        totalPlayTime: oldTotalPlayTime
    };

    // Reset counters
    let totalRaids = 0;
    let totalKills = 0;
    let totalDeaths = 0;
    let totalDamage = 0;
    let totalKDR = 0;
    let totalSurvival = 0;
    let validPlayers = 0;
    let onlinePlayers = heartbeatMonitor.getOnlineCount();;
    let totalPlayTime = 0;

    data.forEach(player => {
        if (!player.disqualified && !player.isCasual) {
            const pmcRaids = Math.max(0, parseInt(player.pmcRaids) || 0);
            const survivalRate = Math.min(100, Math.max(0, parseFloat(player.survivalRate) || 0));
            const rawKills = parseFloat(player.pmcKills) || 0;
            const rawKDR = parseFloat(player.killToDeathRatio);
            const kdr = isFinite(rawKDR) && rawKDR >= 0 ? rawKDR : 0;

            if (pmcRaids > 0 && rawKills >= 0) {
                const deaths = kdr > 0 ? rawKills / kdr : pmcRaids;

                totalRaids += pmcRaids;
                totalKills += rawKills;
                totalDeaths += deaths;

                totalKDR += kdr;
                totalSurvival += survivalRate;
                validPlayers++;

                if (player.publicProfile) {
                    totalDamage += parseFloat(player.damage) || 0;
                }
            }
        }

        if (player.totalPlayTime) {
            totalPlayTime += Math.floor(player.totalPlayTime / 60);
        }
    });

    // Calculate averages
    const averageKDR = totalDeaths > 0 ? (totalKills / totalDeaths) : 0;
    const averageSurvival = validPlayers > 0 ? (totalSurvival / validPlayers) : 0;
    const totalPlayers = data.length;

    // Update old values for next animation
    oldTotalRaids = totalRaids;
    oldTotalKills = totalKills;
    oldTotalDeaths = totalDeaths;
    oldTotalDamage = totalDamage;
    oldTotalKDR = averageKDR;
    oldTotalSurvival = averageSurvival;
    oldValidPlayers = validPlayers;
    oldTotalPlayers = totalPlayers;
    oldOnlinePlayers = onlinePlayers;
    oldTotalPlayTime = totalPlayTime;

    // Animate from previous values
    animateNumber('totalRaids', totalRaids, 0, previousStats.raids);
    animateNumber('totalKills', Math.round(totalKills), 0, previousStats.kills);
    animateNumber('totalDeaths', Math.round(totalDeaths), 0, previousStats.deaths);
    animateNumber('totalDamage', totalDamage, 0, previousStats.damage);
    animateNumber('averageKDR', averageKDR, 2, previousStats.kdr);
    animateNumber('averageSurvival', averageSurvival, 2, previousStats.survival);
    animateNumber('totalPlayers', totalPlayers, 0, previousStats.totalPlayers);
    animateNumber('onlinePlayers', onlinePlayers, 0, previousStats.onlinePlayers);
    animateNumber('totalPlayTime', totalPlayTime, 0, previousStats.totalPlayTime);
}

function animateNumber(elementId, targetValue, decimals = 0, startValue = null) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const suffix = elementId === 'averageSurvival' ? '%' : '';

    // Parse current displayed value
    let currentDisplayValue = element.textContent.replace(/[^0-9.-]/g, '');

    if (suffix === '%') {
        currentDisplayValue = currentDisplayValue.replace('%', '');
    }

    let currentValue;
    try {
        currentValue = parseFloat(currentDisplayValue);
        if (isNaN(currentValue)) {
            currentValue = (startValue !== null) ? startValue : 0;
        }
    } catch (e) {
        currentValue = (startValue !== null) ? startValue : 0;
    }

    // Special case handling for KDR
    if (elementId === 'averageKDR' && currentValue > 100 && targetValue < 100) {
        currentValue = (startValue !== null) ? startValue : targetValue;
    }

    startValue = (startValue !== null) ? startValue : currentValue;

    // Ensure no huge mismatch between values
    if (targetValue === 0 && startValue > 1000) {
        startValue = 0;
    }

    // Format value with decimals and suffix
    const formatValue = (value) => {
        return (decimals > 0 ? value.toFixed(decimals) : Math.round(value)) + suffix;
    };

    // Set initial value to avoid jumping from default
    element.innerHTML = formatValue(startValue);

    // Trigger odometer animation by setting target after short delay
    setTimeout(() => {
        element.innerHTML = formatValue(targetValue);
    }, 50); // slight delay to allow Odometer to detect change
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Load previous stats from localStorage if can
    const savedStats = localStorage.getItem('leaderboardStats');
    if (savedStats) {
        try {
            const stats = JSON.parse(savedStats);
            oldTotalRaids = stats.raids || 0;
            oldTotalKills = stats.kills || 0;
            oldTotalDeaths = stats.deaths || 0;
            oldTotalDamage = stats.damage || 0;
            oldTotalKDR = stats.kdr || 0;
            oldTotalSurvival = stats.survival || 0;
            oldValidPlayers = stats.players || 0;
        } catch (e) {
            console.error('Failed to parse saved stats', e);
        }
    }
});

// Save current stats to localStorage
function saveCurrentStats() {
    const stats = {
        raids: oldTotalRaids,
        kills: oldTotalKills,
        deaths: oldTotalDeaths,
        damage: oldTotalDamage,
        kdr: oldTotalKDR,
        survival: oldTotalSurvival,
        players: oldValidPlayers,
        totalPlayers: oldTotalPlayers,
        onlinePlayers: oldOnlinePlayers,
        totalPlayTime: oldTotalPlayTime
    };
    localStorage.setItem('leaderboardStats', JSON.stringify(stats));
}

// Add sort listeners to table headers
function addSortListeners() {
    const headers = document.querySelectorAll('#leaderboardTable th[data-sort]');
    headers.forEach(header => {
        header.addEventListener('click', () => {
            const sortKey = header.getAttribute('data-sort');
            sortLeaderboard(sortKey);
        });
    });
}

// Sort leaderboard data (BROKEN)
function sortLeaderboard(sortKey) {
    if (!sortDirection[sortKey]) {
        sortDirection[sortKey] = 'asc';
    } else {
        sortDirection[sortKey] = sortDirection[sortKey] === 'asc' ? 'desc' : 'asc';
    }

    const currentData = leaderboardData.length > 0 ? leaderboardData : allSeasonsCombinedData;

    currentData.sort((a, b) => {
        let valueA = a[sortKey];
        let valueB = b[sortKey];

        if (sortKey === 'rank') {
            valueA = a.rank;
            valueB = b.rank;
        }

        if (['pmcLevel', 'pmcRaids', 'survivalRate', 'killToDeathRatio', 'totalScore'].includes(sortKey)) {
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

    displayLeaderboard(currentData);
}

// Welcome popup
document.addEventListener('DOMContentLoaded', function () {
    const continueBtn = document.getElementById('continueBtn');
    const welcomePopup = document.getElementById('welcomePopup');

    if (localStorage.getItem('welPopupClosed') === 'true') {
        welcomePopup.style.display = 'none';
    } else {
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

        localStorage.setItem('welPopupClosed', 'true');

        setTimeout(() => {
            welcomePopup.style.display = 'none';
        }, 300);
    });
});