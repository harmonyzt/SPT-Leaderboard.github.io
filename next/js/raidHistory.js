//     _____ ____  ______   __    _________    ____  __________  ____  ____  ___    ____  ____ 
//    / ___// __ \/_  __/  / /   / ____/   |  / __ \/ ____/ __ \/ __ )/ __ \/   |  / __ \/ __ \
//    \__ \/ /_/ / / /    / /   / __/ / /| | / / / / __/ / /_/ / __  / / / / /| | / /_/ / / / /  
//   ___/ / ____/ / /    / /___/ /___/ ___ |/ /_/ / /___/ _, _/ /_/ / /_/ / ___ |/ _, _/ /_/ / 
//  /____/_/     /_/    /_____/_____/_/  |_/_____/_____/_/ |_/_____/\____/_/  |_/_/ |_/_____/  

async function initLastRaids(player) {
    const statsContainer = document.getElementById('raids-stats-container');

    fetchPlayerRaids();

    async function fetchPlayerRaids() {
        fetch(`${lastRaidsPath}`)
            .then(response => response.json())
            .then(data => {
                if (data.raids && data.raids[player.id]) {
                    const playerRaids = data.raids[player.id].sort((a, b) =>
                        new Date(b.absoluteLastTime) - new Date(a.absoluteLastTime)
                    );
                    renderRaidsStats(playerRaids);
                } else {
                    statsContainer.innerHTML = '<p>No raid data available for this player :(</p>';
                }
            })
            .catch(error => {
                console.error('Error fetching raid data:', error);
                statsContainer.innerHTML = '<p class="error-raid-load">Error loading raid data :(</p>';
            });
    }

    // Render raids
    function renderRaidsStats(raids) {
        if (!raids || raids.length === 0) {
            statsContainer.innerHTML = '<p>No raid data available</p>';
            return;
        }

        let html = '';
        raids.forEach(raid => {
            const lastRaidDuration = formatSeconds(raid.raidTime);
            const lastRaidAgo = formatLastPlayedRaid(raid.absoluteLastTime);
            let shouldShowStats = true;

            if(raid.raidKills == 0 && raid.scavsKilled == 0 && raid.bossesKilled == 0 && raid.raidDamage == 0 && raid.lastRaidHits == 0 && raid.lastRaidEXP < 100 ){
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
                            <em class="bx bxs-skull"></em> Killed in Action`}
                        </span>
                        <span class="raid-meta">
                            ${raid.lastRaidMap || 'Unknown'} • ${raid.lastRaidAs || 'N/A'} • ${lastRaidDuration || '00:00'} • ${lastRaidAgo || 'Just Now' } ${raid.lastRaidSurvived || raid.lastRaidRanThrough ? `` : `• Killed by <span class="raid-killer">${raid.agressorName}</span>`}
                        </span>
                    </div>

                    ${shouldShowStats?
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

    }
}