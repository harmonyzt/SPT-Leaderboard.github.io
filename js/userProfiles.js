//     _____ ____  ______   __    _________    ____  __________  ____  ____  ___    ____  ____
//    / ___// __ \/_  __/  / /   / ____/   |  / __ \/ ____/ __ \/ __ )/ __ \/   |  / __ \/ __ \
//    \__ \/ /_/ / / /    / /   / __/ / /| | / / / / __/ / /_/ / __  / / / / /| | / /_/ / / / /
//   ___/ / ____/ / /    / /___/ /___/ ___ |/ /_/ / /___/ _, _/ /_/ / /_/ / ___ |/ _, _/ /_/ /
//  /____/_/     /_/    /_____/_____/_/  |_/_____/_____/_/ |_/_____/\____/_/  |_/_/ |_/_____/

const RARITY_ORDER = {
    'Legendary': 0,
    'Rare': 1,
    'Common': 2
};

// To prevent any flicker
let isProfileOpened = false;

document.addEventListener("DOMContentLoaded", async () => {
    await loadAchievementsData();
});

async function openProfile(playerId, bypass = false) {
    // Don't open profile again for whatever reason if profile is already open
    // Only let this happen if user opens a player from friend list
    if (isProfileOpened && !bypass) {
        return;
    }

    const modal = document.getElementById("playerProfileModal");
    const modalContent = document.getElementById("modalPlayerInfo");

    modalContent.innerHTML = "";

    // If data-player-id="0"
    if (!playerId || playerId === "0") {
        showToast(`Couldn't open this profile`, 'error', 8000)
        return;
    }

    // Finding Player in data
    const player = leaderboardData.find((p) => p.id === playerId);

    // Couldn't find
    if (!player) {
        showToast(`Couldn't find player`, 'error', 8000)
        return;
    }

    const isPublic = player.publicProfile;

    // If disqualified
    if (player.banned) {
        modal.style.display = "flex";
        showDisqualProfile(modalContent, player);
        setupModalCloseHandlers(modal, player);
        return;
    }

    // Privated profile
    if (!isPublic) {
        showToast('This profile is private', 'info', 8000)
        return;
    }

    // Showing public profile
    showPublicProfile(modalContent, player);
    window.location.hash = `id=${encodeURIComponent(player.id)}`;
    modal.style.display = "flex";

    return;
}

// Disqualified profile HTML
function showDisqualProfile(container, player) {
    const profileModal = document.querySelector(".profile-modal-content");
    const mainBackground = document.getElementById("playerProfileModal");
    mainBackground.style.backgroundImage = "";
    mainBackground.style.backgroundColor = "";
    mainBackground.classList.remove(
        "usec-background",
        "labs-background",
        "bear-background",
        "prestige-tagilla",
        "prestige-killa",
        "prestige-both"
    );
    profileModal.classList.remove(
        "theme-dark",
        "theme-light",
        "theme-gradient",
        "theme-default",
        "theme-redshade",
        "theme-steelshade"
    );


    container.innerHTML = `
    <div class="private-profile-overlay" style="background: none;">
        <div class="private-profile-content">
            <img src="https://media1.tenor.com/m/N4XSv7AAXXMAAAAd/thanos-endgame.gif" class="ban-icon" alt="Banned">
            <h3>Profile Banned</h3>
            <p>This player has been suspended.</p>
            <div class="ban-details">
                <p><strong>Profile ID:</strong> ${player.id}</p>
                <p><strong>Reason:</strong> ${player.banReason}</p>
                <p><strong>${player.tookAction === "harmony" ? `Admin:` : `Moderator:`}</strong> ${player.tookAction}</p>
            </div>
        </div>
    </div>
    `;
}

