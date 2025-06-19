//     _____ ____  ______   __    _________    ____  __________  ____  ____  ___    ____  ____ 
//    / ___// __ \/_  __/  / /   / ____/   |  / __ \/ ____/ __ \/ __ )/ __ \/   |  / __ \/ __ \
//    \__ \/ /_/ / / /    / /   / __/ / /| | / / / / __/ / /_/ / __  / / / / /| | / /_/ / / / /  
//   ___/ / ____/ / /    / /___/ /___/ ___ |/ /_/ / /___/ _, _/ /_/ / /_/ / ___ |/ _, _/ /_/ / 
//  /____/_/     /_/    /_____/_____/_/  |_/_____/_____/_/ |_/_____/\____/_/  |_/_/ |_/_____/  

function initLastRaids(player, container) {
    const closeBtn = document.getElementById('close-raids-stats');
    const modal = document.getElementById('raids-stats-modal');
    const loadingSpinner = document.getElementById('loading-spinner');
    const statsContainer = document.getElementById('raids-stats-container');
    const showBtn = document.getElementById('show-raids-stats');

    const plprofile = document.getElementById('playerProfileModal');
    const closeProfileBtn = plprofile.querySelector('.profile-close-btn');

    const raidHistory = document.getElementById('raids-stats-modal');
    raidHistory.classList.remove('theme-dark', 'theme-light', 'theme-gradient', 'theme-default', 'theme-redshade', 'theme-steelshade');
    raidHistory.classList.add(`theme-${player.profileTheme?.toLowerCase() ? player.profileTheme?.toLowerCase() : 'default'}`);

    container.style.right = '0';
    closeProfileBtn.style.right = '30px';

    showBtn.addEventListener('click', function () {
        modal.style.display = 'block';
        loadingSpinner.style.display = 'flex';
        statsContainer.style.display = 'none';

        // Move player profile to the right and last raids to left
        // And also a close button (fuckass CSS)
        container.style.right = '200px';
        modal.style.left = '1200px';
        closeProfileBtn.style.right = '230px';

        fetchPlayerRaids();
    });

    closeBtn.addEventListener('click', function () {
        modal.style.display = 'none';
        container.style.right = '0';
        closeProfileBtn.style.right = '30px';
    });

    modal.addEventListener('click', function (e) {
        if (e.target === modal) {
            modal.style.display = 'none';
            container.style.right = '0';
            closeProfileBtn.style.right = '30px';
        }
    });

    function fetchPlayerRaids() {
        // /fallbacks/shared/player_raids.json
        fetch(`https://visuals.nullcore.net/SPT/data/shared/player_raids.json`)
            .then(response => response.json())
            .then(data => {
                loadingSpinner.style.display = 'none';
                statsContainer.style.display = 'block';

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
                loadingSpinner.style.display = 'none';
                statsContainer.innerHTML = '<p style="color: #ff4444;">Error loading raid data :(</p>';
                statsContainer.style.display = 'block';
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

            html += `
                <div class="last-raid-feed ${raid.lastRaidRanThrough ? 'run-through-bg' : raid.discFromRaid ? 'disconnected-bg' : raid.isTransition ? 'transit-bg' : raid.lastRaidSurvived ? 'survived-bg' : 'died-bg'}" style="margin-bottom: 20px; padding: 15px; border-radius: 5px;">
                    <h3 class="section-title ${raid.lastRaidRanThrough ? 'run-through' : raid.discFromRaid ? 'disconnected' : raid.isTransition ? 'transit' : raid.lastRaidSurvived ? 'survived' : 'died'}" style="margin-top: 0;">
                        Raid on ${new Date(raid.absoluteLastTime * 1000).toLocaleString()}
                    </h3>

                    <div class="raid-overview" style="margin-bottom: 10px;">
                        <span class="raid-result ${raid.lastRaidRanThrough ? 'run-through' : raid.discFromRaid ? 'disconnected' : raid.isTransition ? 'transit' : raid.lastRaidSurvived ? 'survived' : 'died'}" style="font-weight: bold;">
                            ${raid.lastRaidRanThrough ? `<em class="bx bx-walk"></em> Runner` : raid.discFromRaid ? `<em class="bx bxs-log-out"></em> Left` : raid.isTransition ? `<i class="bx bx-loader-alt bx-spin" style="line-height: 0 !important;"></i> In Transit (${raid.lastRaidMap}
                            <em class="bx bxs-chevrons-right" style="position: relative; top: 2px;"></em> ${raid.lastRaidTransitionTo || 'Unknown'})` : raid.lastRaidSurvived ? `<em class="bx bx-walk"></em> Survived` : `
                            <em class="bx bxs-skull"></em> Killed in Action`}
                        </span>
                        <span class="raid-meta" style="display: block; color: #aaa; font-size: 0.9em;">
                            ${raid.lastRaidMap || 'Unknown'} • ${raid.lastRaidAs || 'N/A'} • ${lastRaidDuration || '00:00'} • ${lastRaidAgo}
                        </span>
                    </div>

                    <div class="raid-stats-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
                        <div class="raid-stat-block">
                            <span class="profile-stat-label" style="display: block; font-size: 0.8em; ">PMC Kills:</span>
                            <span class="profile-stat-value" style="font-weight: bold;">${raid.raidKills ?? 0}</span>
                        </div>
                        <div class="raid-stat-block">
                            <span class="profile-stat-label" style="display: block; font-size: 0.8em;">Damage:</span>
                            <span class="profile-stat-value" style="font-weight: bold;">${raid.raidDamage ?? 0}</span>
                        </div>
                        <div class="raid-stat-block">
                            <span class="profile-stat-label" style="display: block; font-size: 0.8em;">Player Hits:</span>
                            <span class="profile-stat-value" style="font-weight: bold;">${raid.lastRaidHits ?? 0}</span>
                        </div>
                        <div class="raid-stat-block">
                            <span class="profile-stat-label" style="display: block; font-size: 0.8em;">Loot EXP:</span>
                            <span class="profile-stat-value" style="font-weight: bold;">${raid.lastRaidEXP ?? 0}</span>
                        </div>
                    </div>
                </div>
            `;
        });

        statsContainer.innerHTML = html;
    }
}