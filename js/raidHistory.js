//     _____ ____  ______   __    _________    ____  __________  ____  ____  ___    ____  ____ 
//    / ___// __ \/_  __/  / /   / ____/   |  / __ \/ ____/ __ \/ __ )/ __ \/   |  / __ \/ __ \
//    \__ \/ /_/ / / /    / /   / __/ / /| | / / / / __/ / /_/ / __  / / / / /| | / /_/ / / / /  
//   ___/ / ____/ / /    / /___/ /___/ ___ |/ /_/ / /___/ _, _/ /_/ / /_/ / ___ |/ _, _/ /_/ / 
//  /____/_/     /_/    /_____/_____/_/  |_/_____/_____/_/ |_/_____/\____/_/  |_/_/ |_/_____/  

async function initLastRaids(playerId) {
    const statsContainer = document.getElementById('raids-stats-container');
    if (!statsContainer) {
        console.error('Container element not found');
        return;
    }

    // Show loader
    statsContainer.innerHTML = `
                        <div class="loader-glass">
                        <div class="loader-content" id="main-profile-loader">
                            <img src="media/loading_bar.gif" width="30" height="30" class="loader-icon">
                            <h3 class="loader-text">Crunching latest data for you...</h3>
                            <div class="loader-progress">
                                <div class="progress-bar"></div>
                            </div>
                        </div>
                    </div>`;

    try {
        const playerRaidsPath = `${lastRaidsPath}${playerId}.json?t=${Date.now()}`;
        const response = await fetch(playerRaidsPath);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data?.raids?.length) {
            closeLoader();
            statsContainer.innerHTML = '<p class="error-raid-load">No raid data available for this player :(</p>';
            return;
        }

        const sortedRaids = data.raids.sort((a, b) =>
            b.absoluteLastTime - a.absoluteLastTime
        );

        renderRaidsStats(sortedRaids);
    } catch (error) {
        closeLoader();
        statsContainer.innerHTML = '<p class="error-raid-load">Error loading raid data :(</p>';
    }
}

