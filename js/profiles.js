let openedPlayerData = [];

function openProfile(playerId) {
    const modal = document.getElementById('playerProfileModal');
    const modalContent = document.getElementById('modalPlayerInfo');

    modalContent.innerHTML = '';

    // If no id data-player-id="0" (shouldn't be happening)
    if (!playerId || playerId === '0') {
        showPrivateProfile(modalContent, "Unknown Player");
        modal.style.display = 'flex';
        setupModalCloseHandlers(modal);
        return;
    }

    // Finding Player in data
    const player = leaderboardData.find(p => p.id === playerId);

    // Couldn't find
    if (!player) {
        showPrivateProfile(modalContent, "Player Not Found");
        modal.style.display = 'flex';
        setupModalCloseHandlers(modal);
        return;
    }

    const isPublic = player.publicProfile;

    // If disqualified
    if (player.disqualified) {
        modal.style.display = 'flex';
        showDisqualProfile(modalContent, player);
        setupModalCloseHandlers(modal, player);
        return;
    }

    // Privated profile
    if (!isPublic) {
        modal.style.display = 'flex';
        showPrivateProfile(modalContent, player);
        setupModalCloseHandlers(modal, player);
        return;
    }

    // Showing public profile
    showPublicProfile(modalContent, player);
    openedPlayerData = player;
    modal.style.display = 'flex';
    setupModalCloseHandlers(modal);
}

// Private profile HTML
function showPrivateProfile(container, player) {
    const profileModal = document.querySelector('.profile-modal-content');
    profileModal.classList.add('theme-default');

    container.innerHTML = `
   <div class="profile-grid-layout banned">
      <!-- Main -->
      <div class="profile-main-card">
        <img src="media/default_avatar.png" class="player-avatar">
        <div class="player-status">
          <div class="status-indicator status-offline"></div>
          <span>Offline</span>
        </div>
        <h2 class="profile-player-name">${player.name}</h2>
          <div class="player-about">Hello!</div>
        <div class="player-reg-date">
          <span class="reg-date-text">Registered: 12.12.2000</span>
        </div>
        <div class="badges-container">
        </div>
      </div>

      <!-- Last Raid -->
      <div class="last-raid-feed">
        <h3 class="section-title">Last Raid</h3>
        <div class="raid-stats-grid">
          <div class="raid-stat-block">
            <span class="profile-profile-stat-label">Map</span>
            <span class="profile-stat-value">Factory</span>
          </div>
          <div class="raid-stat-block">
            <span class="profile-stat-label">Result:</span>
            <span class="profile-stat-value died">
              Died
            </span>
          </div>
          <div class="raid-stat-block">
            <span class="profile-stat-label">Kills:</span>
            <span class="profile-stat-value">1</span>
          </div>
          <div class="raid-stat-block">
            <span class="profile-stat-label">Damage:</span>
            <span class="profile-stat-value">76</span>
          </div>
          <div class="raid-stat-block">
            <span class="profile-stat-label">Duration:</span>
            <span class="profile-stat-value">3:00</span>
          </div>
          <div class="raid-stat-block">
            <span class="profile-stat-label">Loot Value:</span>
            <span class="profile-stat-value">₽394</span>
          </div>
        </div>
      </div>

      <div class="stats-blocks">
        <!-- PMC Block -->
        <div class="stat-block pmc-block">
          <h3 class="section-title">PMC</h3>
          <div class="stat-row">
            <span class="profile-stat-label">Level</span>
            <span class="profile-stat-value">30</span>
          </div>
          <div class="stat-row">
            <span class="profile-stat-label">K/D Ratio</span>
            <span class="profile-stat-value">4</span>
          </div>
          <div class="stat-row">
            <span class="profile-stat-label">Raids</span>
            <span class="profile-stat-value">10</span>
          </div>
          <div class="stat-row">
            <span class="profile-stat-label">Survival</span>
            <span class="profile-stat-value">55%</span>
          </div>
        </div>

        <!-- SCAV Block -->
        <div class="stat-block scav-block">
          <h3 class="section-title">SCAV</h3>
          <div class="stat-row">
            <span class="profile-stat-label">Level</span>
            <span class="profile-stat-value">3</span>
          </div>
          <div class="stat-row">
            <span class="profile-stat-label">Raids</span>
            <span class="profile-stat-value">6</span>
          </div>
          <div class="stat-row">
            <span class="profile-stat-label">Survival</span>
            <span class="profile-stat-value">57%</span>
          </div>
          <div class="stat-row">
            <span class="profile-stat-label">K/D Ratio</span>
            <span class="profile-stat-value">4</span>
          </div>
        </div>
      </div>
    </div>
      
      <div class="private-profile-overlay">
        <div class="private-profile-content">
          <div class="lock-icon">🔒</div>
          <h3>Private Profile</h3>
          <p>This player has chosen to keep their stats hidden</p>
          <div class="private-profile-hint">
            <span>Stats behind are simulated</span>
          </div>
        </div>
      </div>
    </div>

    `;
}

