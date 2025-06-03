const seasonEndDate = new Date(2025, 5, 33, 1, 1, 1);
let audioElements = {};
let lastPlayed = null;
let timerInterval;

document.addEventListener('DOMContentLoaded', () => {
    const timerToggle = document.getElementById('timerToggle');
    const seasonTimer = document.getElementById('seasonTimer');
    const timerDisplay = document.getElementById('timerDisplay');
    const endDateDisplay = document.getElementById('endDateDisplay');

    if (endDateDisplay) {
        endDateDisplay.textContent = `Season ends: ${formatDate(seasonEndDate)}`;
    }

    timerToggle.checked = getCookie('showTimer') === 'true';
    seasonTimer.style.display = timerToggle.checked ? 'block' : 'none';

    preloadAudio();
    updateTimer();
    timerInterval = setInterval(updateTimer, 1000);

    timerToggle.addEventListener('change', () => {
        setCookie('showTimer', timerToggle.checked);
        seasonTimer.style.display = timerToggle.checked ? 'block' : 'none';
    });

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
            audio.volume = 0.30;
            audioElements[name] = audio;
        });

        // Ambience with no timer
        audioElements['season/season_end_ambience'] = new Audio(`media/sounds/season/season_end_ambience.mp3`);
        audioElements['season/season_end_ambience'].loop = true;
    }

    function playAppropriateTrack(diff) {
        let trackToPlay = null;

        if (diff <= 0) {
            if (lastPlayed !== trackToPlay) {
                if (leaderboardData && leaderboardData?.length > 0) {
                    if (getCookie('haveSeenSeasonEnd') == false) {
                        // Stopping all sounds
                        Object.values(audioElements).forEach(audio => {
                            audio.pause();
                            audio.currentTime = 0;
                        });

                        // Playing exactly end final
                        audioElements['season/season_end_final'].play();

                        setCookie('haveSeenSeasonEnd', true);
                    

                    endSeason();
                }
            }

            // We didn't play anything so play ambience (late join)
            if (!lastPlayed) {
                trackToPlay = 'season/season_end_ambience';
            }
        } else if (diff <= 31000) {
            trackToPlay = 'season/season_end3';
        } else if (diff <= 86000) {
            trackToPlay = 'season/season_end2';
        } else if (diff <= 146000) {
            trackToPlay = 'season/season_end1';
        }

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
    function endSeason() {
        clearInterval(timerInterval);

        const stats = calculateGlobalStats(leaderboardData)

        const overlay = document.createElement('div');
        overlay.id = 'seasonOverlay';
        overlay.innerHTML = `
        <div class="season-end-container animate__animated animate__fadeIn">
            <div class="season-header">
                <h1 class="animate__animated animate__fadeInDown animate__slow">SEASON FINALE</h1>
                <p class="subtitle animate__animated animate__fadeInUp animate__slow">The battle is over... for now.</p>
            </div>
            
            <div class="season-stats-grid">
                <!-- Left Block -->
                <div class="stats-block general-stats animate__animated animate__fadeInLeft  animate__delay-1s">
                    <h2>Global Statistics</h2>
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
                            <div class="stat-label">PLAY TIME</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${stats.averageSurvivalRate}%</div>
                            <div class="stat-label">AVG SURVIVAL</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${stats.mostPopularMap}</div>
                            <div class="stat-label">HOTTEST MAP</div>
                        </div>
                    </div>
                </div>
                
                <!-- Right Block -->
                <div class="stats-block top-players animate__animated animate__fadeInRight  animate__delay-3s">
                    <h2>Honorable Mentions</h2>
                    
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
                        <div class="fact-icon">💀</div>
                        <div class="fact-text">${stats.mostDeadlyWeapon} was the deadliest weapon</div>
                    </div>
                    <div class="fact-card">
                        <div class="fact-icon">🏆</div>
                        <div class="fact-text">${stats.kappaOwners} players achieved Kappa container</div>
                    </div>
                    <div class="fact-card">
                        <div class="fact-icon">🏹</div>
                        <div class="fact-text">Longest shot: ${stats.longestShot}m by ${stats.longestShotPlayer}</div>
                    </div>
                    <div class="fact-card">
                        <div class="fact-icon">💰</div>
                        <div class="fact-text">${stats.richestTrader} was the most profitable trader</div>
                    </div>
                </div>
            </div>
            
            <div class="season-countdown animate__animated animate__fadeInUp animate__delay-5s">
                <p>New season begins shortly...</p>
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

        const weaponStats = {};
        const mapStats = {};
        const traderStats = {};

        let topKD = null;
        let topKills = null;
        let topPlayTime = null;
        let longestShot = 0;
        let longestShotPlayer = null;

        players.forEach(player => {
            if (!player.disqualified && !player.banned) {
                const kd = player.killToDeathRatio ?? 0;
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

                if (player.modWeaponStats?.bestWeapon) {
                    const weapon = player.modWeaponStats.bestWeapon.name;
                    weaponStats[weapon] = (weaponStats[weapon] || 0) + player.modWeaponStats.bestWeapon.stats.kills;
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

        return {
            totalKills,
            totalDeaths,
            totalPlayTime,
            totalRaids,
            averageSurvivalRate: Math.round((totalSurvived / totalRaids) * 100) || 0,
            kappaOwners,
            topKD,
            topKills,
            topPlayTime,
            mostDeadlyWeapon,
            mostPopularMap,
            richestTrader,
            longestShot,
            longestShotPlayer,
            topKillsWeapon: topKills?.modWeaponStats?.bestWeapon?.name || "Unknown",
        };
    }

    function formatTime(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}h ${m}m`;
    }

});

// Cookie helpers (yes again I DONT KNOW HELP)
function setCookie(name, value) {
    document.cookie = `${name}=${value}; path=/`;
}

function getCookie(name) {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        cookie = cookie.trim();
        if (cookie.startsWith(name + '=')) {
            return cookie.substring(name.length + 1);
        }
    }
    return '';
}