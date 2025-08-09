//     _____ ____  ______   __    _________    ____  __________  ____  ____  ___    ____  ____
//    / ___// __ \/_  __/  / /   / ____/   |  / __ \/ ____/ __ \/ __ )/ __ \/   |  / __ \/ __ \
//    \__ \/ /_/ / / /    / /   / __/ / /| | / / / / __/ / /_/ / __  / / / / /| | / /_/ / / / /
//   ___/ / ____/ / /    / /___/ /___/ ___ |/ /_/ / /___/ _, _/ /_/ / /_/ / ___ |/ _, _/ /_/ /
//  /____/_/     /_/    /_____/_____/_/  |_/_____/_____/_/ |_/_____/\____/_/  |_/_/ |_/_____/

// TODO: #6 Optimize whole code from stockpiled garbage
// TODO: #8 Use centralized function to load JSON data

let leaderboardData = []; // For keeping current season data
let heartbeatData = {}; // Remember heartbeats
let allSeasonsCombinedData = []; // For keeping combined data from all seasons
let seasons = []; // Storing available seasons
let ranOnlyOnce = false; // Run only once (ie winners)
let isDataReady = false; // To tell whenever the live update was done
let isFirstPfpLoad = true;

// For debugging purposes
// Will use local paths for some files/fallbacks
const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

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

// TODO: #7 Fully support all paths for debug and not
// Paths
let seasonPath = 'https://visuals.nullcore.net/SPT/data/seasons/season';
let seasonPathEnd = `.json?t=${Date.now()}`;
let lastRaidsPath = `https://visuals.nullcore.net/SPT/data/player_raids/`;
let profileSettingsPath = `https://visuals.nullcore.net/SPT/data/profile_settings.json?t=${Date.now()}`;
let weaponStatsPath = `https://visuals.nullcore.net/SPT/data/shared/weapon_counters.json?t=${Date.now()}`;
let profileUrlPath = `https://harmonyzt.github.io/SPT-Leaderboard.github.io/#id=`;
let heartbeatsPath = `https://visuals.nullcore.net/SPT/api/heartbeat/heartbeats.json?t=${Date.now()}`;
let achievementsPath = `https://visuals.nullcore.net/SPT/data/shared/achievement_counters.json`;
let pmcPfpsPath = `https://visuals.nullcore.net/SPT/data/pmc_avatars/`;

// Paths for local files if debug is on
if (isLocalhost) {
    pmcPfpsPath = `fallbacks/pmc_avatars/`;
    seasonPath = `fallbacks/season`;
    lastRaidsPath = `fallbacks/player_raids/}`;
    profileSettingsPath = `fallbacks/profile_settings.json?t=${Date.now()}`;
    weaponStatsPath = `../fallbacks/shared/weapon_counters.json?t=${Date.now()}`;
    profileUrlPath = `127.0.0.1:5500/#id=`;
    heartbeatsPath = `fallbacks/heartbeats.json?t=${Date.now()}`;
    achievementsPath = `../fallbacks/shared/achievement_counters.json`;
}

// Call main init on DOM load
document.addEventListener('DOMContentLoaded', initAllSeasons)


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
        return false;
    }
}

/**
 * Detects all available seasons by calling checkSeasonExists(seasonNumber) until 404 is received
 * @returns {Promise<void>}
 */
async function initAllSeasons() {
    // Seasons start from 1
    // Clean up before initialize
    let seasonNumber = 1;
    seasons = [];

    try {
        while (true) {
            const exists = await checkSeasonExists(seasonNumber);
            if (!exists) break;

            seasons.push(seasonNumber);
            seasonNumber++;
        }
    } catch {
        console.error('Error checking number of seasons:', error);
    } finally {
        // Sort from newest to oldest
        seasons.sort((a, b) => b - a);

        prepareSeasonData()
        populateSeasonDropdown();
    }
}

/**
 * Proceeds the all seasons been initialized function
 * @returns {Promise<void>}
 */
async function prepareSeasonData() {
    // Load data if we found any seasons
    if (seasons.length > 0) {
        await Promise.all([loadSeasonData(seasons[0])]);

        // Load previous winners and run it only once
        if (!ranOnlyOnce) {
            ranOnlyOnce = true;
            loadPreviousSeasonWinners();
            loadAllSeasonsData()
        }

        saveCurrentStats();
    }
}

