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

const pfpCache = {
    map: new Map(),
    maxSize: 1000,
    get(id) {
        if (this.map.has(id)) {
            const value = this.map.get(id);
            this.map.delete(id);
            this.map.set(id, value);
            return value;
        }
        return null;
    },
    set(id, value) {
        if (this.map.size >= this.maxSize) {
            const firstKey = this.map.keys().next().value;
            this.map.delete(firstKey);
        }
        this.map.set(id, value);
    }
};

async function getProfileSettings() {
    const now = Date.now();

    // If cache exists
    if (profileSettingsCache.data &&
        now - profileSettingsCache.lastUpdated < profileSettingsCache.ttl) {
        return profileSettingsCache.data;
    }

    // If already updating
    if (profileSettingsCache.isUpdating) {
        return profileSettingsCache.updatePromise;
    }

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
            profilePicture: `${await determinePlayerPfp(player.id, playerConfig.pfp)}?${Date.now()}`
        });

        return player;
    });

    await Promise.all(updatePromises);
}

async function determinePlayerPfp(playerId, configPfp) {
    if (configPfp?.trim()) {
        return configPfp;
    }

    // Check cache
    const cachedPfp = pfpCache.get(playerId);
    if (cachedPfp !== null) {
        return cachedPfp;
    }

    try {
        const response = await fetch(`${pmcPfpsPath}${playerId}.png`, {
            method: 'HEAD'
        });

        const pfpUrl = response.ok ? `${pmcPfpsPath}${playerId}.png` : 'media/default_avatar.png';
        pfpCache.set(playerId, pfpUrl);
        return pfpUrl;
    } catch (error) {
        console.error(`Error checking PFP for player ${playerId}:`, error);
        return 'media/default_avatar.png';
    }
}