// Disqualified profile HTML
function showDisqualProfile(container, player) {
    const profileModal = document.querySelector('.profile-modal-content');
    profileModal.classList.add('theme-default');

    container.innerHTML = `
    <div class="profile-grid-layout banned">
      <!-- Main -->
      <div class="profile-main-card">
        <img src="media/default_avatar.png" class="player-avatar">
        <div class="player-status">
          <div class="status-indicator status-offline"></div>
          <span>Offline</span>
        </div>
        <h2 class="profile-player-name">${player.name}</h2>
          <div class="player-about">Hello!</div>
        <div class="player-reg-date">
          <span class="reg-date-text">Registered: 12.12.2000</span>
        </div>
        <div class="badges-container">
        </div>
      </div>

      <!-- Last Raid -->
      <div class="last-raid-feed">
        <h3 class="section-title">Last Raid</h3>
        <div class="raid-stats-grid">
          <div class="raid-stat-block">
            <span class="profile-profile-stat-label">Map</span>
            <span class="profile-stat-value">Factory</span>
          </div>
          <div class="raid-stat-block">
            <span class="profile-stat-label">Result:</span>
            <span class="profile-stat-value died">
              Died
            </span>
          </div>
          <div class="raid-stat-block">
            <span class="profile-stat-label">Kills:</span>
            <span class="profile-stat-value">1</span>
          </div>
          <div class="raid-stat-block">
            <span class="profile-stat-label">Damage:</span>
            <span class="profile-stat-value">76</span>
          </div>
          <div class="raid-stat-block">
            <span class="profile-stat-label">Duration:</span>
            <span class="profile-stat-value">3:00</span>
          </div>
          <div class="raid-stat-block">
            <span class="profile-stat-label">Loot Value:</span>
            <span class="profile-stat-value">₽394</span>
          </div>
        </div>
      </div>

      <div class="stats-blocks">
        <!-- PMC Block -->
        <div class="stat-block pmc-block">
          <h3 class="section-title">PMC</h3>
          <div class="stat-row">
            <span class="profile-stat-label">Level</span>
            <span class="profile-stat-value">30</span>
          </div>
          <div class="stat-row">
            <span class="profile-stat-label">K/D Ratio</span>
            <span class="profile-stat-value">4</span>
          </div>
          <div class="stat-row">
            <span class="profile-stat-label">Raids</span>
            <span class="profile-stat-value">10</span>
          </div>
          <div class="stat-row">
            <span class="profile-stat-label">Survival</span>
            <span class="profile-stat-value">55%</span>
          </div>
        </div>

        <!-- SCAV Block -->
        <div class="stat-block scav-block">
          <h3 class="section-title">SCAV</h3>
          <div class="stat-row">
            <span class="profile-stat-label">Level</span>
            <span class="profile-stat-value">3</span>
          </div>
          <div class="stat-row">
            <span class="profile-stat-label">Raids</span>
            <span class="profile-stat-value">6</span>
          </div>
          <div class="stat-row">
            <span class="profile-stat-label">Survival</span>
            <span class="profile-stat-value">57%</span>
          </div>
          <div class="stat-row">
            <span class="profile-stat-label">K/D Ratio</span>
            <span class="profile-stat-value">4</span>
          </div>
        </div>
      </div>
    </div>
      
      <div class="private-profile-overlay">
        <div class="private-profile-content">
          <div class="lock-icon">👻</div>
          <h3>Banned Profile</h3>
          <p>This player was banned. Huzzah!</p>
          <div class="private-profile-hint">
            <span>Stats behind are simulated</span>
          </div>
        </div>
      </div>
    </div>
    `;
}

