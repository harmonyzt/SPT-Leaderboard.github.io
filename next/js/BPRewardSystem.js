//     _____ ____  ______   __    _________    ____  __________  ____  ____  ___    ____  ____ 
//    / ___// __ \/_  __/  / /   / ____/   |  / __ \/ ____/ __ \/ __ )/ __ \/   |  / __ \/ __ \
//    \__ \/ /_/ / / /    / /   / __/ / /| | / / / / __/ / /_/ / __  / / / / /| | / /_/ / / / /  
//   ___/ / ____/ / /    / /___/ /___/ ___ |/ /_/ / /___/ _, _/ /_/ / /_/ / ___ |/ _, _/ /_/ / 
//  /____/_/     /_/    /_____/_____/_/  |_/_____/_____/_/ |_/_____/\____/_/  |_/_/ |_/_____/  

function refreshRewards(player) {
    if (!player.publicProfile) return;

    const elements = {
        mainBackground: document.getElementById('modalPlayerInfo'),
        profileCard: document.getElementById('main-profile-card'),
        profileAvatar: document.getElementById('profile-avatar'),
        profileBackground: document.getElementById('weapon-meta-section'),
        profileCat: document.getElementById('catrew'),
        badgerPenguin: document.getElementById('badger')
    };

    const achievementMap = {
        goons: "6513f1feec10ff011f17c7ea",
        lighthouse: "6514321bec10ff011f17ccac",
        raider: "6513eec00dc723592b0f90cc"
    }

    resetStyles(elements);

    applyRewards(player, elements);

    // Handle cat and badger visibility
    elements.profileCat.style.display = (player.bp_cat && player.battlePassLevel >= 20) ? 'block' : 'none';
    elements.badgerPenguin.style.display = 'none';
}

function resetStyles({ mainBackground, profileCard, profileAvatar, profileBackground }) {
    // Reset main background
    mainBackground.style.backgroundImage = '';
    mainBackground.style.backgroundColor = '';
    mainBackground.className = mainBackground.className.replace(/(usec|bear|labs|lighthouse|goons|raider)-background|prestige-(tagilla|killa|both)/g, '');

    // Reset weapon 
    profileBackground.className = profileBackground.className.replace(/(scratches|cult-(signs|signs2|circle))/g, '');

    // Reset profile card
    profileCard.style.backgroundImage = '';
    profileCard.className = profileCard.className.replace(/(streets|streets2|streets3|purple|labs)-bg/g, '');

    // Reset avatar
    profileAvatar.className = profileAvatar.className.replace(/(wide|box)-style|(red|pink|white|black)-border/g, '');
}

function applyRewards(player, elements) {
    const { mainBackground, profileCard, profileAvatar, profileBackground } = elements;
    const { battlePassLevel: bpLevel, masteryLevel: masterLevel } = player;

    // Apply profile decal
    if (!["redshade", "steelshade", "gradient"].includes(player.profileTheme.toLowerCase())) {
        const decalMap = {
            "cult-signs2": { level: 20, class: 'cult-signs2' },
            "cult-signs": { level: 15, class: 'cult-signs' },
            "cult-circle": { level: 10, class: 'cult-circle' },
            "scratches": { level: 5, class: 'scratches' }
        };

        if (decalMap[player.bp_decal]?.level <= masterLevel) {
            profileBackground.classList.add(decalMap[player.bp_decal].class);
        }
    }

    // Apply card background
    const cardBgMap = {
        "labs": { level: 25, class: 'labs-bg' },
        "purple": { level: 15, class: 'purple-bg' },
        "streets3": { level: 10, class: 'streets3-bg' },
        "streets2": { level: 7, class: 'streets2-bg' },
        "streets": { level: 4, class: 'streets-bg' }
    };

    if (cardBgMap[player.bp_cardbg]?.level <= bpLevel) {
        profileCard.classList.add(cardBgMap[player.bp_cardbg].class);
    }

    // Apply main background
    const mainBgMap = {
        'usec': { level: 10, class: 'usec-background' },
        'bear': { level: 10, class: 'bear-background' },
        'labs': { level: 20, class: 'labs-background' },
        // Achievement backgrounds
        'goons': {
            class: 'goons-background',
            unlocked: isAchievementUnlocked(player, "6513f1feec10ff011f17c7ea")
        },
        'lighthouse': {
            class: 'lighthouse-background',
            unlocked: isAchievementUnlocked(player, "6514321bec10ff011f17ccac")
        },
        'raider': {
            class: 'raider-background',
            unlocked: isAchievementUnlocked(player, "6513eec00dc723592b0f90cc")
        }
    };

    if (player.bp_mainbg === 'none') {
        mainBackground.style.backgroundColor = 'none';
    }
    // Default backgrounds (by level)
    else if (mainBgMap[player.bp_mainbg]?.level <= bpLevel) {
        mainBackground.classList.add(mainBgMap[player.bp_mainbg].class);
    }
    // Achievement backgrounds
    else if (mainBgMap[player.bp_mainbg]?.unlocked) {
        mainBackground.classList.add(mainBgMap[player.bp_mainbg].class);
    }

    // Apply prestige styling
    if (player.usePrestigeStyling && player.prestige > 0) {
        const prestigeClass = `prestige-${player.bp_prestigebg}`;
        if (['prestige-tagilla', 'prestige-killa', 'prestige-both'].includes(prestigeClass)) {
            mainBackground.className = mainBackground.className.replace(/(usec|bear|labs|prestige-(tagilla|killa|both))-background/g, '');
            mainBackground.classList.add(prestigeClass);
        }
    }

    // Apply avatar style
    const avatarStyleMap = {
        'box': { level: 5, class: 'box-style' },
        'wide': { level: 10, class: 'wide-style' }
    };

    if (avatarStyleMap[player.bp_pfpstyle]?.level <= bpLevel) {
        profileAvatar.classList.add(avatarStyleMap[player.bp_pfpstyle].class);
    }

    // Apply avatar border
    const borderMap = {
        'red': 5,
        'pink': 8,
        'white': 15,
        'black': 20
    };

    if (player.bp_pfpbordercolor !== 'default' && borderMap[player.bp_pfpbordercolor] <= bpLevel) {
        profileAvatar.classList.add(`${player.bp_pfpbordercolor}-border`);
    }
}

function isAchievementUnlocked(player, achievementId) {
    return player.allAchievements && player.allAchievements.hasOwnProperty(achievementId);
}