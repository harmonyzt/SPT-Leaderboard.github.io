//     _____ ____  ______   __    _________    ____  __________  ____  ____  ___    ____  ____ 
//    / ___// __ \/_  __/  / /   / ____/   |  / __ \/ ____/ __ \/ __ )/ __ \/   |  / __ \/ __ \
//    \__ \/ /_/ / / /    / /   / __/ / /| | / / / / __/ / /_/ / __  / / / / /| | / /_/ / / / /  
//   ___/ / ____/ / /    / /___/ /___/ ___ |/ /_/ / /___/ _, _/ /_/ / /_/ / ___ |/ _, _/ /_/ / 
//  /____/_/     /_/    /_____/_____/_/  |_/_____/_____/_/ |_/_____/\____/_/  |_/_/ |_/_____/  

function refreshRewards(player) {
    // Background behind profile card
    const mainBackground = document.getElementById('playerProfileModal');

    // For background for main profile card
    const profileCard = document.getElementById('main-profile-card');

    // To change any avatar things (like border color around PFP)
    const profileAvatar = document.getElementById('profile-avatar');

    // Cat :D
    const profileCat = document.getElementById('catrew');

    // Tester Request
    const badgerPenguin = document.getElementById('badger');

    // Reset
    resetStyles(mainBackground, profileCard, profileAvatar);

    // Nuke 
    if (!player.publicProfile) {
        return;
    }

    // Now apply
    applyBackgroundReward(player, profileCard);
    applyMainBackgroundReward(player, mainBackground);
    applyPfpStyleReward(player, profileAvatar);
    applyPfpBorderReward(player, profileAvatar);

    // Cat :D
    if (player.bp_cat && player.battlePassLevel >= 15) {
        profileCat.style.display = 'block';
    } else {
        profileCat.style.display = 'none';
    }

    // Requested by Badger
    if (player.id === "6800024300038077fb7eea53") {
        badgerPenguin.style.display = 'block';
    } else {
        badgerPenguin.style.display = 'none';
    }
}

function resetStyles(mainBackground, profileCard, profileAvatar) {
    mainBackground.style.backgroundImage = '';
    mainBackground.style.backgroundColor = '';
    mainBackground.classList.remove('usec-background', 'bear-background', 'prestige-tagilla', 'prestige-killa');

    profileCard.style.backgroundImage = '';
    profileCard.classList.remove('streets-bg', 'streets2-bg', 'streets3-bg', 'purple-bg', 'labs-bg');


    profileAvatar.classList.remove(
        'wide-style', 'box-style', 'red-border', 'pink-border', 'white-border', 'black-border'
    );
}

function applyBackgroundReward(player, profileCard) {
    const level = player.battlePassLevel;
    const reward = player.bp_cardbg;

    // automatically choose 
    if (reward === "labs" && level >= 25) {
        profileCard.classList.add('labs-bg');
    } else if (reward === "purple" && level >= 15) {
        profileCard.classList.add('purple-bg');
    } else if (reward === "streets3" && level >= 10) {
        profileCard.classList.add('streets3-bg');
    } else if (reward === "streets2" && level >= 7) {
        profileCard.classList.add('streets2-bg');
    } else if (reward === "streets" && level >= 4) {
        profileCard.classList.add('streets-bg');
    }
}

function applyMainBackgroundReward(player, mainBackground) {
    const level = player.battlePassLevel;
    const reward = player.bp_mainbg;

    if (reward === 'usec' && level >= 5) {
        mainBackground.classList.add('usec-background');
    } else if (reward === 'bear' && level >= 5) {
        mainBackground.classList.add('bear-background');
    } else if (reward === 'none') {
        mainBackground.style.backgroundColor = 'none';
    } else {
        // Default background
        mainBackground.style.backgroundColor = 'none';
    }

    // Set the background no matter what unless they turned it off
    if (player.usePrestigeStyling && player.prestige > 0) {
        if (player.bp_prestigebg == "tagilla") {
            mainBackground.classList.remove('bear-background', 'usec-background');
            mainBackground.classList.add('prestige-tagilla');
        } else if (player.bp_prestigebg == "killa") {
            mainBackground.classList.remove('bear-background', 'usec-background');
            mainBackground.classList.add('prestige-killa');
        }
    }
}

function applyPfpStyleReward(player, profileAvatar) {
    const level = player.battlePassLevel;
    const reward = player.bp_pfpstyle;

    if (reward === 'box' && level >= 5) {
        profileAvatar.classList.add('box-style');
    } else if (reward === 'wide' && level >= 10) {
        profileAvatar.classList.add('wide-style');
    }
}

function applyPfpBorderReward(player, profileAvatar) {
    const level = player.battlePassLevel;
    const reward = player.bp_pfpbordercolor;

    if (reward !== 'default') {
        if ((reward === 'red' && level >= 5) ||
            (reward === 'pink' && level >= 8) ||
            (reward === 'white' && level >= 10) ||
            (reward === 'black' && level >= 15)) {
            profileAvatar.classList.add(`${reward}-border`);
        }
        return;
    }

    if (level >= 15) {
        profileAvatar.classList.add('black-border');
    } else if (level >= 10) {
        profileAvatar.classList.add('white-border');
    } else if (level >= 8) {
        profileAvatar.classList.add('pink-border');
    } else if (level >= 5) {
        profileAvatar.classList.add('red-border');
    }
}