async function getCustomProfileSettings(playerId) {
    try {
        const response = await fetch(`/api/network/profile/profiles/${playerId}.json?t=${Date.now()}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data[playerId] || null;
    } catch (error) {
        console.error('Failed to load profile settings:', error);
        return null;
    }
}

// Public profile
async function showPublicProfile(container, player) {

    isProfileOpened = true;
    const playerData = await getCustomProfileSettings(player.id);

    if (playerData) {
        player.profileTheme = playerData.profileTheme;
        player.usePrestigeStyling = playerData.usePrestigeStyling;
        player.prestigeBackground = playerData.prestigeBackground;
        player.bp_cardbg = playerData.backgroundReward;
        player.bp_mainbg = playerData.mainBackgroundReward;
        player.catReward = playerData.catReward;

        player.bp_pfpstyle = playerData.pfpStyle;
        player.bp_pfpbordercolor = playerData.pfpBorder;
        player.bp_decal = playerData.decal;
        player.profileAboutMe = playerData.aboutMe;
        player.discordUser = playerData.discordUser;
    }

    // Disable auto updating on the background
    AutoUpdater.setEnabled(false);

    // Convert registration date of a player
    const regDate = player.registrationDate
        ? new Date(player.registrationDate * 1000).toLocaleDateString("en-EN", {
            year: "numeric",
            month: "long",
            day: "numeric",
        })
        : "Unknown";

    // Generate badges
    const badgesHTML = generateBadgesHTML(player);

    // Show fav weapon if is using Stattrack
    const bestWeapon = getBestWeapon(player.id, player.modWeaponStats || {});
    if (!bestWeapon) {
        player.isUsingStattrack = false;
    }

    // Profile Theme
    const profileModal = document.querySelector(".profile-modal-content");
    profileModal.classList.remove(
        "theme-dark",
        "theme-light",
        "theme-gradient",
        "theme-default",
        "theme-redshade",
        "theme-steelshade"
    );
    profileModal.classList.add(
        `theme-${player.profileTheme?.toLowerCase()
            ? player.profileTheme?.toLowerCase()
            : "default"
        }`
    );

    // About me
    const aboutText = player.profileAboutMe
        ? player.profileAboutMe
        : "No description provided.";

    // Is player online?
    const playerStatus = heartbeatMonitor.getPlayerStatus(player.id);
    const isOnline = playerStatus.isOnline;

    // If player is in raid - show details of the raid
    let raidInfo = '';
    if (isOnline && playerStatus.raidDetails !== null) {
        raidInfo = `
        <section class="raid-details" aria-label="Raid information">
            <span class="raid-map" aria-label="Map name">Map: ${getPrettyMapName(playerStatus.raidDetails.map)}</span>
            <span class="raid-side" aria-label="Player side">Side: ${playerStatus.raidDetails.side}</span>
            <span class="raid-time" aria-label="Game time">Time: ${playerStatus.raidDetails.gameTime}</span>
        </section>
    `;
    }

    // Get HTML part of profile side
    const profileSideHTML = getPlayerSideImageHTML(player);

    // Get latest achievement
    const latestAchievement = await processPlayerAchievements(player);

    let lastGame;
    if (!player.banned) {
        const lastOnlineTime = heartbeatMonitor.isOnline(player.id)
            ? '<span class="player-status-lb-online">Online</span>'
            : window.heartbeatMonitor.getLastOnlineTime(playerStatus.lastUpdate || player.lastPlayed);

        // For lastGame
        if (heartbeatMonitor.isOnline(player.id)) {
            lastGame = `<span class="player-status-lb ${playerStatus.statusClass}">${playerStatus.statusText} <div id="blink"></div></span>`
        } else {
            lastGame = `<span class="last-online-time">Last seen ${lastOnlineTime}</span>`;
        }
    } else {
        lastGame = `<span class="last-online-time">Banned</span>`;
    }

    // Account type handling
    let accountColor = '';
    let accountClass = '';
    let nameClass = '';

    // 1st prio - dev
    if (player.dev) {
        accountColor = '#2486ff';
    }
    // 2nd prio - Tester
    else if (player.trusted && !player.banned) {
        accountColor = '#ba8bdb';
    }
    // 3rd prio - twitch players
    else if (!player.banned && player.isUsingTP) {
        accountClass = 'gradient-tp-text';
        accountColor = '';
    }
    // 4th prio - account type
    else if (!player.banned && !player.isUsingTP) {
        switch (player.accountType) {
            case 'edge_of_darkness':
                accountColor = '#be8301';
                break;
            case 'unheard_edition':
                accountColor = '#54d0e7';
                break;
        }
    }
    // Banned - lowest prio
    else {
        accountColor = '#787878';
    }

    let finalNameClass = '';
    if (nameClass) {
        finalNameClass = nameClass;
    } else if (accountClass) {
        finalNameClass = accountClass; // TP
    }

    container.innerHTML = `
        <!-- left column -->
        <img src="media/rewards/other/badgerTester.gif" class="badger" id="badger" />
        <img src="media/rewards/other/cat.gif" class="kittyrew" id="catrew" />

        <button id="closeButton" class="close-profile-button">×</button>

        <div class="left-column">

            <div class="user-main-card profile-section" id="main-profile-card">
                <div class="pfp"><img src="${player.profilePicture}" class="player-avatar" id="profile-avatar" alt="${player.name}" onerror="this.src='media/default_avatar.png';" /></div>
                <div class="profile-header">
                    <div class="name-wrapper">
                        <div class="name ${finalNameClass}" ${accountColor && !finalNameClass ? `style="color: ${accountColor}"` : ''}>
                            ${player.teamTag ? `[${player.teamTag}]` : ``}
                            ${player.name}
                        </div>
                        <div class="registerDate">Joined: ${regDate}</div>
                    </div>
                    ${player.discordUser ? `<div class="player-discord"><i class="fa-brands fa-discord"></i> ${player.discordUser}</div>` : ``}
                    <div class="player-status">
                        <span>${lastGame}</span>
                    </div>
                    ${raidInfo}
                </div>

                <div class="aboutMe">${aboutText}</div>

                <div class="player-overview">
                    <div class="player-overview-side player-overview-pmc">PMC</div>
                    <div class="stat-item">
                        <div class="stat-value">${player.killToDeathRatio || '0.00'}</div>
                        <div class="stat-name">K/D</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${player.survivalRate + '%' || '0%'}</div>
                        <div class="stat-name">SR</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${player.pmcRaids || '0'}</div>
                        <div class="stat-name">Raids</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${formatOnlineTime(player.totalPlayTime) || '0h'}</div>
                        <div class="stat-name">In-Raid Time</div>
                    </div>
                </div>

                <div class="player-overview">
                    <div class="player-overview-side player-overview-scav">SCAV</div>
                    <div class="stat-item">
                        <div class="stat-value">${player.scavKillToDeathRatio || '0.00'}</div>
                        <div class="stat-name">K/D</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${player.scavSurvivalRate + '%' || '0%'}</div>
                        <div class="stat-name">SR</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${player.scavRaids || '0'}</div>
                        <div class="stat-name">Raids</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${formatOnlineTime(player.scavPlayTime) || '0h'}</div>
                        <div class="stat-name">In-Raid Time</div>
                    </div>
                </div>

                <div class="badges">${badgesHTML}</div>
                <div class="registerDate">Joined: ${regDate}</div>
                <div class="pmc-side-wrapper">
                    ${profileSideHTML}
                    <div class="pmc-level">${player.pmcLevel} LVL</div>
                </div>

            </div>

            <div class="battlepass-level profile-section">
                <div class="achievement-title Common">
                    Leaderboard BattlePass Level
                </div>
                <img src="" class="rank-icon" id="playerRankIcon" />
                <div class="bp-wrapper">
                    <div class="level-info">
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
                    <div class="exp-remaining">
                        Until next level:
                        <span class="remaining-value">0</span> EXP
                    </div>
                </div>
            </div>

            <div class="hits-past-raids profile-section">
                <div class="hits-wrapper">
                    <div class="hits-avg-headshots">
                        <div class="avg-headshots"><span>Avg. Headshot % - Last 5 Games</span></div>
                    </div>
                    <div class="body-parts-main">
                        <div class="body-svg">
                            <svg viewBox="0 0 50 141">
                                <path class="body-legs" d="M23.184 73.862c.547.157.894.786.801 1.434l-.003.014c-.031.2-.073.45-.127.74-.037.194-.076.405-.124.628-.048.224-.099.465-.155.718-.047.22-.101.45-.155.688l-.124.53c-.138.572-.288 1.18-.451 1.808-.203.783-.375 1.06-.606 1.862-.14.484-.281.96-.428 1.428a50.077 50.077 0 0 1-.592 1.79 23.066 23.066 0 0 1-.885 2.21c-.482 1.01-.752 2.709-.916 3.811-.065.441-.116.879-.152 1.306-.057.642-.09 1.26-.121 1.83-.02.378-.043.736-.068 1.066-.054.658-.13 1.197-.285 1.556-.116.27-.22.45-.31.608a2.274 2.274 0 0 0-.192.389 2.07 2.07 0 0 0-.115.53c-.011.091-.017.19-.023.302-.003.112-.005.237-.005.375.002.836.104 2.202.335 4.626.617 6.469-1.846 6.827-3.078 14.375a57.044 57.044 0 0 0-.578 3.583 61.887 61.887 0 0 0-.281 2.661c-.048.58-.087 1.142-.116 1.685a44.885 44.885 0 0 0-.065 2.284c0 .233.003.456.008.674.014.651.051 1.224.107 1.695.076.628.096 1.168.068 1.628-.02.346-.07.645-.14.908-.122.434-.305.76-.533 1a1.707 1.707 0 0 1-.626.415c-.809.312-1.852.628-2.925 1.905a7.753 7.753 0 0 0-.463.608 6.688 6.688 0 0 1-.87 1.05 5.049 5.049 0 0 1-.785.612c-.498.312-.96.493-1.423.852 0 .003-.003.003-.003.003-.107.076-.202.145-.298.211l-.068.046c-.093.063-.18.125-.265.178l-.03.019a9.25 9.25 0 0 1-.269.161 2.653 2.653 0 0 1-.211.115c-.014.007-.026.01-.037.017-.056.026-.113.053-.166.076a2.842 2.842 0 0 1-.206.075l-.037.01a1.09 1.09 0 0 1-.135.03c-.006 0-.014.003-.023.003-.05.007-.096.01-.14.01h-.037c-.023 0-.048 0-.07-.004-.015 0-.029 0-.04-.003a.458.458 0 0 1-.073-.013c-.009-.003-.02-.003-.029-.007a.765.765 0 0 1-.098-.032l-.023-.01c-.025-.013-.05-.023-.076-.036l-.034-.02a.715.715 0 0 1-.061-.036l-.037-.023a1.4 1.4 0 0 1-.065-.043l-.031-.023a1.858 1.858 0 0 1-.087-.066c-.006 0-.009-.003-.012-.006-.03-.027-.067-.053-.101-.083l-.043-.036c-.025-.016-.047-.036-.07-.056-.034-.026-.065-.056-.099-.082l-.048-.04a3.838 3.838 0 0 0-.096-.079c-.011-.01-.02-.016-.03-.026-.046-.033-.09-.069-.136-.105a.442.442 0 0 0-.025-.02c-.037-.03-.076-.059-.116-.089-.017-.013-.034-.023-.05-.036-.034-.026-.068-.049-.105-.076l-.059-.039c-.037-.026-.079-.053-.118-.079-.017-.013-.034-.023-.054-.036-.062-.04-.124-.076-.188-.116-.463-.269-.708-.539-.77-.829a.817.817 0 0 1-.014-.144c0-.145.045-.3.13-.461.085-.161.211-.332.372-.51.163-.181.36-.368.592-.573.23-.203.462-.431.699-.681.237-.249.48-.523.735-.815.085-.096.172-.198.26-.3.262-.306.54-.632.84-.977a42.908 42.908 0 0 1 2.082-2.254c1.75-1.75 2.283-3.504 2.255-4.869a4.952 4.952 0 0 0-.101-.879 67.477 67.477 0 0 1-.181-1.556 91.59 91.59 0 0 1-.302-3.596 120.29 120.29 0 0 1-.186-3.866c-.171-5.281-.028-10.618.358-13.987.04-.628.093-1.191.155-1.697a23.028 23.028 0 0 1 .33-1.955c.082-.368.163-.704.245-1.017.04-.154.079-.306.118-.45.02-.076.037-.145.057-.217.09-.356.175-.688.24-1.027.014-.069.025-.135.037-.204.1-.612.137-1.25.05-2.06a5.281 5.281 0 0 1-.087-.457 6.711 6.711 0 0 1-.062-1.349c.011-.296.04-.592.076-.885.053-.44.126-.882.197-1.322.048-.296.093-.59.132-.888.1-.744.147-1.5.051-2.287-.476-6.127-.214-13.37.502-20.275.03-.306.364-.398.519-.152 2.788 4.466 8.416 5.931 11.071 6.72Zm14.704-6.721c.154-.246.487-.154.518.152.716 6.906.978 14.149.502 20.275-.096.786-.048 1.543.05 2.287.04.299.085.592.133.888.07.44.144.881.197 1.322.037.293.065.589.076.885a7.33 7.33 0 0 1-.011.895 6.26 6.26 0 0 1-.138.912 7.323 7.323 0 0 0 .087 2.263c.065.339.15.671.24 1.027.02.072.037.14.057.217.039.144.079.295.118.45.082.313.163.649.245 1.017a26.261 26.261 0 0 1 .175.902c.056.322.107.674.155 1.053.062.506.115 1.069.155 1.697.386 3.369.53 8.706.358 13.987a120.088 120.088 0 0 1-.186 3.866 90.034 90.034 0 0 1-.302 3.596 68.15 68.15 0 0 1-.18 1.556c-.057.27-.093.566-.102.879-.028 1.365.504 3.119 2.255 4.869.808.81 1.485 1.566 2.082 2.254.3.345.578.671.84.977.088.102.175.204.26.3.256.292.499.566.735.815.237.25.468.478.7.681.23.204.428.392.591.573.161.178.288.349.372.51.084.161.13.316.13.461a.817.817 0 0 1-.014.144c-.062.29-.307.56-.77.829-.064.04-.126.076-.188.116-.02.013-.037.023-.054.036-.04.026-.082.053-.118.079l-.06.039c-.036.027-.07.05-.103.076l-.051.036c-.04.03-.08.059-.116.089a.442.442 0 0 0-.025.02c-.045.036-.09.072-.135.105l-.031.026a3.879 3.879 0 0 0-.096.079l-.048.04c-.034.026-.065.056-.099.082a.522.522 0 0 1-.07.056l-.043.036c-.033.03-.07.056-.101.083-.003.003-.006.006-.011.006l-.088.066-.03.023a.605.605 0 0 1-.066.043l-.036.023a.713.713 0 0 1-.062.036l-.034.02c-.026.013-.051.023-.076.036l-.023.01a.77.77 0 0 1-.099.032c-.008.004-.02.004-.028.007a.465.465 0 0 1-.073.013.163.163 0 0 1-.04.003c-.022.004-.047.004-.07.004h-.036c-.046 0-.09-.004-.141-.01-.009 0-.017-.003-.023-.003a1.114 1.114 0 0 1-.135-.03l-.037-.01a2.209 2.209 0 0 1-.206-.075c-.053-.023-.11-.05-.166-.076-.012-.007-.023-.01-.037-.017a2.802 2.802 0 0 1-.211-.115l-.054-.029c-.068-.04-.14-.086-.214-.132l-.031-.019c-.085-.053-.172-.115-.265-.178l-.068-.046c-.096-.065-.191-.135-.298-.211 0 0-.003 0-.003-.003-.462-.359-.925-.54-1.423-.852a4.609 4.609 0 0 1-.384-.267 5.12 5.12 0 0 1-.4-.345 6.715 6.715 0 0 1-.871-1.05 7.552 7.552 0 0 0-.463-.608c-1.074-1.277-2.116-1.593-2.925-1.905a1.703 1.703 0 0 1-.626-.415c-.228-.24-.411-.566-.532-1a4.448 4.448 0 0 1-.141-.908c-.028-.46-.008-1 .068-1.628.056-.471.092-1.044.107-1.695.005-.217.008-.441.008-.674 0-.701-.023-1.468-.065-2.284a54.892 54.892 0 0 0-.116-1.685 62.523 62.523 0 0 0-.281-2.661 57.044 57.044 0 0 0-.412-2.698c-.054-.296-.107-.593-.167-.885-1.231-7.548-3.694-7.906-3.077-14.375.23-2.424.333-3.79.335-4.626 0-.138-.002-.263-.005-.375a4.473 4.473 0 0 0-.023-.303 2.491 2.491 0 0 0-.036-.243 2 2 0 0 0-.08-.286 2.274 2.274 0 0 0-.191-.389c-.09-.157-.194-.338-.31-.608-.155-.359-.231-.898-.285-1.556a42.558 42.558 0 0 1-.068-1.066 53.38 53.38 0 0 0-.12-1.83 21.712 21.712 0 0 0-.153-1.306c-.164-1.102-.434-2.8-.916-3.81a23.214 23.214 0 0 1-.885-2.211 49.54 49.54 0 0 1-.592-1.79 72.126 72.126 0 0 1-.428-1.428c-.231-.803-.403-1.079-.606-1.862a98.838 98.838 0 0 1-.45-1.809l-.125-.53c-.053-.236-.107-.467-.155-.687-.057-.254-.107-.493-.155-.718a26.105 26.105 0 0 1-.251-1.368l-.003-.014c-.093-.648.254-1.276.8-1.434 2.657-.79 8.285-2.256 11.073-6.72Z"></path>
                                <path class="body-stomach" d="M38.174 63.832a57.94 57.94 0 0 0-.246-1.23c-.313-1.485-.682-2.027-1.04-3.334l-.058-.214c-.266-.969-.526-1.884-.745-2.736a30.853 30.853 0 0 1-.39-1.672c-.05-.263-.097-.517-.135-.765a10.51 10.51 0 0 1-.113-1.035c-.006-.117-.012-.234-.012-.346-.006-.854.154-1.568.559-2.124a6.112 6.112 0 0 0 .428-.713 6.91 6.91 0 0 0 .133-.273 10.8 10.8 0 0 0 .248-.587c.15-.384.287-.797.41-1.218.013-.046.028-.09.04-.135.053-.181.102-.362.15-.546.012-.04.02-.081.032-.122a31.607 31.607 0 0 0 .523-2.476c.06-1.371-1.61-1.6-4.608-1.36a.451.451 0 0 1-.112.01 20.2 20.2 0 0 1-2.304.132h-.07l-.072-.008c-2.142-.224-3.35-.729-4.23-1.099-.682-.285-1.034-.423-1.536-.423-.503 0-.854.138-1.536.423-.88.37-2.088.874-4.23 1.099l-.071.008h-.071a20.18 20.18 0 0 1-2.304-.133.436.436 0 0 1-.112-.01c-2.999-.24-4.668-.01-4.609 1.361a31.667 31.667 0 0 0 .523 2.475c.013.042.021.082.033.123.048.184.098.365.15.546.012.046.027.089.039.135.124.42.26.834.41 1.218.08.204.163.4.249.587.044.094.086.183.133.273a5.949 5.949 0 0 0 .428.714c.405.555.565 1.269.559 2.123a10.431 10.431 0 0 1-.124 1.381 21.86 21.86 0 0 1-.314 1.578c-.065.28-.136.564-.212.86-.219.85-.48 1.766-.745 2.735-.02.071-.038.143-.059.214-.357 1.308-.726 1.85-1.04 3.335-.085.4-.165.81-.245 1.229-.136.726.11 1.473.68 2.021 3.355 3.872 8.73 6.517 12.466 6.522h.006c3.737-.005 9.111-2.65 12.466-6.522.568-.548.813-1.295.678-2.021Z"></path>
                                <path class="body-arms" d="M9.129 38.23c-.358-.899-.542-1.897-.542-2.983 0-.74.1-1.473.258-2.195.17-.77.407-1.523.688-2.26.29-.76.627-1.506.996-2.231.364-.72.76-1.42 1.178-2.11.393-.646.806-1.277 1.236-1.896.326-.47.671-.925 1.014-1.38.088-.117-.017-.285-.158-.25a10.872 10.872 0 0 0-1.632.508c-.21.086-.445.168-.636.289-.035.017-.07.032-.105.05a13.034 13.034 0 0 0-2.3 1.362 10.82 10.82 0 0 0-1.116.95 9.62 9.62 0 0 0-1.873 2.528 9.492 9.492 0 0 0-.794 2.195 10.81 10.81 0 0 0-.258 1.94c0 2.565 0 3.848-1.28 6.413-1.28 2.565-1.28 6.413-1.28 8.335 0 1.083-.305 2.064-.628 3.114l-.108.352a21.7 21.7 0 0 0-.211.728 13.513 13.513 0 0 0-.334 1.576c-.17 1.192-.34 3.651-.413 6.129-.009.29-.015.584-.023.871-.007.29-.012.579-.012.863-.003.285-.003.564-.003.84a34.648 34.648 0 0 0 .03 1.562c.008.243.02.475.031.695.021.332.044.637.074.907.04.36.064.722.079 1.08.006.18.008.358.011.537C1.021 69.07.6 71.32.6 73.141c0 .772.076 1.846.305 2.923.105.49.24.98.416 1.444.14.37.304.725.498 1.045.58.963 1.421 1.64 2.622 1.64.639 0 .639-.64 0-1.602-.639-.962-.639-2.565-.639-3.528 0-.36.044-.675.117-.93.097-.337.246-.567.402-.643a.25.25 0 0 1 .12-.03c.1 0 .199.156.319.391l.114.229c.041.082.082.17.13.261l.093.185c.065.123.138.25.214.376.038.061.08.123.123.184a2.374 2.374 0 0 0 .85.77l.053.032c.076.04.147.08.217.111l.023.01a2.4 2.4 0 0 0 .176.064l.04.011a.67.67 0 0 0 .162.024c.012 0 .023-.003.032-.003.026-.003.053-.006.076-.012l.036-.012a.208.208 0 0 0 .055-.035c.009-.009.018-.015.026-.024a.212.212 0 0 0 .041-.067c.003-.009.009-.015.015-.027a.425.425 0 0 0 .026-.129v-.038c.003-.041 0-.085-.003-.132a1.605 1.605 0 0 0-.055-.3 3.686 3.686 0 0 0-.083-.27c-.032-.097-.07-.2-.114-.314-.24-.601-.346-1.291-.466-1.972a10.35 10.35 0 0 0-.199-.933 5.125 5.125 0 0 0-.114-.382c-.211-.62-.542-1.162-1.143-1.52-.6-.358-.841-.992-.874-1.726-.02-.466.047-.977.156-1.482.011-.047.02-.097.032-.144.05-.209.105-.414.164-.62l.053-.178c.15-.476.316-.925.466-1.3.638-1.603 3.2-8.336 3.2-11.221 0-1.172-.054-1.87-.03-2.39a3.213 3.213 0 0 1 .068-.54l.026-.1c.017-.064.04-.129.064-.194.14-.355.39-.716.832-1.268.041-.05.08-.102.12-.158.08-.112.155-.235.232-.37.076-.132.149-.276.222-.425.073-.15.144-.309.214-.473.18-.423.346-.887.498-1.35.342-1.14.667-2.545-1.398-7.77Zm31.749 0c-.003 0-.003 0 0 0 .357-.899.542-1.897.542-2.983 0-.74-.1-1.473-.258-2.195-.17-.77-.407-1.523-.688-2.26-.29-.76-.628-1.506-.997-2.231-.363-.72-.758-1.42-1.177-2.11a36.931 36.931 0 0 0-1.237-1.896c-.325-.47-.67-.925-1.014-1.38-.087-.117.018-.285.159-.25a10.872 10.872 0 0 1 1.632.508c.21.086.445.168.635.289l.106.05a13.034 13.034 0 0 1 2.3 1.362c.384.285.759.601 1.116.95a9.621 9.621 0 0 1 1.873 2.528c.337.66.61 1.391.794 2.195.137.605.228 1.25.257 1.94 0 2.565 0 3.848 1.281 6.413 1.28 2.565 1.28 6.413 1.28 8.335 0 1.083.305 2.064.628 3.114l.108.352c.073.238.144.479.21.728a13.295 13.295 0 0 1 .334 1.576c.171 1.192.34 3.652.414 6.129.009.29.015.584.023.871.006.29.012.579.012.863.003.285.003.564.003.84 0 .138 0 .273-.003.408a34.605 34.605 0 0 1-.026 1.153 39.13 39.13 0 0 1-.033.696c-.02.332-.044.637-.073.907-.04.36-.064.722-.079 1.08-.006.18-.008.358-.011.537-.015 2.328.41 4.573.41 6.395 0 .772-.076 1.847-.305 2.924-.105.49-.24.98-.416 1.444a6.48 6.48 0 0 1-.498 1.044c-.58.963-1.421 1.641-2.622 1.641-.639 0-.639-.64 0-1.602.639-.963.639-2.565.639-3.528 0-.361-.044-.675-.117-.93-.097-.338-.246-.567-.401-.644a.25.25 0 0 0-.12-.029c-.1 0-.2.156-.32.39l-.114.23c-.041.082-.082.17-.13.26-.028.06-.06.12-.093.185a7.28 7.28 0 0 1-.214.376 3.293 3.293 0 0 1-.123.185 2.371 2.371 0 0 1-.85.77l-.053.031c-.076.041-.146.08-.216.112l-.024.009c-.061.026-.12.047-.176.064-.014.003-.026.009-.04.012a.672.672 0 0 1-.162.024c-.011 0-.023-.003-.032-.003-.026-.003-.053-.006-.076-.012-.012-.003-.023-.009-.035-.012a.208.208 0 0 1-.056-.035l-.026-.023a.216.216 0 0 1-.041-.068c-.003-.009-.009-.015-.015-.026a.424.424 0 0 1-.026-.13v-.038c-.003-.04 0-.085.003-.132l.009-.07a1.613 1.613 0 0 1 .047-.23 3.57 3.57 0 0 1 .082-.27c.032-.096.07-.199.114-.314.24-.601.346-1.29.466-1.972.056-.317.117-.63.2-.933.035-.13.07-.258.114-.382.21-.619.542-1.162 1.142-1.52.601-.358.841-.992.874-1.725.02-.467-.047-.978-.156-1.483-.011-.047-.02-.097-.032-.144a14.84 14.84 0 0 0-.164-.619l-.053-.18a18.89 18.89 0 0 0-.466-1.3c-.638-1.602-3.199-8.335-3.199-11.22 0-1.171.053-1.87.03-2.39a3.261 3.261 0 0 0-.068-.54 2.419 2.419 0 0 0-.09-.294c-.142-.354-.39-.715-.833-1.267a4.253 4.253 0 0 1-.352-.528 7.415 7.415 0 0 1-.222-.426c-.073-.15-.144-.308-.214-.473a17.634 17.634 0 0 1-.498-1.35c-.336-1.144-.66-2.55 1.407-7.774Z"></path>
                                <path class="body-chest" d="M39.636 33.375c-.196-.922-.504-1.82-.867-2.692a25.389 25.389 0 0 0-1.301-2.638 33.482 33.482 0 0 0-1.485-2.392 37.083 37.083 0 0 0-1.92-2.583c-.395-.458-1.236-1.183-3.044-.52a.234.234 0 0 1-.03.009c-.043.017-.087.038-.134.055-.99.39-1.998.743-3.03 1.019-.916.246-1.872.46-2.827.46-.955 0-1.91-.21-2.827-.46a29.12 29.12 0 0 1-3.03-1.019c-.044-.017-.087-.038-.134-.055a.252.252 0 0 0-.03-.009c-1.805-.663-2.649.062-3.044.52a35.494 35.494 0 0 0-1.92 2.583 33.482 33.482 0 0 0-1.484 2.392 24.98 24.98 0 0 0-1.301 2.638 15.14 15.14 0 0 0-.867 2.692 8.953 8.953 0 0 0-.214 1.872 7.509 7.509 0 0 0 .181 1.667c.12.514.296.987.522 1.421a5.726 5.726 0 0 0 1.078 1.438 6.534 6.534 0 0 0 1.158.892 8.028 8.028 0 0 0 1.38.67c.37.14.759.26 1.163.36.27.068.545.126.826.176.282.05.569.091.862.124.586.064 1.192.097 1.817.097 3.504-.423 4.101-1.761 5.86-1.761 1.758 0 2.355 1.338 5.86 1.76.624 0 1.23-.032 1.816-.096.293-.033.58-.074.862-.124.281-.05.556-.108.826-.176a10.146 10.146 0 0 0 1.527-.508 8.108 8.108 0 0 0 1.017-.522 6.552 6.552 0 0 0 1.158-.892 5.726 5.726 0 0 0 1.078-1.438c.225-.434.4-.907.52-1.42.06-.259.106-.526.135-.802a8.342 8.342 0 0 0-.157-2.738Z"></path>
                                <path class="body-head" d="M32.476 10.132v-.015a.78.78 0 0 0-.123-.35.072.072 0 0 1-.018-.02.479.479 0 0 0-.102-.1c-.006-.003-.009-.008-.015-.011a.586.586 0 0 0-.179-.077.694.694 0 0 0-.179-.023c-.011 0-.023 0-.035.003a.89.89 0 0 0-.152.015 1.275 1.275 0 0 1-.056.008 2.645 2.645 0 0 0-.214.056c.021-.059.039-.126.056-.194.035-.138.064-.293.09-.458.015-.082.027-.167.039-.253.023-.173.04-.352.055-.53.009-.089.015-.18.021-.268.012-.176.023-.35.03-.51.026-.564.026-.992.026-.992 0-.174-.01-.347-.021-.514-.106-1.7-.736-3.12-1.797-4.141a5.776 5.776 0 0 0-1.37-.972 6.7 6.7 0 0 0-.906-.373 7.499 7.499 0 0 0-.803-.223 8.543 8.543 0 0 0-1.31-.17 7.619 7.619 0 0 0-.509-.02 7.21 7.21 0 0 0-.512.02 8.543 8.543 0 0 0-1.31.17 7.407 7.407 0 0 0-.803.224 6.33 6.33 0 0 0-.905.373c-.516.264-.973.59-1.372.971-1.06 1.021-1.69 2.442-1.796 4.141-.012.17-.02.34-.02.514a23.947 23.947 0 0 0 .055 1.502l.02.268c.015.179.036.358.056.53.012.086.023.171.038.253.027.165.056.32.091.458.018.07.035.135.056.194a1.365 1.365 0 0 0-.214-.055l-.056-.009a.976.976 0 0 0-.152-.015c-.012 0-.023-.003-.035-.003a.679.679 0 0 0-.358.1c-.006.003-.009.009-.015.012a.537.537 0 0 0-.102.1c-.006.006-.012.011-.018.02a.688.688 0 0 0-.073.141c-.003.012-.009.023-.012.032a.82.82 0 0 0-.038.177v.014a1.401 1.401 0 0 0 0 .238c.006.073.018.147.032.226.003.014.006.032.012.046.018.083.04.168.07.256a2.1 2.1 0 0 1 .05.176c0 .006.003.009.003.012.015.062.03.126.044.194.003.008.003.018.006.023a4.274 4.274 0 0 1 .05.25c.014.073.029.146.04.223.015.082.033.164.047.246l.006.033c.015.079.033.161.05.243.003.009.003.018.006.03.018.082.038.163.059.246.003.006.003.014.006.02a4.244 4.244 0 0 0 .155.505v.003c.03.077.061.153.094.224l.008.017c.033.068.068.135.106.197l.014.023c.039.059.076.115.12.167l.018.024c.044.05.088.097.138.137l.023.018a.91.91 0 0 0 .158.103c.009.006.018.008.026.011.059.03.117.05.185.068.009.003.018.003.026.006a.993.993 0 0 0 .214.023h.02c.08 0 .162-.008.25-.026 0 .42 0 1.209.108 2.046.023.182.059.381.102.584.226 1.01.69 1.987 1.178 2.486 1.38 1.411 2.728 2.465 4.052 2.465 1.324 0 2.672-1.053 4.052-2.465.49-.502.956-1.48 1.178-2.486.04-.203.08-.402.102-.584.109-.837.109-1.623.109-2.046.088.018.17.026.249.026h.02a.99.99 0 0 0 .214-.023l.027-.006a.818.818 0 0 0 .184-.068l.026-.011c.056-.03.109-.065.159-.103l.023-.018c.05-.04.094-.088.137-.137.006-.01.012-.015.018-.024.044-.053.082-.108.12-.167l.015-.023a1.79 1.79 0 0 0 .105-.197l.009-.017c.032-.074.064-.147.094-.224V13.1c.029-.08.055-.164.082-.247 0-.002 0-.002.003-.005l.07-.253c.003-.006.003-.015.006-.02.02-.083.04-.165.058-.247.003-.009.003-.018.006-.03.018-.082.036-.161.05-.243l.006-.032c.018-.082.032-.167.047-.247.015-.076.03-.152.041-.223l.009-.04c.014-.071.026-.142.04-.21.003-.008.003-.017.006-.023l.044-.194c0-.006.003-.008.003-.011.018-.065.033-.123.05-.176.03-.088.053-.174.07-.256l.012-.047a2.27 2.27 0 0 0 .035-.266c-.002-.068-.002-.136-.008-.197Z"></path>
                            </svg>
                        </div>
                        <div class="stats-body-hits">
                            <div class="stats-list">
                                <div>
                                    <p class="hit-perc">0.0% of Hits - <span id="headHits">0</span> Hits</p>
                                </div>
                                <div>
                                    <p class="hit-perc">0.0% of Hits - <span id="headHits">0</span> Hits</p>
                                </div>
                                <div>
                                    <p class="hit-perc">0.0% of Hits - <span id="headHits">0</span> Hits</p>
                                </div>
                                <div>
                                    <p class="hit-perc">0.0% of Hits - <span id="headHits">0</span> Hits</p>
                                </div>
                                <div>
                                    <p class="hit-perc">0.0% of Hits - <span id="headHits">0</span> Hits</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="user-achievements profile-section">
                ${renderSingleAchievement(latestAchievement)}
            </div>

            <div class="weapon-stats profile-section">
                <h3>Achievements</h3>
                <div class="weapon-stats-container" id="achievements-container">
                </div>
            </div>
            
        </div>

        <!-- Central -->
        <div class="center-column">

            <!-- Raid History -->
            <div class="raid-block">
                <div class="last-raids" id="raids-stats-container">
                    <div class="loader-glass">
                        <div class="loader-content" id="main-profile-loader">
                            <img src="media/loading_bar.gif" width="30" height="30" class="loader-icon">
                            <h3 class="loader-text">Crunching latest data for you...</h3>
                            <div class="loader-progress">
                                <div class="progress-bar"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="raid-summary profile-section">
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-value">${player.currentWinstreak}</div>
                            <div class="stat-label">Current Raid Streak</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${player.longestShot}m</div>
                            <div class="stat-label">Longest Killshot</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${player.pmcKills}</div>
                            <div class="stat-label">PMC Kills</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${player.scavsKilled}</div>
                            <div class="stat-label">SCAV Kills</div>
                        </div>
                        <div class="stat-card">
                          <div class="stat-value">${player.bossesKilled}</div>
                          <div class="stat-label">Bosses Killed</div>
                        </div>
                        <div class="stat-card">
                          <div class="stat-value">${player.damage}</div>
                          <div class="stat-label">Damage Dealt</div>
                        </div>
                    </div>

                    <div class="recent-raids-stats" id="recent-raids-stats">
                        <!-- JavaScript -->
                    </div>
                </div>

            </div>

            <div class="profile-section">
                <div class="comment-form">
                    <textarea class="comment-input" id="comment-text" placeholder="Write your comment... (Must Be logged in SPTLB Network)"></textarea>
                    <button class="comment-submit" id="submit-comment">
                        <i class='bx bx-send'></i>
                        Send
                    </button>
                </div>
                
                <div class="divider"></div>
            
                <div class="comments-list">
                </div>
            </div>
        </div>

        <!-- Right -->
        <div class="right-column">

            <!-- Player image -->
            <div class="playermodel profile-section" id="playermodel">
                <h3>Player Pre-Raid Preview</h3>
                <div class="playermodel-image">
                    <img src="/api/data/pmc_avatars/${player.id}_full.png?t=${Date.now}" alt="Player model preview" onerror="this.src='media/default_full_pmc_avatar.png';" />
                </div>
            </div>

        <!-- Friend list (hides if no friends) -->
            <div class="friends-list profile-section" id="friend-list">
                <h3>Friend List</h3>
                <div class="friends-container" id="friends-container">
                </div>
            </div>

            <!-- Meta gun -->
            <div class="favorite-weapons profile-section" id="weapon-meta-section">
                <h3>Favorite Weapon</h3>
                <div class="favorite-weapons-container" id="weapon-container">
                        ${!player?.isUsingStattrack ? `
                <div class="stattrack-overlay">
                    <div class="stattrack-message">This player is not using <a href="https://hub.sp-tarkov.com/files/file/2501-stattrack/">Stattrack Mod</a> by AcidPhantasm</div>
                </div>
                ` : ''}
                
                <div class="weapon-info ${!player?.isUsingStattrack ? 'stattrack-disabled' : ''}">
                <img src="media/weapon_icons/${bestWeapon?.name}.webp" alt="bestWeapon?.name" class="weapon-icon-fav">
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

            <!-- All weapons list if they exist -->
            ${!player?.isUsingStattrack ? `` :
            `<div class="weapon-stats profile-section">
                <h3>Weapons</h3>
                <div class="weapon-stats-container" id="weapons-container">
                </div>
            </div>`
        }

            <!-- Trader Standing -->
            <div class="standing-stats profile-section">
                <h3>Standings</h3>
                <div class="standing-container" id="standing-container">
                    <div class="trader-grid">
                        <div class="trader-card" data-unlocked="${player.traderInfo.PRAPOR.unlocked}">
                            <div class="trader-image-container">
                                <img src="media/traders/prapor.png" alt="Prapor" class="trader-image" />
                                <div class="trader-lock" style="display: ${!player.traderInfo.PRAPOR.unlocked ? 'block' : 'none'};">🔒</div>
                            </div>
                            <div class="trader-name">Prapor</div>
                            <div class="trader-standing">Loyalty: ${player.traderInfo ? Number(player.traderInfo.PRAPOR.standing.toFixed(2)) : 0}</div>
                            <div class="trader-standing">Money Traded: ${player.traderInfo ? formatSalesNum(Number(player.traderInfo.PRAPOR.salesSum)) : 0}</div>
                        </div>

                        <div class="trader-card" data-unlocked="${player.traderInfo.THERAPIST.unlocked}">
                            <div class="trader-image-container">
                                <img src="media/traders/therapist.png" alt="Therapist" class="trader-image" />
                                <div class="trader-lock" style="display: ${!player.traderInfo.THERAPIST.unlocked ? 'block' : 'none'};">🔒</div>
                            </div>
                            <div class="trader-name">Therapist</div>
                            <div class="trader-standing">Loyalty: ${player.traderInfo ? Number(player.traderInfo.THERAPIST.standing.toFixed(2)) : 0}</div>
                            <div class="trader-standing">Money Traded: ${player.traderInfo ? formatSalesNum(Number(player.traderInfo.THERAPIST.salesSum)) : 0}</div>
                        </div>

                        <div class="trader-card" data-unlocked="${player.traderInfo.FENCE.unlocked}">
                            <div class="trader-image-container">
                                <img src="media/traders/fence.png" alt="Fence" class="trader-image" />
                                <div class="trader-lock" style="display: ${!player.traderInfo.FENCE.unlocked ? 'block' : 'none'};">🔒</div>
                            </div>
                            <div class="trader-name">Fence</div>
                            <div class="trader-standing">Loyalty: ${player.traderInfo ? Number(player.traderInfo.FENCE.standing.toFixed(2)) : 0}</div>
                            <div class="trader-standing">Money Traded: ${player.traderInfo ? formatSalesNum(Number(player.traderInfo.FENCE.salesSum)) : 0}</div>
                        </div>

                        <div class="trader-card" data-unlocked="${player.traderInfo.SKIER.unlocked}">
                            <div class="trader-image-container">
                                <img src="media/traders/skier.png" alt="Skier" class="trader-image" />
                                <div class="trader-lock" style="display: ${!player.traderInfo.SKIER.unlocked ? 'block' : 'none'};">🔒</div>
                            </div>
                            <div class="trader-name">Skier</div>
                            <div class="trader-standing">Loyalty: ${player.traderInfo ? Number(player.traderInfo.SKIER.standing.toFixed(2)) : 0}</div>
                            <div class="trader-standing">Money Traded: ${player.traderInfo ? formatSalesNum(Number(player.traderInfo.SKIER.salesSum)) : 0}</div>
                        </div>

                        <div class="trader-card" data-unlocked="${player.traderInfo.PEACEKEEPER.unlocked}">
                            <div class="trader-image-container">
                                <img src="media/traders/peacekeeper.png" alt="Peacekeeper" class="trader-image" />
                                <div class="trader-lock" style="display: ${!player.traderInfo.PEACEKEEPER.unlocked ? 'block' : 'none'};">🔒</div>
                            </div>
                            <div class="trader-name">Peacekeeper</div>
                            <div class="trader-standing">Loyalty: ${player.traderInfo ? Number(player.traderInfo.PEACEKEEPER.standing.toFixed(2)) : 0}</div>
                            <div class="trader-standing">Money Traded: ${player.traderInfo ? formatSalesNum(Number(player.traderInfo.PEACEKEEPER.salesSum)) : 0}</div>
                        </div>

                        <div class="trader-card" data-unlocked="${player.traderInfo.MECHANIC.unlocked}">
                            <div class="trader-image-container">
                                <img src="media/traders/mechanic.png" alt="Mechanic" class="trader-image" />
                                <div class="trader-lock" style="display: ${!player.traderInfo.MECHANIC.unlocked ? 'block' : 'none'};">🔒</div>
                            </div>
                            <div class="trader-name">Mechanic</div>
                            <div class="trader-standing">Loyalty: ${player.traderInfo ? Number(player.traderInfo.MECHANIC.standing.toFixed(2)) : 0}</div>
                            <div class="trader-standing">Money Traded: ${player.traderInfo ? formatSalesNum(Number(player.traderInfo.MECHANIC.salesSum)) : 0}</div>
                        </div>

                        <div class="trader-card" data-unlocked="${player.traderInfo.RAGMAN.unlocked}">
                            <div class="trader-image-container">
                                <img src="media/traders/ragman.png" alt="Ragman" class="trader-image" />
                                <div class="trader-lock" style="display: ${!player.traderInfo.RAGMAN.unlocked ? 'block' : 'none'};">🔒</div>
                            </div>
                            <div class="trader-name">Ragman</div>
                            <div class="trader-standing">Loyalty: ${player.traderInfo ? Number(player.traderInfo.RAGMAN.standing.toFixed(2)) : 0}</div>
                            <div class="trader-standing">Money Traded: ${player.traderInfo ? formatSalesNum(Number(player.traderInfo.RAGMAN.salesSum)) : 0}</div>
                        </div>

                        <div class="trader-card" data-unlocked="${player.traderInfo.JAEGER.unlocked}">
                            <div class="trader-image-container">
                                <img src="media/traders/jaeger.png" alt="Jaeger" class="trader-image" />
                                <div class="trader-lock" style="display: ${!player.traderInfo.JAEGER.unlocked ? 'block' : 'none'};">🔒</div>
                            </div>
                            <div class="trader-name">Jaeger</div>
                            <div class="trader-standing">Loyalty: ${player.traderInfo ? Number(player.traderInfo.JAEGER.standing.toFixed(2)) : 0}</div>
                            <div class="trader-standing">Money Traded: ${player.traderInfo ? formatSalesNum(Number(player.traderInfo.JAEGER.salesSum)) : 0}</div>
                        </div>

                        <div class="trader-card" data-unlocked="${player.traderInfo.REF.unlocked}">
                            <div class="trader-image-container">
                                <img src="media/traders/ref.png" alt="Ref" class="trader-image" />
                                <div class="trader-lock" style="display: ${!player.traderInfo.REF.unlocked ? 'block' : 'none'};">🔒</div>
                            </div>
                            <div class="trader-name">Ref</div>
                            <div class="trader-standing">Loyalty: ${player.traderInfo ? Number(player.traderInfo.REF.standing.toFixed(2)) : 0}</div>
                            <div class="trader-standing">Money Traded: ${player.traderInfo ? formatSalesNum(Number(player.traderInfo.REF.salesSum)) : 0}</div>
                        </div>

                        <div class="trader-card" data-unlocked="${player.traderInfo.LIGHTKEEPER.unlocked}">
                            <div class="trader-image-container">
                                <img src="media/traders/lightkeeper.png" alt="Lightkeeper" class="trader-image" />
                                <div class="trader-lock" style="display: ${!player.traderInfo.LIGHTKEEPER.unlocked ? 'block' : 'none'};">🔒</div>
                            </div>
                            <div class="trader-name">Lightkeeper</div>
                            <div class="trader-standing">Loyalty: ${player.traderInfo ? Number(player.traderInfo.LIGHTKEEPER.standing.toFixed(2)) : 0}</div>
                            <div class="trader-standing">Money Traded: ${player.traderInfo ? formatSalesNum(Number(player.traderInfo.PRAPOR.salesSum)) : 0}</div>
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
    `;
    // Setup close handlers first
    setupModalCloseHandlers();

    // Render stats and init the profile
    // Skip this if player is not using Stattrack
    if (player.isUsingStattrack) {
        renderWeaponList(player.id, player.modWeaponStats || {});
    }

    if (player.raidHitsHistory) {
        updateBodyHitsVisualization(player.raidHitsHistory);
    }

    processPlayerAchievements(player, {
        renderAll: true,
        container: document.getElementById('achievements-container')
    });

    initLastRaids(player.id);
    renderFriendList(player);
    initHOF(player, bestWeapon);
    loadComments(player.id);

    //
    // Auto Status Updater
    //
    function startStatusUpdater(playerId, statusElement) {
        let raidTimeAnimator = null;

        const updateStatus = async () => {
            try {
                const playerStatus = heartbeatMonitor.getPlayerStatus(playerId);
                const isOnline = playerStatus.isOnline;

                let newStatusHTML = '';

                if (!player.banned) {
                    if (isOnline) {
                        if (playerStatus.raidDetails !== null) {
                            newStatusHTML = `<span class="player-status-lb ${playerStatus.statusClass}">In raid <div id="blink"></div></span>`;
                        } else {
                            newStatusHTML = `<span class="player-status-lb ${playerStatus.statusClass}">${playerStatus.statusText} <div id="blink"></div></span>`;
                        }
                    } else {
                        const lastOnlineTime = window.heartbeatMonitor.getLastOnlineTime(
                            playerStatus.lastUpdate || player.lastPlayed
                        );
                        newStatusHTML = `<span class="last-online-time">Last seen ${lastOnlineTime}</span>`;
                    }
                } else {
                    newStatusHTML = `<span class="last-online-time">Banned</span>`;
                }

                if (statusElement.innerHTML !== newStatusHTML) {
                    statusElement.innerHTML = newStatusHTML;
                    initLastRaids(playerId);

                    const raidInfoElement = document.querySelector('.raid-details');
                    if (isOnline && playerStatus.raidDetails !== null && raidInfoElement) {
                        raidInfoElement.style.display = 'flex';
                        raidInfoElement.innerHTML = `
                            <span class="raid-map">Map: ${getPrettyMapName(playerStatus.raidDetails.map)}</span>
                            <span class="raid-side">Side: ${playerStatus.raidDetails.side}</span>
                            <span class="raid-time">Time: ${playerStatus.raidDetails.gameTime}</span>
                        `;

                        // Init the thing
                        const timeElement = raidInfoElement.querySelector('.raid-time');
                        if (timeElement) {
                            if (!raidTimeAnimator) {
                                raidTimeAnimator = new RaidTimeAnimator(timeElement, 7);
                            }
                            raidTimeAnimator.start(playerStatus.raidDetails.gameTime);
                        }
                    } else if (raidInfoElement) {
                        raidInfoElement.style.display = 'none';
                        // Stop animation
                        if (raidTimeAnimator) {
                            raidTimeAnimator.stop();
                        }
                    }
                }
            } catch (error) {
                console.error('Error updating status:', error);
            }
        };

        updateStatus();
        const intervalId = setInterval(updateStatus, 5000);

        return {
            intervalId: intervalId,
            stopTimeAnimator: () => {
                if (raidTimeAnimator) {
                    raidTimeAnimator.stop();
                }
            }
        };
    }

    // I have no clue, this is bullshit but it works
    class RaidTimeAnimator {
        constructor(timeElement, timeMultiplier = 7) {
            this.timeElement = timeElement;
            this.timeMultiplier = timeMultiplier;
            this.intervalId = null;
            this.currentTime = null;
        }

        start(initialTime) {
            this.stop(); // Stop last animation

            // parse format HH:MM:SS
            const timeStr = initialTime.replace('Time: ', '');
            let [hours, minutes, seconds] = timeStr.split(':').map(Number);

            this.currentTime = {
                hours: hours,
                minutes: minutes,
                seconds: seconds
            };

            // 500ms update
            this.intervalId = setInterval(() => this.update(), 500);
            this.updateDisplay(); // First display
        }

        stop() {
            if (this.intervalId) {
                clearInterval(this.intervalId);
                this.intervalId = null;
            }
        }

        update() {
            if (!this.currentTime) return;

            this.currentTime.seconds += this.timeMultiplier;

            // Some time correction
            if (this.currentTime.seconds >= 60) {
                this.currentTime.minutes += Math.floor(this.currentTime.seconds / 60);
                this.currentTime.seconds = this.currentTime.seconds % 60;
            }
            if (this.currentTime.minutes >= 60) {
                this.currentTime.hours += Math.floor(this.currentTime.minutes / 60);
                this.currentTime.minutes = this.currentTime.minutes % 60;
            }
            if (this.currentTime.hours >= 24) {
                this.currentTime.hours = this.currentTime.hours % 24;
            }

            this.updateDisplay();
        }

        updateDisplay() {
            if (!this.currentTime) return;

            const formattedTime = [
                Math.floor(this.currentTime.hours).toString().padStart(2, '0'),
                Math.floor(this.currentTime.minutes).toString().padStart(2, '0'),
                Math.floor(this.currentTime.seconds).toString().padStart(2, '0')
            ].join(':');

            this.timeElement.textContent = `Time: ${formattedTime}`;
        }

        setTime(newTime) {
            const timeStr = newTime.replace('Time: ', '');
            let [hours, minutes, seconds] = timeStr.split(':').map(Number);

            this.currentTime = {
                hours: hours,
                minutes: minutes,
                seconds: seconds
            };

            this.updateDisplay();
        }
    }

    // Close button stuff
    let statusUpdater;
    const statusElement = container.querySelector('.player-status span');
    statusUpdater = startStatusUpdater(player.id, statusElement);
    const closeButton = document.getElementById('closeButton');
    closeButton.addEventListener('click', () => {
        if (statusUpdater) {
            clearInterval(statusUpdater.intervalId);
            statusUpdater.stopTimeAnimator();
        }
    });

    // Comment sending functionality
    const commentSubmit = document.getElementById('submit-comment');
    const commentInput = document.getElementById('comment-text');
    commentSubmit.addEventListener('click', function () {
        if (commentInput.value.trim() === '') {
            commentInput.focus();
            return;
        }

        // Send comment
        submitComment(commentInput.value.trim(), player.id);
    });

    commentInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            commentSubmit.click();
        }
    });

    function submitComment(commentText, receiverId) {
        const url = new URL('/api/network/explore/index.php');

        url.searchParams.append('comment', commentText);
        url.searchParams.append('receiverId', receiverId);
        url.searchParams.append('timestamp', Date.now());
        url.searchParams.append('source', 'gh_pages');

        // Оpen in new thing
        window.open(url.toString(), '_blank');

        commentInput.value = '';
    }
}

// Comments sending 
async function loadComments(playerId) {
    try {
        const response = await fetch(`/api/network/explore/comments/player_${playerId}.json?t=${Date.now}`);

        if (!response.ok) {
            // If doesn't exist, show empty state
            if (response.status === 404) {
                displayNoComments();
                return;
            }
            throw new Error('Failed to load comments');
        }

        const comments = await response.json();
        displayComments(comments);

    } catch (error) {
        console.error('Error loading comments:', error);
        displayNoComments();
    }
}

// Function to display comments in the UI
function displayComments(comments) {
    const commentsList = document.querySelector('.comments-list');

    // Clear existing comments
    commentsList.innerHTML = '';

    if (!comments || comments.length === 0) {
        displayNoComments();
        return;
    }

    // Sort comments by timestamp (newest first)
    comments.sort((a, b) => b.timestamp - a.timestamp);

    // Create and append each comment
    comments.forEach(comment => {
        const commentElement = createCommentElement(comment);
        commentsList.appendChild(commentElement);
    });
}

// Function to create individual comment element
function createCommentElement(comment) {
    const commentDiv = document.createElement('div');
    commentDiv.className = 'comment';

    const commentDate = new Date(comment.timestamp * 1000);
    const formattedDate = formatDate(commentDate);

    // Decode text to look normal
    const decodedText = decodeHtmlEntities(comment.text);

    commentDiv.innerHTML = `
        <div class="comment-header">
            <img src="${comment.avatar || 'media/default_avatar.png'}" 
                 alt="User Avatar" class="user-avatar">
            <div class="user-info">
                <div class="user-name">${comment.author || 'Anonymous'}</div>
                <div class="comment-date">${formattedDate}</div>
            </div>
        </div>
        <div class="comment-content">
            ${decodedText}
        </div>
    `;

    return commentDiv;
}

// display "no comments if.. no comments lmao
function displayNoComments() {
    const commentsList = document.querySelector('.comments-list');
    commentsList.innerHTML = `
        <div class="no-comments">
            <i class='bx bx-message-rounded'></i>
            <p>No comments yet</p>
            <span>Be the first to leave a comment!</span>
        </div>
    `;
}

// format date
function formatDate(date) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${month} ${day} ${year}, ${hours}:${minutes}`;
}

// Decode comments we got from file
function decodeHtmlEntities(text) {
    const entities = {
        '&#39;': "'",
        '&quot;': '"',
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>'
    };

    return text.replace(/&#?\w+;/g, match => entities[match] || match);
}

// Body hits functions
function updateBodyHitsVisualization(raidHitsHistory) {
    // Sum up all player hits
    const totalHits = {
        head: 0,
        chest: 0,
        stomach: 0,
        leftArm: 0,
        rightArm: 0,
        leftLeg: 0,
        rightLeg: 0
    };

    raidHitsHistory.forEach(game => {
        for (const part in game) {
            totalHits[part] += game[part];
        }
    });

    const groupedHits = {
        head: totalHits.head,
        chest: totalHits.chest,
        stomach: totalHits.stomach,
        arms: totalHits.leftArm + totalHits.rightArm,
        legs: totalHits.leftLeg + totalHits.rightLeg
    };

    // Get total hits
    const totalAllHits = Object.values(groupedHits).reduce((sum, hits) => sum + hits, 0);
    const maxHits = Math.max(...Object.values(groupedHits));

    const getColorStyle = (hits, max) => {
        // If body part has no hits, return this
        if (hits === 0) return { color: '#cdcdcd', opacity: '0.5' };

        const intensity = hits / max;
        const mixFactor = Math.pow(intensity, 0.7);

        // #cdcdcd5e to #64ffda
        return {
            color: `rgb(${Math.floor(205 + (100 - 205) * mixFactor)
                }, ${Math.floor(205 + (255 - 205) * mixFactor)
                }, ${Math.floor(205 + (218 - 205) * mixFactor)
                })`,
            opacity: 0.37 + (0.95 - 0.37) * mixFactor
        };
    };

    // Update CSS for body parts
    const hitParts = ['head', 'chest', 'arms', 'stomach', 'legs'];
    document.querySelectorAll('.hit-perc').forEach((element, index) => {
        const part = hitParts[index];
        const hits = groupedHits[part] || 0;
        const percentage = totalAllHits > 0 ? (hits / totalAllHits * 100).toFixed(1) : '0.0';

        element.innerHTML = `${capitalize(hitParts[index])}: ${percentage}% of Hits - <span>${hits} Hits</span>`;
        const intensity = maxHits > 0 ? hits / maxHits : 0;
        const styles = getColorStyle(hits, maxHits);

        Object.assign(element.style, {
            color: styles.color,
            opacity: styles.opacity,
            fontSize: `${0.9 + (intensity * 0.3)}rem`,
            fontWeight: 400 + Math.floor(intensity * 200)
        });
    });

    const bodyElements = {
        'head': '.body-head',
        'chest': '.body-chest',
        'arms': '.body-arms',
        'stomach': '.body-stomach',
        'legs': '.body-legs'
    };

    // Now fill SVG bodies to appropriate colors (same as text ones)
    Object.entries(bodyElements).forEach(([part, selector]) => {
        const element = document.querySelector(selector);
        if (!element) return;

        const hits = groupedHits[part] || 0;
        const intensity = maxHits > 0 ? hits / maxHits : 0;

        if (hits === 0) {
            Object.assign(element.style, {
                fill: '#808080ff',
                opacity: '0.15'
            });
        } else {
            Object.assign(element.style, {
                fill: '#64ffda',
                opacity: (intensity * 0.75).toString()
            });
        }
    });

    // Headshot % header
    const headshotPercentage = totalAllHits > 0
        ? (groupedHits.head / totalAllHits * 100).toFixed(1)
        : '0.0';

    const avgElement = document.querySelector('.avg-headshots span');
    avgElement.textContent = `Avg. Headshot % Last 5 Games: ${headshotPercentage}%`;
}

async function renderWeaponList(playerId, modWeaponStats) {
    const weaponsContainer = document.getElementById('weapons-container');
    weaponsContainer.innerHTML = '';

    const playerWeapons = modWeaponStats[playerId];

    // Sort weapons by most kills from top to bottom to show
    const sortedWeapons = Object.entries(playerWeapons)
        .filter(([_, weaponData]) => weaponData.stats?.kills > 0)
        .sort((a, b) => (b[1].stats?.kills || 0) - (a[1].stats?.kills || 0));

    const weaponList = document.createElement('ul');
    weaponList.className = 'weapon-list';

    sortedWeapons.forEach(([weaponName, weaponData], index) => {
        // Clean weapon names from stars
        const cleanWeaponName = weaponName.replace(/[★☆]/g, "");

        const kills = weaponData.stats?.kills || 0;
        const shotsFired = weaponData.stats?.totalShots || 0;
        const timesLost = weaponData.stats?.timesLost || 0;
        const headshots = weaponData.stats?.headshots || 0;
        const accuracy = shotsFired > 0 ? ((kills / shotsFired) * 100).toFixed(1) + '%' : '0%';

        const weaponItem = document.createElement('li');
        weaponItem.className = 'weapon-item';

        // First 3 weapons have backgrounds
        if (index === 0) {
            weaponItem.classList.add('weapon-gold');
        } else if (index === 1) {
            weaponItem.classList.add('weapon-silver');
        } else if (index === 2) {
            weaponItem.classList.add('weapon-bronze');
        }

        weaponItem.classList.add('profile-section');

        weaponItem.innerHTML = `
            <div class="weapon-info">
                <div class="weapon-name">${weaponName}</div>
                <div class="weapon-infos">
                    <div class="stat"><span class="stat-label">Kills:</span> ${kills}</div>
                    <div class="stat"><span class="stat-label">Shots:</span> ${shotsFired}</div>
                    <div class="stat"><span class="stat-label">Accuracy:</span> ${accuracy}</div>
                    <div class="stat"><span class="stat-label">Lost:</span> ${timesLost}</div>
                    <div class="stat"><span class="stat-label">Headshots:</span> ${headshots}</div>
                </div>
            </div>
            <div class="weapon-icon">
                <img src="media/weapon_icons/${cleanWeaponName}.webp" alt="${weaponName}" onerror="this.src='media/default_weapon_icon.png';" />
            </div>
        `;

        weaponList.appendChild(weaponItem);
    });

    weaponsContainer.appendChild(weaponList);
}

// Clean weapon name helper
function cleanWeaponName(weaponName) {
    return weaponName.replace(/[★☆]/g, "");
}

function getBestWeapon(playerId, modWeaponStats) {
    if (!modWeaponStats || !modWeaponStats[playerId]) {
        return null;
    }

    let maxKills = 0;
    let bestWeapon = null;
    const playerWeapons = modWeaponStats[playerId];

    // Go through all weapons
    for (const [weaponName, weaponData] of Object.entries(playerWeapons)) {
        const kills = weaponData.stats?.kills || 0;

        const cleanWeaponNames = cleanWeaponName(weaponName);
        // Found best weapon by kills and assign data
        if (kills > maxKills) {
            maxKills = kills;
            bestWeapon = {
                name: cleanWeaponNames,
                ...weaponData,
            };
        }
    }

    return bestWeapon;
}

// Helper function to generate side images HTML
function getPlayerSideImageHTML(player) {
    // Add faction badge
    if (player.pmcSide === "Bear") {
        return `<img src="media/Bear.png" width="70" height="70" alt="BEAR">`;
    } else if (player.pmcSide === "Usec") {
        return `<img src="media/Usec.png" width="70" height="70" alt="USEC">`;
    }
}

// Helper function to generate badges HTML
function generateBadgesHTML(player) {
    let badges = "";

    const seasonTiers = [
        {
            condition: (seasons) => seasons > 1 && seasons <= 2,
            icon: "bx bxs-joystick",
            style: "",
            tooltip: (seasons) => `This player has been around for ${seasons} seasons!`
        },
        {
            condition: (seasons) => seasons > 2 && seasons <= 3,
            icon: "bx bxs-medal-star",
            style: "color: #CD7F32",
            tooltip: (seasons) => `${seasons} seasons of service. Veteran player.`
        },
        {
            condition: (seasons) => seasons > 3 && seasons <= 4,
            icon: "bx bxs-bullseye",
            style: "color: #81ffdfff",
            tooltip: (seasons) => `${seasons} seasons! A true champion.`
        },
        {
            condition: (seasons) => seasons > 4,
            icon: "bx bxs-crown",
            style: "color: #FFD700; text-shadow: 0 0 5px #FFD700, 0 0 20px #FFD700, 0 0 30px #FFD700;",
            tooltip: (seasons) => `${seasons} seasons of service. Truly a legend.`
        }
    ];

    // Find player in all seasons
    const playerData = allSeasonsCombinedData.find(
        (p) => p.id === player.id || p.name === player.name
    );

    // Prestige badge
    if (player.prestige && player.prestige > 0) {
        badges += `<div class="badge tooltip">
            <img src="media/prestige${player.prestige}.png" width="40" height="40" alt="Prestige">
            <span class="tooltiptext">This player has reached prestige level ${player.prestige}</span>
        </div>`;
    }

    // Was banned before
    if (player.wasBannedBefore) {
        badges += `<div class="badge tooltip">
        <em class='bx  bxs-target' style="color:rgba(255, 204, 204, 1);"></em>
        <span class="tooltiptext">Mark of the dead. This player was previously banned</span>
      </div>`;
    }

    // Kappa
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
        const seasons = playerData.seasonsCount;
        const tier = seasonTiers.find(t => t.condition(seasons));

        if (tier) {
            badges += `<div class="badge tooltip">
                <em class='${tier.icon}' style="${tier.style}"></em>
                <span class="tooltiptext">${tier.tooltip(seasons)}</span>
            </div>`;
        }
    }

    if (player?.trusted && !player?.dev) {
        badges += `<div class="badge tooltip">
        <img src="media/trusted.png" width="30" height="30" alt="Trusted">
        <span class="tooltiptext">Official Tester</span>
      </div>`;
    }

    if (player?.suspicious == true && !player.isCasual) {
        badges += `<div class="badge tooltip">
        <em class='bx  bxs-alert-shield' style="color:rgb(255, 214, 100);"></em> 
        <span class="tooltiptext">Marked as suspicious by SkillIssueDetector™ or warned by Moderation. Their statistics may be innacurate</span>
      </div>`;
    } else {
        badges += `<div class="badge tooltip">
        <em class='bx  bxs-shield-alt-2' style="color:rgb(100, 255, 165);"></em>
        <span class="tooltiptext">Profile in good standing</span>
      </div>`;
    }

    return badges;
}

async function formatAchievement(achievementId, timestamp, achievementData) {
    const achievement = achievementData.achievementCompiled[achievementId] || {};

    let imageUrl = 0;
    try {
        imageUrl = achievement.imageUrl?.slice(1) || "files/achievement/Standard_35_1.png";
    } catch (error) {
        imageUrl = "files/achievement/Standard_35_1.png";
    }

    const globalPercentage = await getAchievementPercentage(achievementId);

    return {
        id: achievementId,
        timestamp: formatLastPlayedRaid(timestamp),
        imageUrl: imageUrl,
        rarity: achievement.rarity || "Common",
        description: achievement.description || "No description",
        name: achievement.name || "Unknown Achievement",
        globalPercentage: globalPercentage || 0
    };
}

async function getLatestAchievement(player, achievementData) {
    if (!player.allAchievements || Object.keys(player.allAchievements).length === 0) {
        return {
            id: 0,
            timestamp: 0,
            imageUrl: "files/achievement/Standard_35_1.png",
            rarity: "Common",
            description: "Nothing here yet",
            name: "No achievements",
            globalPercentage: 0
        };
    }

    const [latestId, latestTimestamp] = Object.entries(player.allAchievements).reduce(
        (latest, [id, timestamp]) => timestamp > latest[1] ? [id, timestamp] : latest,
        ["", 0]
    );

    if (!latestId) {
        return {
            id: 0,
            timestamp: 0,
            imageUrl: "files/achievement/Standard_35_1.png",
            rarity: "Common",
            description: "Nothing here yet",
            name: "No achievements",
            globalPercentage: 0
        };
    }

    return await formatAchievement(latestId, latestTimestamp, achievementData);
}

async function getAllAchievements(player, achievementData) {
    if (!player.allAchievements || Object.keys(player.allAchievements).length === 0) {
        return [];
    }

    const achievementsPromises = Object.entries(player.allAchievements)
        .map(async ([id, timestamp]) => await formatAchievement(id, timestamp, achievementData));

    let achievements = await Promise.all(achievementsPromises);

    achievements.sort((a, b) => {
        const rarityCompare = RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity];
        if (rarityCompare !== 0) return rarityCompare;

        return b.timestamp - a.timestamp;
    });

    return achievements;;
}

function renderSingleAchievement(achievement) {
    return `
            <div class="achievement-title ${achievement.rarity}">
                Latest Achievement
            </div>
            <div class="achievement-content">
                <div class="achievement-icon ${achievement.rarity}">
                    <img src="${achievement.imageUrl}" alt="Achievement Icon"/>
                    <div class="achievement-time">
                        ${achievement.timestamp || "N/A"}
                    </div>
                </div>
                <div class="achievement-info">
                    <div class="achievement-title ${achievement.rarity}">
                        ${achievement.name}
                    </div>
                    <div class="achievement-description">
                        ${achievement.description}
                    </div>
                    ${achievement.globalPercentage > 0 ?
            `<div class="achievement-percentage">${achievement.globalPercentage}% of players have this achievement</div>` :
            ``}
                </div>
            </div>
    `;
}

function renderAllAchievements(achievements) {
    return achievements.map(ach => `
        <div class="user-achievements profile-section">
            <div class="achievement-content">
                <div class="achievement-icon ${ach.rarity}">
                    <img src="${ach.imageUrl}" alt="Achievement Icon"/>
                    <div class="achievement-time">
                        ${ach.timestamp || "N/A"}
                    </div>
                </div>
                <div class="achievement-info">
                    <div class="achievement-title ${ach.rarity}">
                        ${ach.name}
                    </div>
                    <div class="achievement-description">
                        ${ach.description}
                    </div>
                    ${ach.globalPercentage > 0 ?
            `<div class="achievement-percentage ${ach.rarity}">${ach.globalPercentage}% of players have this achievement</div>` :
            ``}
                </div>
            </div>
        </div>
    `).join('');
}

async function processPlayerAchievements(player, options = {}) {
    const achievementData = await fetchAchievementData();

    if (options.renderAll) {
        const allAchievements = await getAllAchievements(player, achievementData);
        if (options.container) {
            options.container.innerHTML = renderAllAchievements(allAchievements);
        }
        return allAchievements;
    } else {
        const latestAchievement = await getLatestAchievement(player, achievementData);
        if (options.container) {
            options.container.innerHTML = renderSingleAchievement(latestAchievement);
        }
        return latestAchievement;
    }
}

////////////////
// section: Utils
////////////////

function formatSalesNum(num) {
    if (num >= 1000000000) {
        return (num / 1000000000).toFixed(1) + 'bil';
    }
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'mil';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
}

function formatOnlineTime(seconds) {
    if (!seconds)
        return '0m';

    let result = [];
    const minutes = Math.floor((seconds % 3600) / 60);
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);

    result.push(`${hours}h`);
    result.push(`${minutes}m`)

    return result.join(' ') || '0m';
}