/**
 * Loads and displays winners from the previous season (if available)
 * @description
 * Fetches data for the previous season if there are more than 2 available seasons
 * @returns {Promise<void>} Doesn't return any value
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
    })

    seasonSelect.addEventListener('change', event => {
        AppState.setAutoUpdate(false);

        const selectedValue = event.target.value;
        loadSeasonData(selectedValue);

        if (selectedValue == seasons[0]) {
            AppState.setAutoUpdate(true);
        } else {
            showToast('Live Data Flow was automatically disabled', 'info', 8000);
        }
    })
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
        if (!response.ok) throw new Error('Failed to load season data');

        const data = await response.json();
        leaderboardData = data.leaderboard || [];

        if (leaderboardData.length === 0 || (leaderboardData.length === 1 && Object.keys(leaderboardData[0]).length === 0)) {
            emptyLeaderboardNotification.style.display = 'block';
            resetStats();
            return;
        }

        // Wait for assignLeaderboardData
        await assignLeaderboardData(leaderboardData);

        // Calculate ranks before initializing the leaderboard
        calculateRanks(leaderboardData);

        // For first launch ONLY
        if (isFirstPfpLoad) {
            displayLeaderboard(leaderboardData);
            isFirstPfpLoad = false;
        } else {
            updateExistingLeaderboard(leaderboardData);
        }


        initProfileWatchList(leaderboardData);
    } catch (error) {
        console.error('Error loading season data:', error);
        emptyLeaderboardNotification.style.display = 'block';
    } finally {
        checkRecentPlayers(leaderboardData);
        initProfileWatchList(leaderboardData);
        addColorIndicators(leaderboardData);
        calculateOverallStats(leaderboardData);

        // Data is fully ready
        isDataReady = true;
    }
}

function updateExistingLeaderboard(players) {
    const tableBody = document.querySelector('#leaderboardTable tbody');
    if (!tableBody) return;

    players.forEach(player => {
        const row = tableBody.querySelector(`tr[data-player-id="${player.id}"]`);
        if (!row) return;

        const nameCell = row.querySelector('.player-name');
        const avatarImg = row.querySelector('.player-avatar img');

        if (nameCell && player.name) {
            nameCell.textContent = player.name;
        }

        if (avatarImg && player.profilePicture) {
            const timestamp = new Date().getTime();
            avatarImg.src = `${player.profilePicture}?${timestamp}`;

            avatarImg.onerror = () => {
                avatarImg.src = 'media/default_avatar.png';
            };
        }
    });
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

                const data = await response.json()
                if (!data.leaderboard || data.leaderboard.length === 0) continue

                data.leaderboard.forEach(player => {
                    const playerKey = player.id;

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
                                seasonsPlayed: seasonsPlayed.includes(season)
                                    ? seasonsPlayed
                                    : [...seasonsPlayed, season],
                                seasonsCount: seasonsPlayed.includes(season)
                                    ? seasonsCount
                                    : seasonsCount + 1
                            };
                        } else if (!uniquePlayers[playerKey].seasonsPlayed.includes(season)) {
                            // Add seasons to player's record
                            uniquePlayers[playerKey].seasonsPlayed.push(season);
                            uniquePlayers[playerKey].seasonsCount += 1;
                        }
                    }
                })
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
async function processSeasonData(data) {
    addColorIndicators(data);
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
    const parseDate = dateStr => {
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
 * @returns {Promise<void>}
 */
