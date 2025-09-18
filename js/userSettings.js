//     _____ ____  ______   __    _________    ____  __________  ____  ____  ___    ____  ____ 
//    / ___// __ \/_  __/  / /   / ____/   |  / __ \/ ____/ __ \/ __ )/ __ \/   |  / __ \/ __ \
//    \__ \/ /_/ / / /    / /   / __/ / /| | / / / / __/ / /_/ / __  / / / / /| | / /_/ / / / /  
//   ___/ / ____/ / /    / /___/ /___/ ___ |/ /_/ / /___/ _, _/ /_/ / /_/ / ___ |/ _, _/ /_/ / 
//  /____/_/     /_/    /_____/_____/_/  |_/_____/_____/_/ |_/_____/\____/_/  |_/_/ |_/_____/  

const seasonEndDate = new Date(2025, 11, 13, 14, 1, 1);

let audioElements = {};
let lastPlayed = null;
let timerInterval;

function updateVisibility(toggle, element, cookieName) {
    const isVisible = toggle.checked;
    if (element) {
        element.style.display = isVisible ? 'block' : 'none';
    }

    setCookie(cookieName, isVisible);
}

document.addEventListener('DOMContentLoaded', () => {
    const timerToggle = document.getElementById('timerToggle');
    const seasonTimer = document.getElementById('seasonTimer');
    const winnersToggle = document.getElementById('winnersToggle');
    const winnersElement = document.getElementById('winners');
    const staffToggle = document.getElementById('staffToggle');
    const staffElement = document.getElementById('admins-container');
    const lbToggle = document.getElementById('lbToggle');
    const casualToggle = document.getElementById('casualToggle');

    // If no cookies are found, enable everything
    timerToggle.checked = getCookie('showTimer') !== 'false';
    winnersToggle.checked = getCookie('showWinners') !== 'false';
    staffToggle.checked = getCookie('showStaff') !== 'false';
    lbToggle.checked = getCookie('lbToggle') !== 'false';
    casualToggle.checked = getCookie('casualToggle') !== 'false';

    // Should we display or hide elements
    seasonTimer.style.display = timerToggle.checked ? 'block' : 'none';
    winnersElement.style.display = winnersToggle.checked ? 'block' : 'none';
    staffElement.style.display = staffToggle.checked ? 'block' : 'none';

    // Then update visibility
    timerToggle.addEventListener('change', () => updateVisibility(timerToggle, seasonTimer, 'showTimer'));
    winnersToggle.addEventListener('change', () => updateVisibility(winnersToggle, winnersElement, 'showWinners'));
    staffToggle.addEventListener('change', () => updateVisibility(staffToggle, staffElement, 'showStaff'));
    lbToggle.addEventListener('change', () => updateVisibility(lbToggle, null, 'lbToggle'));
    casualToggle.addEventListener('change', () => updateVisibility(casualToggle, null, 'casualToggle'));

    // Timer functionality
    const timerDisplay = document.getElementById('timerDisplay');
    const endDateDisplay = document.getElementById('endDateDisplay');
    if (endDateDisplay) {
        endDateDisplay.textContent = `Season ends: ${formatDate(seasonEndDate)}`;
    }

    function formatDate(date) {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short'
        });
    }

    // Update timer and preload audio for season end
    preloadAudio();
    updateTimer();
    timerInterval = setInterval(updateTimer, 1000);

    function preloadAudio() {
        const files = [
            { name: 'season/season_end1', time: 145000 }, // 2:25
            { name: 'season/season_end2', time: 85000 },  // 1:25
            { name: 'season/season_end3', time: 30000 },  // 0:30
            { name: 'season/season_end_final', time: 0 }  // 0:00
        ];

        files.forEach(({ name, time }) => {
            const audio = new Audio(`media/sounds/${name}.mp3`);
            audio.timeThreshold = time;
            audio.volume = 0.4;
            audioElements[name] = audio;
        });

        // Ambience with no timer
        audioElements['season/season_end_ambience'] = new Audio(`media/sounds/season/season_end_ambience.mp3`);
        audioElements['season/season_end_ambience'].loop = true;
    }

    async function playAppropriateTrack(diff) {
        let trackToPlay = null;

        if (diff <= 0) {
            if (isDataReady) {
                endSeason();
            }
        } else if (diff <= 30000) { // 0:30
            trackToPlay = 'season/season_end3';
        } else if (diff <= 85000) { // 1:25
            trackToPlay = 'season/season_end2';
        } else if (diff <= 145000) { // 2:25
            trackToPlay = 'season/season_end1';
        }

        // If track changed
        if (trackToPlay && lastPlayed !== trackToPlay) {
            // Stop all tracks
            Object.values(audioElements).forEach(audio => {
                audio.pause();
                audio.currentTime = 0;
            });

            lastPlayed = trackToPlay;
            audioElements[trackToPlay].play().catch(e => {
                console.warn(`Couldn't play ${trackToPlay}:`, e);
            });

        }
    }

    // Same timer update
    function updateTimer() {
        const now = new Date();
        const diff = seasonEndDate - now;

        if (diff <= 0) {
            timerDisplay.textContent = "Season has ended! New season starting shortly...";
        } else {
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            timerDisplay.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        }

        playAppropriateTrack(diff);
    }

    // Season end screen
    async function endSeason() {
        clearInterval(timerInterval);
        const stats = calculateGlobalStats(leaderboardData);

        // When season end sound is over, play music and show video
        const endMusic = new Audio(`media/sounds/season/season_end_final.mp3`);
        endMusic.play();
        endMusic.addEventListener('ended', () => {
            const contMusic = new Audio('media/sounds/season/end_music.mp3');
            const videoBackground = document.querySelector('.video-background');

            contMusic.volume = 0.3;
            contMusic.loop = true;
            contMusic.play();

            setTimeout(() => {
                videoBackground.style.opacity = '0.5';
            }, 100);
        });

        const roundedBillions = Math.round(stats.totalSalesSum / 1_000_000_000);

        const overlay = document.createElement('div');
        overlay.id = 'seasonOverlay';
        overlay.innerHTML = `
        <div class="season-end-container animate__animated animate__fadeIn">
            <div class="video-background">
                <video autoplay muted loop playsinline>
                    <source src="media/season_end/test.mp4" type="video/mp4">
                </video>
            </div>

            <div class="season-header">
                <h1>SEASON ${seasons[0]} FINALE</h1>
                <p class="subtitle">The battle is over... for now.</p>
            </div>
            <div class="season-stats-grid">
                <!-- Left Block -->
                <div class="stats-block general-stats animate__animated animate__fadeInLeft">
                    <h2>Season ${seasons[0]} Statistics</h2>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-value">${leaderboardData.length}</div>
                            <div class="stat-label">WARRIORS</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${stats.totalRaids}</div>
                            <div class="stat-label">RAIDS</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${stats.totalKills}</div>
                            <div class="stat-label">KILLS</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${formatTime(stats.totalPlayTime)}</div>
                            <div class="stat-label">SPENT IN RAID</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${stats.averageSurvivalRate}%</div>
                            <div class="stat-label">AVG SURVIVAL</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${stats.mostPopularMap}</div>
                            <div class="stat-label">HOTTEST MAP</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${roundedBillions} Billion</div>
                            <div class="stat-label">RUBLES TRADED</div>
                        </div>
                    </div>
                </div>
                
                <!-- Right Block -->
                <div class="stats-block top-players animate__animated animate__fadeInRight">
                    <h2>Season MVPs</h2>
                    
                    <div class="player-card top-kd">
                        <div class="player-title">BEST K/D RATIO</div>
                        <div class="player-se-name">${stats.topKD.name}</div>
                        <div class="player-stats">
                            <span>${stats.topKD.killToDeathRatio.toFixed(0)}:1</span>
                            <span>${stats.topKD.pmcKills} kills</span>
                        </div>
                        <div class="player-additional">
                            ${stats.topKD.teamTag ? `[${stats.topKD.teamTag}]` : ''}
                            Level ${stats.topKD.pmcLevel}
                        </div>
                    </div>
                    
                    <div class="player-card top-kills">
                        <div class="player-title">MOST KILLS</div>
                        <div class="player-se-name">${stats.topKills.name}</div>
                        <div class="player-stats">
                            <span>${stats.topKills.pmcKills} PMC kills</span>
                            <span>${stats.topKills.scavKills || 0} SCAV kills</span>
                        </div>
                        <div class="player-additional">
                            ${stats.topKills.weaponMastery ? `Favorite weapon: ${stats.topKills.weaponMastery}` : ''}
                        </div>
                    </div>
                    
                    <div class="player-card top-survivor">
                        <div class="player-title">MOST TIME PLAYED</div>
                        <div class="player-se-name">${stats.topPlayTime.name}</div>
                        <div class="player-stats">
                            <span>${formatTime(stats.topPlayTime.totalPlayTime)}</span>
                            <span>${stats.topPlayTime.survivalRate}% SR</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Extra -->
            <div class="additional-stats animate__animated animate__fadeInUp animate__delay-5s">
                <h3>Interesting Facts</h3>
                <div class="facts-grid">
                    <div class="fact-card">
                        <div class="fact-icon"><img src="media/season_end/Mastering.png" width="20px" height="25px" style="position: relative; top: 5px;"></div>
                        <div class="fact-text">${stats.mostDeadlyWeapon} was the deadliest weapon</div>
                    </div>
                    <div class="fact-card">
                        <div class="fact-icon"><img src="media/season_end/icon_unique_id.png" width="25px" height="25px" style="position: relative; top: 5px;"></div>
                        <div class="fact-text">${stats.kappaOwners} players achieved Kappa container</div>
                    </div>
                    <div class="fact-card">
                        <div class="fact-icon"><img src="media/season_end/icon_statscategory_combat_0.png" width="25px" height="25px" style="position: relative; top: 5px;"></div>
                        <div class="fact-text">Longest shot: ${stats.longestShot}m by ${stats.longestShotPlayer}</div>
                    </div>
                    <div class="fact-card">
                        <div class="fact-icon"><img src="media/season_end/standing_icon.png" width="25px" height="25px" style="position: relative; top: 5px;"></div>
                        <div class="fact-text">${stats.richestTrader} was the most profitable trader</div>
                    </div>
                </div>
            </div>
            
            <div class="season-countdown animate__animated animate__fadeInUp animate__delay-5s">
                <p>New season begins shortly <img src="media/loading_bar.gif" width="20px" height="20px" style="position: relative; top: 5px;"></p>
            </div>
        </div>
    `;

        document.body.appendChild(overlay);
    }

    function calculateGlobalStats(players) {
        let totalKills = 0;
        let totalDeaths = 0;
        let totalPlayTime = 0;
        let totalRaids = 0;
        let totalSurvived = 0;
        let kappaOwners = 0;
        let totalSurvivalRate = 0;
        let validPlayersCount = 0;

        const weaponStats = {};
        const mapStats = {};
        const traderStats = {};

        let topKD = null;
        let topKills = null;
        let topPlayTime = null;
        let longestShot = 0;
        let longestShotPlayer = null;
        let totalSalesSum = 0;
        let topKillsWeapon = "Unknown";
        let topKillsWeaponCount = 0;

        players.forEach(player => {
            if (!player.banned) {
                const kd = (player.killToDeathRatio && player.pmcRaids > 50) ?? 0;
                const kills = player.pmcKills ?? 0;
                const deaths = player.pmcDeaths ?? 0;
                const playTime = player.totalPlayTime ?? 0;
                const raids = player.pmcRaids ?? 0;
                const survived = player.pmcSurvived ?? 0;

                totalKills += kills;
                totalDeaths += deaths;
                totalPlayTime += playTime;
                totalRaids += raids;
                totalSurvived += survived;

                if (player.traderInfo) {
                    for (const trader in player.traderInfo) {
                        const data = player.traderInfo[trader];
                        if (data.salesSum && data.salesSum > 0) {
                            totalSalesSum += data.salesSum;
                        }
                    }
                }

                if (player.modWeaponStats) {
                    for (const playerId in player.modWeaponStats) {
                        const weapons = player.modWeaponStats[playerId];
                        for (const weaponName in weapons) {
                            const weapon = weapons[weaponName];
                            const weaponKills = weapon.stats.kills;

                            weaponStats[weaponName] = (weaponStats[weaponName] || 0) + weaponKills;

                            //topKillsWeapon
                            if (weaponKills > topKillsWeaponCount) {
                                topKillsWeaponCount = weaponKills;
                                topKillsWeapon = weaponName;
                            }
                        }
                    }
                }

                if (player.lastRaidMap) {
                    mapStats[player.lastRaidMap] = (mapStats[player.lastRaidMap] || 0) + 1;
                }

                if (player.traderInfo) {
                    Object.entries(player.traderInfo).forEach(([trader, data]) => {
                        if (data.salesSum > 0) {
                            traderStats[trader] = (traderStats[trader] || 0) + data.salesSum;
                        }
                    });
                }

                if (player.survivalRate !== undefined && player.survivalRate !== null) {
                    totalSurvivalRate += player.survivalRate;
                    validPlayersCount++;
                }

                if (player.hasKappa) kappaOwners++;

                if (player.longestShot > longestShot) {
                    longestShot = player.longestShot;
                    longestShotPlayer = player.name;
                }

                if (!topKD || kd > topKD.killToDeathRatio) topKD = player;
                if (!topKills || kills > topKills.pmcKills) topKills = player;
                if (!topPlayTime || playTime > topPlayTime.totalPlayTime) topPlayTime = player;
            }
        });

        let mostDeadlyWeapon = "Unknown";
        if (Object.keys(weaponStats).length > 0) {
            mostDeadlyWeapon = Object.entries(weaponStats).sort((a, b) => b[1] - a[1])[0][0];
        }

        let mostPopularMap = "Unknown";
        if (Object.keys(mapStats).length > 0) {
            mostPopularMap = Object.entries(mapStats).sort((a, b) => b[1] - a[1])[0][0];
        }

        let richestTrader = "Unknown";
        if (Object.keys(traderStats).length > 0) {
            richestTrader = Object.entries(traderStats).sort((a, b) => b[1] - a[1])[0][0];
        }

        const averageSurvivalRate = validPlayersCount > 0 ? totalSurvivalRate / validPlayersCount : 0;

        return {
            totalKills,
            totalDeaths,
            totalPlayTime,
            totalRaids,
            averageSurvivalRate: averageSurvivalRate.toFixed(1),
            kappaOwners,
            topKD,
            topKills,
            topPlayTime,
            mostDeadlyWeapon,
            mostPopularMap,
            richestTrader,
            longestShot,
            longestShotPlayer,
            totalSalesSum,
            topKillsWeapon: topKillsWeapon
        };
    }

    function formatTime(seconds) {
        const months = Math.floor(seconds / (3600 * 24 * 30));
        const days = Math.floor((seconds % (3600 * 24 * 30)) / (3600 * 24));
        const hours = Math.floor((seconds % (3600 * 24)) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        let result = [];
        if (months > 0) result.push(`${months}mo`);
        if (days > 0) result.push(`${days}d`);
        if (hours > 0) result.push(`${hours}h`);
        if (minutes > 0 && months === 0) result.push(`${minutes}m`);

        return result.join(' ') || '0m';
    }

});

// Saver functions
function setCookie(name, value) {
    localStorage.setItem(name, value);
    document.cookie = `${name}=${value}; path=/; max-age=31536000`;
}

function getCookie(name) {
    // Try to grab setting from localstorage
    const fromStorage = localStorage.getItem(name);
    if (fromStorage !== null) {
        return fromStorage;
    }

    // If not, find a cookie
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        cookie = cookie.trim();
        if (cookie.startsWith(name + '=')) {
            const value = cookie.substring(name.length + 1);
            localStorage.setItem(name, value);
            return value;
        }
    }

    return '';
}