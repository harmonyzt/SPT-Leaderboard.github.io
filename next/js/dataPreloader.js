//     _____ ____  ______   __    _________    ____  __________  ____  ____  ___    ____  ____
//    / ___// __ \/_  __/  / /   / ____/   |  / __ \/ ____/ __ \/ __ )/ __ \/   |  / __ \/ __ \
//    \__ \/ /_/ / / /    / /   / __/ / /| | / / / / __/ / /_/ / __  / / / / /| | / /_/ / / / /
//   ___/ / ____/ / /    / /___/ /___/ ___ |/ /_/ / /___/ _, _/ /_/ / /_/ / ___ |/ _, _/ /_/ /
//  /____/_/     /_/    /_____/_____/_/  |_/_____/_____/_/ |_/_____/\____/_/  |_/_/ |_/_____/

// Add cache
const profileSettingsCache = {
    data: null,
    lastUpdated: 0,
    ttl: 300000, // 5 min
    isUpdating: false,
    updatePromise: null
};

async function getProfileSettings() {
    // Start updating this pile of crap
    profileSettingsCache.isUpdating = true;
    profileSettingsCache.updatePromise = (async () => {
        try {
            const response = await fetch(profileSettingsPath);
            if (!response.ok) throw new Error('Failed to load settings');

            const data = await response.json();
            profileSettingsCache.data = data;
            profileSettingsCache.lastUpdated = Date.now();
            return data;
        } catch (error) {
            console.error('Error loading settings:', error);

            // Save stuff in case
            return profileSettingsCache.data || {};
        } finally {
            profileSettingsCache.isUpdating = false;
            profileSettingsCache.updatePromise = null;
        }
    })();

    return profileSettingsCache.updatePromise;
}

async function assignLeaderboardData(players) {
    const settings = await getProfileSettings();

    // Use const here
    const updatePromises = players.map(async player => {
        if (player.banned) return player;

        const playerConfig = settings[player.id];
        if (!playerConfig) return player;

        // Make this an object
        Object.assign(player, {
            profileAboutMe: playerConfig.aboutMe,
            usePrestigeStyling: playerConfig.usePrestigeStyling,
            profileTheme: playerConfig.profileTheme,
            bp_prestigebg: playerConfig.prestigeBackground,
            bp_cardbg: playerConfig.backgroundReward,
            bp_mainbg: playerConfig.mainBackgroundReward,
            bp_cat: playerConfig.catReward,
            bp_pfpstyle: playerConfig.pfpStyle,
            bp_pfpbordercolor: playerConfig.pfpBorder,
            bp_decal: playerConfig.decal,
            discordUser: playerConfig.discordUser || "",
            name: playerConfig.name || player.name,
            profilePicture: player.profilePicture || playerConfig.profilePicture
        });

        return player;
    });

    await Promise.all(updatePromises);
}