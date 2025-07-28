//     _____ ____  ______   __    _________    ____  __________  ____  ____  ___    ____  ____
//    / ___// __ \/_  __/  / /   / ____/   |  / __ \/ ____/ __ \/ __ )/ __ \/   |  / __ \/ __ \
//    \__ \/ /_/ / / /    / /   / __/ / /| | / / / / __/ / /_/ / __  / / / / /| | / /_/ / / / /
//   ___/ / ____/ / /    / /___/ /___/ ___ |/ /_/ / /___/ _, _/ /_/ / /_/ / ___ |/ _, _/ /_/ /
//  /____/_/     /_/    /_____/_____/_/  |_/_____/_____/_/ |_/_____/\____/_/  |_/_/ |_/_____/

let profileSettingsData = {};

async function getProfileSettings() {
    if (Object.keys(profileSettingsData).length > 0) {
        return profileSettingsData;
    }

    try {
        const response = await fetch(profileSettingsPath);
        if (!response.ok) throw new Error('Failed to load settings');

        profileSettingsData = await response.json();
        return profileSettingsData;
    } catch (error) {
        console.error('Error loading settings:', error);
        profileSettingsData = {};
        throw error;
    }
}

async function assignLeaderboardData(players) {
    const settings = await getProfileSettings();

    for (const player of players) {
        const playerConfig = settings[player.id];
        if (!playerConfig) continue;
        if (player.banned) continue;

        const {
            aboutMe,
            usePrestigeStyling,
            profileTheme,
            prestigeBackground,
            backgroundReward,
            mainBackgroundReward,
            catReward,
            pfpStyle,
            pfpBorder,
            decal,
            discordUser = "",
            name: customName,
            profilePicture: configPfp
        } = playerConfig;

        const playerName = customName || player.name;
        const playerPfp = await determinePlayerPfp(player.id, configPfp);

        Object.assign(player, {
            profileAboutMe: aboutMe,
            usePrestigeStyling,
            profileTheme,
            bp_prestigebg: prestigeBackground,
            bp_cardbg: backgroundReward,
            bp_mainbg: mainBackgroundReward,
            bp_cat: catReward,
            bp_pfpstyle: pfpStyle,
            bp_pfpbordercolor: pfpBorder,
            bp_decal: decal,
            discordUser,
            name: playerName,
            profilePicture: playerPfp
        });
    }
}

async function determinePlayerPfp(playerId, configPfp) {
    if (configPfp && configPfp.trim() !== "") {
        return configPfp;
    } else {
        const response = await fetch(`${pmcPfpsPath}${playerId}.png`);

        if (response.ok) {
            return pmcPfpsPath;
        } else {
            return 'media/default_avatar.png';
        }
    }
}