// Close profile on ESC or a button
function setupModalCloseHandlers() {
    const closeBtn = document.getElementById("closeButton");
    const modal = document.getElementById("playerProfileModal");

    if (closeBtn) {
        closeBtn.addEventListener("click", () => {
            AutoUpdater.setEnabled(true);
            modal.style.display = "none";
            isProfileOpened = false;
            window.location.hash = ``;
        });
    }

    window.addEventListener("keydown", function closeModalOnEsc(e) {
        if (e.key === "Escape") {
            AutoUpdater.setEnabled(true);
            modal.style.display = "none";
            isProfileOpened = false;
            window.location.hash = ``;
        }
    });
}

function formatLastPlayedRaid(unixTimestamp) {
    if (typeof unixTimestamp !== "number" || unixTimestamp <= 0) {
        return "Unknown";
    }

    const date = new Date(unixTimestamp * 1000);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);

    if (diffInMinutes < 5) {
        return "Just Now";
    }

    if (diffInMinutes < 60) {
        return `${diffInMinutes} minutes ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours === 1) {
        return "1 hour ago";
    }
    if (diffInHours < 24) {
        return `${diffInHours} hours ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) {
        return "1 day ago";
    }
    if (diffInDays < 30) {
        return `${diffInDays} days ago`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths === 1) {
        return "1 month ago";
    }
    if (diffInMonths < 12) {
        return `${diffInMonths} months ago`;
    }

    const diffInYears = Math.floor(diffInMonths / 12);
    if (diffInYears === 1) {
        return "1 year ago";
    }

    return `${diffInYears} years ago`;
}