// Render raids
function renderRaidsStats(raids) {
    if (!raids?.length) {
        statsContainer.innerHTML = '<p class="error-raid-load">No raid data available</p>';
        return;
    }

    const statsContainer = document.getElementById('raids-stats-container');
    const recentStatsContainer = document.getElementById('recent-raids-stats');
    const recentStats = calculateRecentStats(raids);

    let html = '';
    let recentStatsHtml = `
        <div class="recent-stats-header">
            <h3>Last ${raids.length} Raids Summary</h3>
        </div>
        <div class="recent-stats-grid">
            <div class="stat-card">
                <div class="stat-value">${recentStats.survivalRate}%</div>
                <div class="stat-label">Survival Rate</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${recentStats.avgKills}</div>
                <div class="stat-label">Avg Kills/Raid</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${recentStats.totalKills}</div>
                <div class="stat-label">Total Kills</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${recentStats.avgDamage}</div>
                <div class="stat-label">Avg Damage</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${recentStats.totalEXP}</div>
                <div class="stat-label">Total EXP</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${recentStats.totalLC}</div>
                <div class="stat-label">Total LC Earned</div>
            </div>
        </div>
    `;

    raids.forEach(raid => {
        const lastRaidDuration = formatSeconds(raid.raidTime);
        const lastRaidAgo = formatLastPlayedRaid(raid.absoluteLastTime);
        let shouldShowStats = true;

        if (raid.raidKills == 0 && raid.scavsKilled == 0 && raid.bossesKilled == 0 && raid.raidDamage < 100 && raid.lastRaidHits == 0 && raid.lastRaidEXP < 100) {
            shouldShowStats = false;
        }

        html += `
                <div class="last-raid-feed ${raid.lastRaidRanThrough ? 'run-through-bg' : raid.discFromRaid ? 'disconnected-bg' : raid.isTransition ? 'transit-bg' : raid.lastRaidSurvived ? 'survived-bg' : 'died-bg'}">
                    
                    <div class="last-raid-full-background">
                        <img src="media/leaderboard_icons/maps/${raid.lastRaidMap}.png">
                    </div>

                    <h3 class="section-title ${raid.lastRaidRanThrough ? 'run-through' : raid.discFromRaid ? 'disconnected' : raid.isTransition ? 'transit' : raid.lastRaidSurvived ? 'survived' : 'died'}" style="margin-top: 0;">
                        Raid on ${new Date(raid.absoluteLastTime * 1000).toLocaleString()}
                    </h3>

                    <div style="margin-bottom: 10px;">
                    <div class="last-raid-map ${raid.lastRaidRanThrough ? 'run-through-border' : raid.discFromRaid ? 'disconnected-border' : raid.isTransition ? 'transit-border' : raid.lastRaidSurvived ? 'survived-border' : 'died-border'}">
                        <img src="media/leaderboard_icons/maps/${raid.lastRaidMap}.png">
                    </div>

                        <span class="raid-result ${raid.lastRaidRanThrough ? 'run-through' : raid.discFromRaid ? 'disconnected' : raid.isTransition ? 'transit' : raid.lastRaidSurvived ? 'survived' : 'died'}" style="font-weight: bold;">
                            ${raid.lastRaidRanThrough ? `<i class='bx bxs-walking'></i> Runner` : raid.discFromRaid ? `<i class='bx bxs-arrow-out-left-square-half'></i> Left` : raid.isTransition ? `<span> <i class='bx bxs-refresh-cw bx-spin'></i> </span> In Transit (${raid.lastRaidMap}
                            <em class="bx bxs-chevrons-right" style="position: relative; top: 2px;"></em> ${raid.lastRaidTransitionTo || 'Unknown'})` : raid.lastRaidSurvived ? `<i class='bx bxs-walking'></i> Survived` : `
                            <i class="fa-solid fa-skull-crossbones"></i> Killed in Action`}
                        </span>
                        <span class="raid-meta">
                            ${raid.lastRaidMap || 'Unknown'} • ${raid.lastRaidAs || 'N/A'} • ${lastRaidDuration || '00:00'} • LC Earned: <span class="lb-coins">+${raid.lcPointsEarned ? raid.lcPointsEarned : 0}</span> • ${lastRaidAgo || 'Just Now'} ${raid.lastRaidSurvived || raid.lastRaidRanThrough || raid.discFromRaid || raid.isTransition || raid.agressorName == null ? `` : `• Killed by <span class="raid-killer">${raid.agressorName}</span>`}
                        </span>
                    </div>

                    ${shouldShowStats ?
                `<div class="raid-stats-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;">
                        <div class="raid-stat-block">
                            <span class="profile-stat-label">PMC Kills:</span>
                            <span class="profile-stat-value">${raid.raidKills ?? 0}</span>
                        </div>
                        <div class="raid-stat-block">
                            <span class="profile-stat-label">SCAV Kills:</span>
                            <span class="profile-stat-value">${raid.scavsKilled ?? 0}</span>
                        </div>
                        <div class="raid-stat-block">
                            <span class="profile-stat-label">Boss Kills:</span>
                            <span class="profile-stat-value">${raid.bossesKilled ?? 0}</span>
                        </div>
                        <div class="raid-stat-block">
                            <span class="profile-stat-label">Damage:</span>
                            <span class="profile-stat-value">${raid.raidDamage ?? 0}</span>
                        </div>
                        <div class="raid-stat-block">
                            <span class="profile-stat-label">Player Hits:</span>
                            <span class="profile-stat-value">${raid.lastRaidHits ?? 0}</span>
                        </div>
                        <div class="raid-stat-block">
                            <span class="profile-stat-label">Loot EXP:</span>
                            <span class="profile-stat-value">${raid.lastRaidEXP ?? 0}</span>
                        </div>
                    </div>`
                : ``}
                </div>
            `;
    });

    statsContainer.innerHTML = html;
    recentStatsContainer.innerHTML = recentStatsHtml;
}

function calculateRecentStats(raids) {
    const stats = {
        totalKills: 0,
        totalDamage: 0,
        totalEXP: 0,
        totalLC: 0,
        survived: 0,
        runs: raids.length
    };

    raids.forEach(raid => {
        stats.totalKills += (raid.raidKills || 0) + (raid.scavsKilled || 0) + (raid.bossesKilled || 0);
        stats.totalDamage += raid.raidDamage || 0;
        stats.totalEXP += raid.lastRaidEXP || 0;
        stats.totalLC += raid.lcPointsEarned || 0;

        if (raid.lastRaidSurvived || raid.lastRaidRanThrough || raid.discFromRaid || raid.isTransition) {
            stats.survived++;
        }
    });

    return {
        survivalRate: Math.round((stats.survived / stats.runs) * 100),
        avgKills: (stats.totalKills / stats.runs).toFixed(1),
        totalKills: stats.totalKills,
        avgDamage: Math.round(stats.totalDamage / stats.runs),
        totalEXP: stats.totalEXP.toLocaleString(),
        totalLC: stats.totalLC.toLocaleString()
    };
}