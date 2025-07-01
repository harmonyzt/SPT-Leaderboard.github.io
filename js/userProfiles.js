//     _____ ____  ______   __    _________    ____  __________  ____  ____  ___    ____  ____ 
//    / ___// __ \/_  __/  / /   / ____/   |  / __ \/ ____/ __ \/ __ )/ __ \/   |  / __ \/ __ \
//    \__ \/ /_/ / / /    / /   / __/ / /| | / / / / __/ / /_/ / __  / / / / /| | / /_/ / / / /  
//   ___/ / ____/ / /    / /___/ /___/ ___ |/ /_/ / /___/ _, _/ /_/ / /_/ / ___ |/ _, _/ /_/ / 
//  /____/_/     /_/    /_____/_____/_/  |_/_____/_____/_/ |_/_____/\____/_/  |_/_/ |_/_____/  

let openedPlayerData = [];

async function openProfile(playerId) {
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

    // Instantly try assigning info if it was changed (and then change it to actual on backend)
    async function applyPlayerSettings(playerId) {
        try {
            const settings = await getProfileSettings();

            // Does it exists?
            if (settings[playerId]) {
                const playerConfig = settings[playerId];

                if (playerConfig) {
                    player.profileAboutMe = playerConfig.aboutMe;
                    player.usePrestigeStyling = playerConfig.usePrestigeStyling;
                    player.profileTheme = playerConfig.profileTheme;
                    player.bp_prestigebg = playerConfig.prestigeBackground;
                    player.bp_cardbg = playerConfig.backgroundReward;
                    player.bp_mainbg = playerConfig.mainBackgroundReward;
                    player.bp_cat = playerConfig.catReward;
                    player.bp_pfpstyle = playerConfig.pfpStyle;
                    player.bp_pfpbordercolor = playerConfig.pfpBorder;
                    player.bp_decal = playerConfig.decal;
                    player.profilePicture = await getPlayerPfp(playerId);
                    player.discordUser = playerConfig.discordUser ? playerConfig.discordUser : '';
                }

                console.log('Settings done:', playerConfig);
            } else {
                console.log('No settings found');
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    // await for it to end
    await applyPlayerSettings(player.id);

    // Showing public profile
    showPublicProfile(modalContent, player);
    openedPlayerData = player;
    modal.style.display = 'flex';
    setupModalCloseHandlers(modal);

    return;
}

// Private profile HTML
function showPrivateProfile(container, player) {
    const profileModal = document.querySelector('.profile-modal-content');
    const mainBackground = document.getElementById('playerProfileModal');
    mainBackground.style.backgroundImage = '';
    mainBackground.style.backgroundColor = '';
    mainBackground.classList.remove('usec-background', 'labs-background', 'bear-background', 'prestige-tagilla', 'prestige-killa', 'prestige-both');
    profileModal.classList.remove('theme-dark', 'theme-light', 'theme-gradient', 'theme-default', 'theme-redshade', 'theme-steelshade');
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
            <h3>Profile is Private</h3>
            <p>This player has chosen to keep their stats hidden</p>
            <div class="private-profile-hint">
                <span>Stats behind profile are simulated</span>
            </div>
        </div>
    </div>

    `;
}

// Disqualified profile HTML
function showDisqualProfile(container, player) {
    const profileModal = document.querySelector('.profile-modal-content');
    const mainBackground = document.getElementById('playerProfileModal');
    mainBackground.style.backgroundImage = '';
    mainBackground.style.backgroundColor = '';
    mainBackground.classList.remove('usec-background','labs-background', 'bear-background', 'prestige-tagilla', 'prestige-killa', 'prestige-both');
    profileModal.classList.remove('theme-dark', 'theme-light', 'theme-gradient', 'theme-default', 'theme-redshade', 'theme-steelshade');
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
            <img src="https://media1.tenor.com/m/N4XSv7AAXXMAAAAd/thanos-endgame.gif" class="ban-icon" alt="Banned">
            <h3>Profile Banned</h3>
            <p>This player has been suspended.</p>
            <div class="ban-details">
                <p><strong>Reason:</strong> ${player.banReason}</p>
                <p><strong>${(player.tookAction === 'harmony') ? `Admin:` : `Moderator:`}</strong> ${player.tookAction}</p>
            </div>
            <div class="private-profile-hint">
                <span>Stats behind profile are simulated</span>
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
async function showPublicProfile(container, player) {
    const regDate = player.registrationDate
        ? new Date(player.registrationDate * 1000).toLocaleDateString('en-EN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
        : 'Unknown';

    // Generate badges
    const badgesHTML = generateBadgesHTML(player);

    // Format UNIX timestamps
    const lastRaidDuration = formatSeconds(player.lastRaidTimeSeconds);
    const lastRaidAgo = formatLastPlayedRaid(player.lastPlayed);
    const lastAchivementAgo = formatLastPlayedRaid(player.latestAchievementTimestamp);

    let lastAchievementIconResult = '';
    if (player.latestAchievementImageUrl) {
        let lastAchievementIcon = player.latestAchievementImageUrl
        lastAchievementIconResult = lastAchievementIcon.slice(1)
    }

    // Stattrack weapon
    const bestWeapon = getBestWeapon(player.id, player.modWeaponStats);

    // Profile Theme
    const profileModal = document.querySelector('.profile-modal-content');
    profileModal.classList.remove('theme-dark', 'theme-light', 'theme-gradient', 'theme-default', 'theme-redshade', 'theme-steelshade');
    profileModal.classList.add(`theme-${player.profileTheme?.toLowerCase() ? player.profileTheme?.toLowerCase() : 'default'}`);

    // About me
    const aboutText = player.profileAboutMe ? player.profileAboutMe : 'Nothing to see here.';

    // Is online
    const isOnline = heartbeatMonitor.isOnline(player.id);

    // Get profile picture
    const profilePicture = await getPlayerPfp(player.id);

    container.innerHTML = `
<div class="profile-grid-layout profile-loading-overlay" id="profile-main-grid">
    <!-- Main -->
    <div class="profile-main-card" id="main-profile-card">
        <img src="media/rewards/other/badgerTester.gif" class="badger" id="badger" />
        <img src="media/rewards/other/cat.gif" class="kittyrew" id="catrew" />

        <img src="${profilePicture}" class="player-avatar" id="profile-avatar" alt="${player.name}" onerror="this.src='media/default_avatar.png';" />
        <div class="player-status">
            <div class="status-indicator ${isOnline ? 'status-online' : 'status-offline'}"></div>
            <span>${isOnline ? 'Online' : 'Offline'}</span>
        </div>
        <h2 class="profile-player-name">${player.teamTag ? `[${player.teamTag}]` : ``} ${player.name}</h2>
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
        <button id="show-raids-stats" class="hall-of-fame-button-container hall-of-fame-button lastRaids-button">
            Show Last Raids
        </button>
    </div>

    <!-- Last Raid -->
    <div class="last-raid-feed ${player.lastRaidRanThrough ? 'run-through-bg' : player.discFromRaid ? 'disconnected-bg' : player.isTransition ? 'transit-bg' : player.lastRaidSurvived ? 'survived-bg' : 'died-bg'}" id="last-raid-feed">
        <h3 class="section-title ${player.lastRaidRanThrough ? 'run-through' : player.discFromRaid ? 'disconnected' : player.isTransition ? 'transit' : player.lastRaidSurvived ? 'survived' : 'died'}">
            Last Raid
        </h3>

        <div class="raid-overview">
            <span class="raid-result ${player.lastRaidRanThrough ? 'run-through' : player.discFromRaid ? 'disconnected' : player.isTransition ? 'transit' : player.lastRaidSurvived ? 'survived' : 'died'}">
                ${player.lastRaidRanThrough ? `<i class='bx  bxs-walking'></i> Runner` : player.discFromRaid ? `<i class='bx  bxs-arrow-out-left-square-half'></i> Left` : player.isTransition ? `<i class='bx bxs-refresh-cw bx-spin'></i>  In Transit (${player.lastRaidMap}
                <i class='bx  bxs-chevrons-right'></i>  ${player.lastRaidTransitionTo || 'Unknown'})` : player.lastRaidSurvived ? `<i class='bx  bxs-walking'></i> Survived` : `
                <em class="bx bxs-skull"></em> Killed in Action`}
            </span>
            <span class="raid-meta">
                ${player.lastRaidMap || 'Unknown'} • ${player.lastRaidAs || 'N/A'} • ${lastRaidDuration || '00:00'} • ${lastRaidAgo || 'Just Now'}
            </span>
        </div>

        <div class="raid-stats-grid">
            <div class="raid-stat-block">
                <span class="profile-stat-label">PMC Kills:</span>
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
                <div class="bp-wrapper">
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
                <img src="" class="rank-icon" id="playerRankIcon" />
            </div>

            <div class="hof-player-trader-info">
                <div class="trader-grid">
                    <div class="trader-card" data-unlocked="${player.traderInfo.PRAPOR.unlocked}">
                        <div class="trader-image-container">
                            <img src="media/traders/prapor.png" alt="Prapor" class="trader-image" />
                            <div class="trader-lock" style="display: ${!player.traderInfo.PRAPOR.unlocked ? 'block' : 'none'};">🔒</div>
                        </div>
                        <div class="trader-name">Prapor</div>
                        <div class="trader-standing">Loyalty: ${player.traderInfo ? Number(player.traderInfo.PRAPOR.standing.toFixed(2)) : 0}</div>
                    </div>

                    <div class="trader-card" data-unlocked="${player.traderInfo.THERAPIST.unlocked}">
                        <div class="trader-image-container">
                            <img src="media/traders/therapist.png" alt="Therapist" class="trader-image" />
                            <div class="trader-lock" style="display: ${!player.traderInfo.THERAPIST.unlocked ? 'block' : 'none'};">🔒</div>
                        </div>
                        <div class="trader-name">Therapist</div>
                        <div class="trader-standing">Loyalty: ${player.traderInfo ? Number(player.traderInfo.THERAPIST.standing.toFixed(2)) : 0}</div>
                    </div>

                    <div class="trader-card" data-unlocked="${player.traderInfo.FENCE.unlocked}">
                        <div class="trader-image-container">
                            <img src="media/traders/fence.png" alt="Fence" class="trader-image" />
                            <div class="trader-lock" style="display: ${!player.traderInfo.FENCE.unlocked ? 'block' : 'none'};">🔒</div>
                        </div>
                        <div class="trader-name">Fence</div>
                        <div class="trader-standing">Loyalty: ${player.traderInfo ? Number(player.traderInfo.FENCE.standing.toFixed(2)) : 0}</div>
                    </div>

                    <div class="trader-card" data-unlocked="${player.traderInfo.SKIER.unlocked}">
                        <div class="trader-image-container">
                            <img src="media/traders/skier.png" alt="Skier" class="trader-image" />
                            <div class="trader-lock" style="display: ${!player.traderInfo.SKIER.unlocked ? 'block' : 'none'};">🔒</div>
                        </div>
                        <div class="trader-name">Skier</div>
                        <div class="trader-standing">Loyalty: ${player.traderInfo ? Number(player.traderInfo.SKIER.standing.toFixed(2)) : 0}</div>
                    </div>

                    <div class="trader-card" data-unlocked="${player.traderInfo.PEACEKEEPER.unlocked}">
                        <div class="trader-image-container">
                            <img src="media/traders/peacekeeper.png" alt="Peacekeeper" class="trader-image" />
                            <div class="trader-lock" style="display: ${!player.traderInfo.PEACEKEEPER.unlocked ? 'block' : 'none'};">🔒</div>
                        </div>
                        <div class="trader-name">Peacekeeper</div>
                        <div class="trader-standing">Loyalty: ${player.traderInfo ? Number(player.traderInfo.PEACEKEEPER.standing.toFixed(2)) : 0}</div>
                    </div>

                    <div class="trader-card" data-unlocked="${player.traderInfo.MECHANIC.unlocked}">
                        <div class="trader-image-container">
                            <img src="media/traders/mechanic.png" alt="Mechanic" class="trader-image" />
                            <div class="trader-lock" style="display: ${!player.traderInfo.MECHANIC.unlocked ? 'block' : 'none'};">🔒</div>
                        </div>
                        <div class="trader-name">Mechanic</div>
                        <div class="trader-standing">Loyalty: ${player.traderInfo ? Number(player.traderInfo.MECHANIC.standing.toFixed(2)) : 0}</div>
                    </div>

                    <div class="trader-card" data-unlocked="${player.traderInfo.RAGMAN.unlocked}">
                        <div class="trader-image-container">
                            <img src="media/traders/ragman.png" alt="Ragman" class="trader-image" />
                            <div class="trader-lock" style="display: ${!player.traderInfo.RAGMAN.unlocked ? 'block' : 'none'};">🔒</div>
                        </div>
                        <div class="trader-name">Ragman</div>
                        <div class="trader-standing">Loyalty: ${player.traderInfo ? Number(player.traderInfo.RAGMAN.standing.toFixed(2)) : 0}</div>
                    </div>

                    <div class="trader-card" data-unlocked="${player.traderInfo.JAEGER.unlocked}">
                        <div class="trader-image-container">
                            <img src="media/traders/jaeger.png" alt="Jaeger" class="trader-image" />
                            <div class="trader-lock" style="display: ${!player.traderInfo.JAEGER.unlocked ? 'block' : 'none'};">🔒</div>
                        </div>
                        <div class="trader-name">Jaeger</div>
                        <div class="trader-standing">Loyalty: ${player.traderInfo ? Number(player.traderInfo.JAEGER.standing.toFixed(2)) : 0}</div>
                    </div>

                    <div class="trader-card" data-unlocked="${player.traderInfo.REF.unlocked}">
                        <div class="trader-image-container">
                            <img src="media/traders/ref.png" alt="Ref" class="trader-image" />
                            <div class="trader-lock" style="display: ${!player.traderInfo.REF.unlocked ? 'block' : 'none'};">🔒</div>
                        </div>
                        <div class="trader-name">Ref</div>
                        <div class="trader-standing">Loyalty: ${player.traderInfo ? Number(player.traderInfo.REF.standing.toFixed(2)) : 0}</div>
                    </div>

                    <div class="trader-card" data-unlocked="${player.traderInfo.LIGHTKEEPER.unlocked}">
                        <div class="trader-image-container">
                            <img src="media/traders/lightkeeper.png" alt="Lightkeeper" class="trader-image" />
                            <div class="trader-lock" style="display: ${!player.traderInfo.LIGHTKEEPER.unlocked ? 'block' : 'none'};">🔒</div>
                        </div>
                        <div class="trader-name">Lightkeeper</div>
                        <div class="trader-standing">Loyalty: ${player.traderInfo ? Number(player.traderInfo.LIGHTKEEPER.standing.toFixed(2)) : 0}</div>
                    </div>

                    <div class="trader-card" data-unlocked="${player.traderInfo.BTR_DRIVER.unlocked}">
                        <div class="trader-image-container">
                            <img src="media/traders/btr.png" alt="BTR Driver" class="trader-image" />
                            <div class="trader-lock" style="display: ${!player.traderInfo.BTR_DRIVER.unlocked ? 'block' : 'none'};">🔒</div>
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
                ${!player?.isUsingStattrack ? `
                <div class="stattrack-overlay">
                    <div class="stattrack-message">This player is not using <a href="https://hub.sp-tarkov.com/files/file/2501-stattrack/">Stattrack Mod</a> by AcidPhantasm</div>
                </div>
                ` : ''}
                
                <h3 class="section-title">Meta Gun</h3>
                <div class="weapon-info ${!player?.isUsingStattrack ? 'stattrack-disabled' : ''}">
                    <div class="weapon-name">${bestWeapon?.name ? bestWeapon.name : 'Unknown'}</div>
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

                    <div class="weapon-extra-stats">
                        <div class="raid-stats-grid">
                            <div class="raid-stat-block">
                                <span class="profile-stat-label">Kills:</span>
                                <span class="profile-stat-value">${player?.isUsingStattrack ? (bestWeapon ? bestWeapon.stats.kills : 0) : '0'}</span>
                            </div>
                            <div class="raid-stat-block">
                                <span class="profile-stat-label">Headshots:</span>
                                <span class="profile-stat-value">${player?.isUsingStattrack ? (bestWeapon ? bestWeapon.stats.headshots : 0) : '0'}</span>
                            </div>
                            <div class="raid-stat-block">
                                <span class="profile-stat-label">Shots Fired:</span>
                                <span class="profile-stat-value">${player?.isUsingStattrack ? (bestWeapon ? bestWeapon.stats.totalShots : 0) : '0'}</span>
                            </div>
                            <div class="raid-stat-block">
                                <span class="profile-stat-label">Shots to Kill:</span>
                                <span class="profile-stat-value">${player?.isUsingStattrack ? (bestWeapon ? (bestWeapon.stats.kills > 0 ? Math.round(bestWeapon.stats.totalShots / bestWeapon.stats.kills) : '0') : '0') : '0'}</span>
                            </div>
                        </div>
                    </div>
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

    <div>
        <div class="raids-modal-content profile-loading-overlay" id="raids-stats-modal">
            <div class="modal-header" style="padding: 15px; border-bottom: 1px solid #ffffff1a; display: flex; justify-content: space-between; align-items: center;">
                <h3 style="margin: 0;">Raid History</h3>
                <button id="close-raids-stats" style="background: none; border: none; color: #fff; font-size: 20px; cursor: pointer;">&times;</button>
            </div>

            <div class="raids-modal-body">
                <div class="private-profile-overlay" id="lastraids-loader">
                    <div class="loader-glass">
                        <div class="loader-content">
                            <img src="media/loading_bar.gif" width="30" height="30" class="loader-icon">
                            <h3>Loading...</h3>
                        </div>
                    </div>
                </div>
                <div id="raids-stats-container" style="display: none;"></div>

            </div>
        </div>
    </div>

    <div class="private-profile-overlay" id="profile-loader">
        <div class="loader-glass">
            <div class="loader-content">
            <img src="media/loading_bar.gif" width="30" height="30" class="loader-icon">
            <h3>Loading...</h3>
            </div>
        </div>
    </div>

    <div class="friend-list">
        <h3>Friends</h3>
        <div id="friends-container">
            <div class="loading">Loading Friends...</div>
        </div>
    </div>
`;

    // Init battlepass button once the profile has opened
    initHOF(player, bestWeapon);
    initLastRaids(player, container);
    renderFriendList(player);

    // Get bg for badges
    const badgesBG = document.querySelector('.badges-container');
    badgesBG.classList.remove('theme-dark', 'theme-light', 'theme-gradient', 'theme-default', 'theme-redshade', 'theme-steelshade');
    badgesBG.classList.add(`theme-${player.profileTheme?.toLowerCase() ? player.profileTheme?.toLowerCase() : 'default'}`);

    closeLoaderAfterImagesLoad();
}

function closeLoaderAfterImagesLoad() {
    const loaderBlur = document.querySelector('.profile-grid-layout');
    const images = loaderBlur.querySelectorAll('img');

    // If no images, close loader (there should always be)
    if (images.length === 0) {
        closeLoader();
        return;
    }

    let loadedCount = 0;
    const totalImages = images.length;

    const checkImageLoad = (img) => {
        // If image is cached
        if (img.complete) {
            loadedCount++;
        } else {
            img.addEventListener('load', () => {
                loadedCount++;
                checkAllLoaded();
            });
            img.addEventListener('error', () => {
                loadedCount++;
                checkAllLoaded();
            });
        }
        checkAllLoaded();
    };

    const checkAllLoaded = () => {
        if (loadedCount === totalImages) {
            setTimeout(closeLoader, 300);
        }
    };

    // Check all images
    images.forEach(checkImageLoad);
}

// closeLoader
function closeLoader() {
    const loader = document.getElementById('profile-loader');
    const loaderBlur = document.querySelector('.profile-grid-layout');

    // Add fade to the blur before removing
    loader.classList.add('fade-out');

    // Remove blur complely
    setTimeout(() => {
        loaderBlur.classList.remove('profile-loading-overlay');
        loader.style.display = 'none';
    }, 300);
}

function getBestWeapon(playerId, modWeaponStats) {
    if (!modWeaponStats[playerId]) {
        return null;
    }

    let maxKills = 0;
    let bestWeapon = null;
    const playerWeapons = modWeaponStats[playerId];

    // Go through all weapons
    for (const [weaponName, weaponData] of Object.entries(playerWeapons)) {
        const kills = weaponData.stats?.kills || 0;

        // Found best weapon by kills and assign data
        if (kills > maxKills) {
            maxKills = kills;
            bestWeapon = {
                name: weaponName,
                ...weaponData
            };
        }
    }

    return bestWeapon;
}

// Helper function to generate badges HTML
function generateBadgesHTML(player) {
    let badges = '';

    const playerData = allSeasonsCombinedData.find(p => p.id === player.id || p.name === player.name);

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

    if (player.dev) {
        badges += `<div class="badge tooltip">
                     <img src="media/leaderboard_icons/icon_developer.png" style="width: 20px; height: 20px">
                     <span class="tooltiptext">Developer playing the game.. Seriously?</span>
                   </div>`;
    }

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
        <em class='bx bxs-x-shield bx-flashing' style="color:rgb(255, 123, 100);"></em>
        <span class="tooltiptext">This player was marked as suspicious by SkillIssueDetector™. Their statistics may be innacurate</span>
      </div>`;
    } else {
        badges += `<div class="badge tooltip">
        <em class='bx  bxs-shield-alt-2' style="color:rgb(100, 255, 165);"></em>
        <span class="tooltiptext">Profile in good standing</span>
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

    return;
}

function formatLastPlayedRaid(unixTimestamp) {
    if (typeof unixTimestamp !== 'number' || unixTimestamp <= 0) {
        return 'Unknown';
    }

    const date = new Date(unixTimestamp * 1000);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);

    if (diffInMinutes < 5) {
        return 'Just Now';
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