// Fetch achievements meta data
async function fetchAchievementData() {
    try {
        const response = await fetch("global-achieve/js/compiledAchData.json");
        if (!response.ok) {
            throw new Error("Failed to fetch achievement data");
        }
        return await response.json();
    } catch (error) {
        console.error("Error loading achievement data:", error);
        return { achievementCompiled: {} };
    }
}

function closeLoaderAfterImagesLoad() {
    const modalContent = document.querySelector('.profile-section');
    const images = modalContent.querySelectorAll('img');

    // If no images, close loader (there should always be)
    if (images.length === 0) {
        closeLoader();
        return;
    }

    let loadedCount = 0;
    const totalImages = images.length;

    const checkImageLoad = (img) => {
        if (img.complete) {
            loadedCount++; // Image already loaded
        } else {
            img.addEventListener('load', () => {
                loadedCount++;
                checkAllLoaded();
            });
            img.addEventListener('error', () => {
                loadedCount++; // On error count image as loaded
                checkAllLoaded();
            });
        }

        // Check if all images are loaded just in case
        checkAllLoaded();
    };

    const checkAllLoaded = () => {
        if (loadedCount === totalImages) {
            setTimeout(closeLoader, 300);
        }
    };

    images.forEach(checkImageLoad);
}

// Close loader when everything's done loading
function closeLoader() {
    const loader = document.getElementById('main-profile-loader');
    loader.classList.add('fade-out');

    // Delete loader after fade out
    setTimeout(() => {
        loader.remove();
    }, 300); // 300ms - animation lenght (CSS)
}

// Capitalizes first character
function capitalize(str, locale = 'en-EN') {
    if (!str) return str;
    return str[0].toLocaleUpperCase(locale) + str.slice(1).toLocaleLowerCase(locale);
}