async function displayLeaderboard(data) {
    const tempTableBody = document.createElement('tbody');
    tempTableBody.style.display = 'none';

    // Process players sequentially for proper ordering
    const fragment = document.createDocumentFragment();
    data.forEach(player => {
        const row = document.createElement('tr');
        let lastGame;

        const nowInSeconds = Math.floor(Date.now() / 1000);
        const fifteenDaysInSeconds = 15 * 24 * 60 * 60;

        // Player was online for more 15 days, skip to render less
        if (player.absoluteLastTime < nowInSeconds - fifteenDaysInSeconds) {
            return;
        }

        // Check HeartbeatMonitor
        const playerStatus = window.heartbeatMonitor.getPlayerStatus(player.id);

        if (!player.banned) {
            const lastOnlineTime = heartbeatMonitor.isOnline(player.id)
                ? '<span class="player-status-lb-online">Online</span>'
                : window.heartbeatMonitor.getLastOnlineTime(playerStatus.lastUpdate || player.lastPlayed);

            // For lastGame
            if (heartbeatMonitor.isOnline(player.id)) {
                lastGame = `<span class="player-status-lb ${playerStatus.statusClass}">${playerStatus.statusText} <div id="blink"></div></span>`
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
        if (player.banned) {
            badge = `<div class="badge-lb tooltip">
            <em class='bx  bxs-alert-shield' style="color:rgba(255, 110, 100, 1);"></em> 
            <span class="tooltiptext">Profile is banned</span>
          </div>`;
        } else if (player?.suspicious == true && !player.isCasual) {
            badge = `<div class="badge-lb tooltip">
            <em class='bx  bxs-alert-shield' style="color:rgb(255, 214, 100);"></em> 
            <span class="tooltiptext">Marked as suspicious by SkillIssueDetector™. Their statistics may be innacurate</span>
          </div>`;
        } else {
            badge = `<div class="badge-lb tooltip">
            <em class='bx  bxs-shield-alt-2' style="color:rgb(100, 255, 165);"></em>
            <span class="tooltiptext">Profile in good standing</span>
          </div>`;
        }

        let profileOpenIcon = `Private <em class='bx bxs-lock' style="font-size: 23px"></em>`;
        if (player.publicProfile) {
            profileOpenIcon = `Share`;
        }

        // Account type handling
        let accountIcon = '';
        let accountColor = '';
        if (!player.disqualified) {
            switch (player.accountType) {
                case 'edge_of_darkness':
                    accountIcon = `<img src="media/EOD.png" alt="EOD" class="account-icon">`;
                    accountColor = '#be8301';
                    break;
                case 'unheard_edition':
                    accountIcon = `<img src="media/Unheard.png" alt="Unheard" class="account-icon">`;
                    accountColor = '#54d0e7';
                    break;
            }
        } else {
            accountColor = '#787878'
        }

        // Tester overwrite every icon and color text on top
        if (player.trusted && !player.banned) {
            accountIcon = `<img src="media/trusted.png" alt="Tester" class="account-icon">`
            accountColor = '#ba8bdb'
        }

        let playerGameMode = '';

        if (player.isUsingFika && player.isUsingRealism && !player.banned) {
            playerGameMode = `FIKA & REALISM`;
        } else if (player.isUsingFika && !player.banned) {
            playerGameMode = `FIKA`;
        } else if (player.isUsingRealism && !player.banned) {
            playerGameMode = `REALISM`;
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
            <td class="player-name ${nameClass}" style="color: ${accountColor};" data-player-id="${player.id || '0'}">
                ${`<img class="lb-profile-picture" src="${player.profilePicture || 'media/default_avatar.png'}">`}
                ${accountIcon} ${player.name} ${prestigeImg} ${playerGameMode ? `<div class="player-mode ${playerGameMode}">${playerGameMode}</div>` : ``}
            </td>
            <td>${lastGame || 'N/A'}</td>
            <td>${player.publicProfile ? `<button style="share-button" onclick="copyProfile('${player.id}')">${profileOpenIcon} <i class='bx  bxs-share'></i> </button>`
                : `${profileOpenIcon}`
            }</td>
            <td>${badge}</td>
            <td>${player.pmcRaids} / ${player.scavRaids} (${player.pmcRaids + player.scavRaids})</td>
            <td class="${player.survivedToDiedRatioClass}">${player.survivalRate}%</td>
            <td class="${player.killToDeathRatioClass}">${player.killToDeathRatio}</td>
            <td class="${player.averageLifeTimeClass}">${formatSeconds(player.averageLifeTime)}</td>
            <td>${player.totalScore <= 0 ? 'Calibrating...'
                : player.totalScore.toFixed(2)} ${player.totalScore <= 0 ? '' : `(${rankLabel})`}</td>
            <td>${player.sptVer}</td>
        `

        fragment.appendChild(row)
    });

    tempTableBody.appendChild(fragment);

    const mainTable = document.querySelector('#leaderboardTable');
    const currentTableBody = mainTable.querySelector('tbody');
    mainTable.replaceChild(tempTableBody, currentTableBody);
    tempTableBody.style.display = '';

    // Add click handlers for player names
    mainTable.addEventListener('click', (e) => {
        if (e.target.closest('.player-name')) {
            openProfile(e.target.closest('.player-name').dataset.playerId);
        }
        if (e.target.closest('.teamtag')) {
            openTeam(e.target.closest('.teamtag').dataset.team);
        }
    });

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
            player.survivedToDiedRatioClass = 'bad'
        } else if (player.survivalRate < 55) {
            player.survivedToDiedRatioClass = 'average'
        } else if (player.survivalRate < 70) {
            player.survivedToDiedRatioClass = 'good'
        } else {
            player.survivedToDiedRatioClass = 'impressive'
        }

        // Kill/Death Ratio
        if (player.killToDeathRatio < 3) {
            player.killToDeathRatioClass = 'bad'
        } else if (player.killToDeathRatio < 5) {
            player.killToDeathRatioClass = 'average'
        } else if (player.killToDeathRatio < 15) {
            player.killToDeathRatioClass = 'good'
        } else {
            player.killToDeathRatioClass = 'impressive'
        }
    })
}

// Convert time string to seconds
function convertTimeToSeconds(time) {
    if (!time) return 0
    const [minutes, seconds] = time.split(':').map(Number)
    return minutes * 60 + seconds
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
async function calculateRanks(data) {
    const MIN_RAIDS = 50
    const SOFT_CAP_RAIDS = 100
    const MIN_LIFE_TIME = 10 // Skill issue tracker
    const MAX_LIFE_TIME = 55

    const maxKDR = Math.max(...data.map(p => p.killToDeathRatio))
    const maxSurvival = Math.max(...data.map(p => p.survivalRate))
    const maxRaids = Math.max(...data.map(p => p.pmcRaids))
    const maxAvgLifeTime = Math.max(
        ...data.map(p => Math.min(p.averageLifeTime, MAX_LIFE_TIME))
    )

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

        let score = normKDR * 0.1 + normSurvival * 0.1 + normRaids * 0.35 + normAvgLifeTime * 0.3;

        // Soft Cap for raids
        if (player.pmcRaids <= MIN_RAIDS) {
            score *= 0.3;
        } else if (player.pmcRaids < SOFT_CAP_RAIDS) {
            const progress = (player.pmcRaids - MIN_RAIDS) / (SOFT_CAP_RAIDS - MIN_RAIDS);
            score *= 0.3 + 0.65 * progress;
        }

        if (player.averageLifeTime / 60 < MIN_LIFE_TIME) {
            score *= 0.1; // -90% penalty
        }

        player.totalScore = score;

        if (player.isCasual) {
            player.totalScore = 0.15;
        }
    })

    data.sort((a, b) => b.totalScore - a.totalScore)

    data.forEach((player, index) => {
        if (player.isCasual) {
            player.rank = "Casual";
            player.medal = '';
            return;
        }

        player.rank = index + 1;
        player.medal = ['🥇', '🥈', '🥉'][index] || '';

    })
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
    let onlinePlayers = heartbeatMonitor.getOnlineCount();
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
    })

    // Calculate averages
    const averageKDR = totalDeaths > 0 ? totalKills / totalDeaths : 0;
    const averageSurvival = validPlayers > 0 ? totalSurvival / validPlayers : 0;
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

    updateNavbarOffset();
}


//Auto offset top by top-stats-bar height
function updateNavbarOffset() {
    const bar = document.querySelector('.top-stats-bar');
    if (bar) {
        document.documentElement.style.setProperty('--top-stats-height', bar.offsetHeight + 15 + 'px');
        document.documentElement.style.setProperty('--top-stats-height-variant', bar.offsetHeight - 50 + 'px');
    }
}

window.addEventListener('load', updateNavbarOffset);
window.addEventListener('resize', updateNavbarOffset);

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
            currentValue = startValue !== null ? startValue : 0;
        }
    } catch (e) {
        currentValue = startValue !== null ? startValue : 0;
    }

    // Special case handling for KDR
    if (elementId === 'averageKDR' && currentValue > 100 && targetValue < 100) {
        currentValue = startValue !== null ? startValue : targetValue;
    }

    startValue = startValue !== null ? startValue : currentValue

    // Ensure no huge mismatch between values
    if (targetValue === 0 && startValue > 1000) {
        startValue = 0;
    }

    // Format value with decimals and suffix
    const formatValue = value => {
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

// Welcome popup
document.addEventListener('DOMContentLoaded', function () {
    const continueBtn = document.getElementById('continueBtn');
    const welcomePopup = document.getElementById('welcomePopup');

    if (localStorage.getItem('welcomePopupClosed') === 'true') {
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

        localStorage.setItem('welcomePopupClosed', 'true');

        setTimeout(() => {
            welcomePopup.style.display = 'none';
        }, 300);
    });
});