// To 00:00
function formatSeconds(seconds) {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
}

// Public profile
function showPublicProfile(container, player) {
    const regDate = player.registrationDate
        ? new Date(player.registrationDate * 1000).toLocaleDateString('en-EN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
        : 'Unknown';

    // Profile Theme
    const profileModal = document.querySelector('.profile-modal-content');

    profileModal.classList.remove('theme-dark', 'theme-light', 'theme-gradient', 'theme-default');
    profileModal.classList.add(`theme-${player.profileTheme?.toLowerCase() ? player.profileTheme?.toLowerCase() : 'default'}`);

    // About me
    const aboutText = player.profileAboutMe && player.profileAboutMe.length <= 80
        ? player.profileAboutMe
        : 'Nothing to see here.';

    // Generate badges
    const badgesHTML = generateBadgesHTML(player);

    const lastRaidDuration = formatSeconds(player.lastRaidTimeSeconds);
    const lastRaidAgo = formatLastPlayedRaid(player.lastPlayed);
    const lastAchivementAgo = formatLastPlayedRaid(player.latestAchievementTimestamp);

    let lastAchievementIconResult = '';
    if (player.latestAchievementImageUrl) {
        let lastAchievementIcon = player.latestAchievementImageUrl
        lastAchievementIconResult = lastAchievementIcon.slice(1)
    }

    // If user has usePrestigeStyling and prestige unlocked, assign a color name
    let profileClassStyle = ''
    if (player.prestige && player.usePrestigeStyling) {
        profileClassStyle = 'prestige-title';
    }

    container.innerHTML = `
<div class="profile-grid-layout" id="profile-main-grid">
    <!-- Main -->
    <div class="profile-main-card" id="main-profile-card">
        <img src="${player.profilePicture}" class="player-avatar" id="profile-avatar" alt="${player.name}" onerror="this.src='/media/default_avatar.png';" />
        <div class="player-status">
            <div class="status-indicator ${player.isOnline ? 'status-online' : 'status-offline'}"></div>
            <span>${player.isOnline ? 'Online' : 'Offline'}</span>
        </div>
        <h2 class="profile-player-name ${profileClassStyle}">${player.name}</h2>
        <div class="player-about">${aboutText}</div>
        <div class="player-reg-date">
            <span class="reg-date-text">Registered: ${regDate}</span>
        </div>
        <div class="badges-container">
            ${badgesHTML}
        </div>
        <div class="hall-of-fame-button-container">
            <button class="hall-of-fame-button" id="toggle-hof-button">Profile Battlepass</button>
        </div>
    </div>

    <!-- Last Raid -->
    <div class="last-raid-feed ${player.discFromRaid ? 'disconnected-bg' : player.isTransition ? 'transit-bg' : player.lastRaidSurvived ? 'survived-bg' : 'died-bg'}" id="last-raid-feed">
        <h3 class="section-title ${player.discFromRaid ? 'disconnected' : player.isTransition ? 'transit' : player.lastRaidSurvived ? 'survived' : 'died'}">
            Last Raid
        </h3>

        <div class="raid-overview">
            <span class="raid-result ${player.discFromRaid ? 'disconnected' : player.isTransition ? 'transit' : player.lastRaidSurvived ? 'survived' : 'died'}">
                ${player.discFromRaid ? `<em class="bx bxs-log-out"></em> Left` : player.isTransition ? `<i class="bx bx-loader-alt bx-spin" style="line-height: 0 !important;"></i> In Transit (${player.lastRaidMap}
                <em class="bx bxs-chevrons-right" style="position: relative; top: 2px;"></em> ${player.lastRaidTransitionTo || 'Unknown'})` : player.lastRaidSurvived ? `<em class="bx bx-walk"></em> Survived` : `
                <em class="bx bxs-skull"></em> Killed in Action`}
            </span>
            <span class="raid-meta">
                ${player.lastRaidMap || 'Unknown'} • ${player.lastRaidAs || 'N/A'} • ${lastRaidDuration || '00:00'} • ${lastRaidAgo || 'Just Now'}
            </span>
        </div>

        <div class="raid-stats-grid">
            <div class="raid-stat-block">
                <span class="profile-stat-label">Kills:</span>
                <span class="profile-stat-value">${player.lastRaidKills ?? 0}</span>
            </div>
            <div class="raid-stat-block">
                <span class="profile-stat-label">Damage:</span>
                <span class="profile-stat-value">${player.lastRaidDamage ?? 0}</span>
            </div>
            <div class="raid-stat-block">
                <span class="profile-stat-label">Player Hits:</span>
                <span class="profile-stat-value">${player.lastRaidHits ?? 0}</span>
            </div>
            <div class="raid-stat-block">
                <span class="profile-stat-label">Loot EXP:</span>
                <span class="profile-stat-value">${player.lastRaidEXP ?? 0}</span>
            </div>
        </div>

        <!-- Latest Achievement Block -->
        <div class="stat-block achievement-block">
            <h3 class="section-title">Latest Achievement</h3>
            <div class="achievement-content">
                <div class="achievement-icon">
                    <img src="${lastAchievementIconResult || 'files/achievement/Standard_35_1.png'}" alt="Achievement Icon" />
                    <div class="achievement-time">${lastAchivementAgo || 'N/A'}</div>
                </div>
                <div class="achievement-info">
                    <div class="achievement-title">${player.latestAchievementName || 'Nothing to see here yet...'}</div>
                    <div class="achievement-description">${player.latestAchievementDescription || 'Nothing to see here yet...'}</div>
                </div>
            </div>
        </div>
    </div>

    <div class="stats-blocks" id="raid-stats-grid">
        <!-- PMC Block -->
        <div class="stat-block pmc-block">
            <h3 class="section-title">PMC</h3>
            <div class="stat-row">
                <span class="profile-stat-label">Level (Overall)</span>
                <span class="profile-stat-value">${player.pmcLevel || 'N/A'}</span>
            </div>
            <div class="stat-row">
                <span class="profile-stat-label">K/D Ratio</span>
                <span class="profile-stat-value">${player.killToDeathRatio || 'N/A'}</span>
            </div>
            <div class="stat-row">
                <span class="profile-stat-label">Raids</span>
                <span class="profile-stat-value">${player.pmcRaids || 0}</span>
            </div>
            <div class="stat-row">
                <span class="profile-stat-label">Survival Rate</span>
                <span class="profile-stat-value">${player.survivalRate || 0}%</span>
            </div>
        </div>

        <!-- SCAV Block -->
        <div class="stat-block scav-block">
            <h3 class="section-title scav">SCAV</h3>
            <div class="stat-row">
                <span class="profile-stat-label">Level (Overall)</span>
                <span class="profile-stat-value">${player.scavLevel || '0'}</span>
            </div>
            <div class="stat-row">
                <span class="profile-stat-label">K/D Ratio</span>
                <span class="profile-stat-value">${player.scavKillToDeathRatio || '0'}</span>
            </div>
            <div class="stat-row">
                <span class="profile-stat-label">Raids</span>
                <span class="profile-stat-value">${player.scavRaids || 0}</span>
            </div>
            <div class="stat-row">
                <span class="profile-stat-label">Survival Rate</span>
                <span class="profile-stat-value">${player.scavSurvivalRate ? player.scavSurvivalRate + '%' : '0'}</span>
            </div>
        </div>
    </div>

    <div id="player-profile-hof">
        <div class="stats-blocks">
            <div class="stat-block hof-player-level">
                <div class="level-info">
                    <span class="level-label">Leaderboard Level:</span>
                    <span class="level-value">0</span>
                </div>
                <div class="exp-bar-container">
                    <div class="exp-bar">
                        <div class="exp-progress" style="width: 0%;"></div>
                    </div>
                    <div class="exp-numbers">
                        <span class="current-exp">0</span>
                        <span class="exp-separator"></span>
                        <span class="next-level-exp">0</span>
                    </div>
                </div>
                <div class="exp-remaining">Until next level: <span class="remaining-value">0</span> EXP</div>
            </div>
            <div class="hof-player-trader-info">
                <div class="trader-grid">

                    <div class="trader-card" data-unlocked="true">
                        <div class="trader-image-container">
                            <img src="media/traders/prapor.png" alt="Prapor" class="trader-image">
                            <div class="trader-lock" style="display: none;">🔒</div>
                        </div>
                        <div class="trader-name">Prapor</div>
                        <div class="trader-standing">Loyalty: ${player.traderInfo ? Number(player.traderInfo.PRAPOR.standing.toFixed(2)) : 0}</div>
                    </div>

                    <div class="trader-card" data-unlocked="true">
                        <div class="trader-image-container">
                            <img src="media/traders/therapist.png" alt="Therapist" class="trader-image">
                            <div class="trader-lock" style="display: none;">🔒</div>
                        </div>
                        <div class="trader-name">Therapist</div>
                        <div class="trader-standing">Loyalty: ${player.traderInfo ? Number(player.traderInfo.THERAPIST.standing.toFixed(2)) : 0}</div>
                    </div>

                    <div class="trader-card" data-unlocked="true">
                        <div class="trader-image-container">
                            <img src="media/traders/fence.png" alt="Fence" class="trader-image">
                            <div class="trader-lock" style="display: none;">🔒</div>
                        </div>
                        <div class="trader-name">Fence</div>
                        <div class="trader-standing">Loyalty: ${player.traderInfo ? Number(player.traderInfo.FENCE.standing.toFixed(2)) : 0}</div>
                    </div>

                    <div class="trader-card" data-unlocked="true">
                        <div class="trader-image-container">
                            <img src="media/traders/skier.png" alt="Skier" class="trader-image">
                            <div class="trader-lock" style="display: none;">🔒</div>
                        </div>
                        <div class="trader-name">Skier</div>
                        <div class="trader-standing">Loyalty: ${player.traderInfo ? Number(player.traderInfo.SKIER.standing.toFixed(2)) : 0}</div>
                    </div>

                    <div class="trader-card" data-unlocked="true">
                        <div class="trader-image-container">
                            <img src="media/traders/peacekeeper.png" alt="Peacekeeper" class="trader-image">
                            <div class="trader-lock" style="display: none;">🔒</div>
                        </div>
                        <div class="trader-name">Peacekeeper</div>
                        <div class="trader-standing">Loyalty: ${player.traderInfo ? Number(player.traderInfo.PEACEKEEPER.standing.toFixed(2)) : 0}</div>
                    </div>

                    <div class="trader-card" data-unlocked="true">
                        <div class="trader-image-container">
                            <img src="media/traders/mechanic.png" alt="Mechanic" class="trader-image">
                            <div class="trader-lock" style="display: none;">🔒</div>
                        </div>
                        <div class="trader-name">Mechanic</div>
                        <div class="trader-standing">Loyalty: ${player.traderInfo ? Number(player.traderInfo.MECHANIC.standing.toFixed(2)) : 0}</div>
                    </div>

                    <div class="trader-card" data-unlocked="true">
                        <div class="trader-image-container">
                            <img src="media/traders/ragman.png" alt="Ragman" class="trader-image">
                            <div class="trader-lock" style="display: none;">🔒</div>
                        </div>
                        <div class="trader-name">Ragman</div>
                        <div class="trader-standing">Loyalty: ${player.traderInfo ? Number(player.traderInfo.RAGMAN.standing.toFixed(2)) : 0}</div>
                    </div>

                    <div class="trader-card" data-unlocked="true">
                        <div class="trader-image-container">
                            <img src="media/traders/jaeger.png" alt="Jaeger" class="trader-image">
                            <div class="trader-lock" style="display: none;">🔒</div>
                        </div>
                        <div class="trader-name">Jaeger</div>
                        <div class="trader-standing">Loyalty: ${player.traderInfo ? Number(player.traderInfo.JAEGER.standing.toFixed(2)) : 0}</div>
                    </div>

                    <div class="trader-card" data-unlocked="true">
                        <div class="trader-image-container">
                            <img src="media/traders/ref.png" alt="Ref" class="trader-image">
                            <div class="trader-lock" style="display: none;">🔒</div>
                        </div>
                        <div class="trader-name">Ref</div>
                        <div class="trader-standing">Loyalty: ${player.traderInfo ? Number(player.traderInfo.REF.standing.toFixed(2)) : 0}</div>
                    </div>

                    <div class="trader-card" data-unlocked="true">
                        <div class="trader-image-container">
                            <img src="media/traders/lightkeeper.png" alt="Lightkeeper" class="trader-image">
                            <div class="trader-lock" style="display: none;">🔒</div>
                        </div>
                        <div class="trader-name">Lightkeeper</div>
                        <div class="trader-standing">Loyalty: ${player.traderInfo ? Number(player.traderInfo.LIGHTKEEPER.standing.toFixed(2)) : 0}</div>
                    </div>

                    <div class="trader-card" data-unlocked="true">
                        <div class="trader-image-container">
                            <img src="media/traders/btr.png" alt="BTR Driver" class="trader-image">
                            <div class="trader-lock" style="display: none;">🔒</div>
                        </div>
                        <div class="trader-name">BTR Driver</div>
                        <div class="trader-standing">Loyalty: ${player.traderInfo ? Number(player.traderInfo.BTR_DRIVER.standing.toFixed(2)) : 0}</div>
                    </div>


                </div>
            </div>
        </div>
    </div>

    <div id="player-profile-hof-sec">
        <div class="stats-blocks">
            <div class="stat-block hof-player-fav-weapon">
                <h3 class="section-title">Meta Gun</h3>
                <div class="weapon-info">
                    <div class="weapon-name">${getWeaponName(player)}</div>
                    <div class="weapon-mastery">Mastery Level: <span class="level-value-wp">0</span></div>

                    <div class="exp-bar-container">
                        <div class="exp-bar">
                            <div class="exp-progress-wp" style="width: 0%;"></div>
                        </div>
                        <div class="exp-numbers">
                            <span class="current-exp-wp">0</span>
                            <span class="next-level-exp-wp">0</span>
                        </div>
                    </div>
                    <div class="exp-remaining">Until next level: <span class="remaining-value-wp">0</span> EXP</div>

                    <!-- player.stattrack -->
                    ${player?.isUsingStattrack ? `<div class="weapon-extra-stats">
                        <div class="raid-stats-grid">
                            <div class="raid-stat-block">
                                <span class="profile-stat-label">Kills:</span>
                                <span class="profile-stat-value">${player.modWeaponStats.bestWeapon.stats.kills ? player.modWeaponStats.bestWeapon.stats.kills : 0}</span>
                            </div>
                            <div class="raid-stat-block">
                                <span class="profile-stat-label">Headshots:</span>
                                <span class="profile-stat-value">${player.modWeaponStats.bestWeapon.stats.headshots ? player.modWeaponStats.bestWeapon.stats.headshots : 0}</span>
                            </div>
                            <div class="raid-stat-block">
                                <span class="profile-stat-label">Shots Fired:</span>
                                <span class="profile-stat-value">${player.modWeaponStats.bestWeapon.stats.totalShots ? player.modWeaponStats.bestWeapon.stats.totalShots : 0}</span>
                            </div>
                            <div class="raid-stat-block">
                                <span class="profile-stat-label">Times Lost:</span>
                                <span class="profile-stat-value">${player.modWeaponStats.bestWeapon.stats.timesLost ? player.modWeaponStats.bestWeapon.stats.timesLost : 0}</span>
                            </div>
                        </div>
                    </div>` : ''}

                </div>
            </div>
        </div>

        <div class="stats-blocks">
            <div class="stat-block">
                <h3 class="section-title">Extra Stats</h3>
                        <div class="raid-stats-grid">
                            <div class="raid-stat-block">
                                <span class="profile-stat-label">Longest Killshot:</span>
                                <span class="profile-stat-value">${player.longestShot ? player.longestShot + 'm' : 0}</span>
                            </div>
                            <div class="raid-stat-block">
                                <span class="profile-stat-label">Total Damage:</span>
                                <span class="profile-stat-value">${player.damage}</span>
                            </div>
                        </div>
            </div>
        </div>
      
    </div>
</div>
    `;

    // Init battlepass button once the profile has opened
    initHOF(player);
}

function getWeaponName(player) {
    if (!player) return 'Unknown';

    if (player.modWeaponStats && player.modWeaponStats.bestWeapon) {
        return player.modWeaponStats.bestWeapon.name;
    } else if (player.weaponMasteryId) {
        return player.weaponMasteryId;
    } else {
        return 'Unknown';
    }
}

// Helper function to generate badges HTML
function generateBadgesHTML(player) {
    let badges = '';

    const playerData = allSeasonsCombinedData.find(p => p.id === player.id || p.name === player.name);

    if (playerData && playerData.seasonsCount > 1) {
        badges += `<div class="badge tooltip">
        <em class='bx bxs-joystick'></em>
        <span class="tooltiptext">This player has been around for ${playerData.seasonsCount} seasons!</span>
      </div>`;
    }

    if (player?.trusted && !player?.dev) {
        badges += `<div class="badge tooltip">
        <img src="media/trusted.png" width="30" height="30" alt="Trusted">
        <span class="tooltiptext">Official Tester</span>
      </div>`;
    }

    if (player?.suspicious == true) {
        badges += `<div class="badge tooltip">
        <em class='bx bxs-shield-x bx-flashing' style="color:rgb(255, 123, 100);"></em>
        <span class="tooltiptext">This player was marked as suspicious by SkillIssueDetector™. Their statistics may be innacurate</span>
      </div>`;
    } else {
        badges += `<div class="badge tooltip">
        <em class='bx bxs-check-shield' style="color:rgb(100, 255, 165);"></em>
        <span class="tooltiptext">Profile in good standing</span>
      </div>`;
    }

    // Prestige badge
    if (player.prestige && player.prestige > 0) {
        badges += `<div class="badge tooltip">
        <img src="media/prestige${player.prestige}.png" width="40" height="40" alt="Prestige">
        <span class="tooltiptext">This player has reached prestige level ${player.prestige}</span>
      </div>`;
    }

    if (player.hasKappa) {
        badges += `<div class="badge tooltip">
        <img src="media/kappa.png" width="35" height="35" alt="Kappa">
        <span class="tooltiptext">This player acquired Kappa!</span>
      </div>`;
    }

    // Add faction badge
    if (player.pmcSide === 'Bear') {
        badges += `<div class="badge tooltip">
                     <img src="media/Bear.png" width="70" height="70" alt="BEAR">
                     <span class="tooltiptext">Plays as BEAR Operator</span>
                   </div>`;
    } else if (player.pmcSide === 'Usec') {
        badges += `<div class="badge tooltip">
                     <img src="media/Usec.png" width="70" height="70" alt="USEC">
                     <span class="tooltiptext">Plays as USEC Operator</span>
                   </div>`;
    }

    return badges;
}

// Close modals on click or out of bounds click
function setupModalCloseHandlers(modal) {
    const closeBtn = modal.querySelector('.profile-close-btn');
    if (closeBtn) {
        closeBtn.onclick = () => {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto'; // Re-enable scrolling
        };
    }

    window.addEventListener('click', function closeModal(e) {
        if (e.target === modal || e.target.classList.contains('profile-modal-overlay')) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto'; // Re-enable scrolling
            window.removeEventListener('click', closeModal);
        }
    });
}

function formatLastPlayedRaid(unixTimestamp) {
    if (typeof unixTimestamp !== 'number' || unixTimestamp <= 0) {
        return 'Unknown';
    }

    const date = new Date(unixTimestamp * 1000);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
        return 'Just Now';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes === 1) {
        return '1 minute ago';
    }
    if (diffInMinutes < 60) {
        return `${diffInMinutes} minutes ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours === 1) {
        return '1 hour ago';
    }
    if (diffInHours < 24) {
        return `${diffInHours} hours ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) {
        return '1 day ago';
    }
    if (diffInDays < 30) {
        return `${diffInDays} days ago`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths === 1) {
        return '1 month ago';
    }
    if (diffInMonths < 12) {
        return `${diffInMonths} months ago`;
    }

    const diffInYears = Math.floor(diffInMonths / 12);
    if (diffInYears === 1) {
        return '1 year ago';
    }
    return `${diffInYears} years ago`;
}