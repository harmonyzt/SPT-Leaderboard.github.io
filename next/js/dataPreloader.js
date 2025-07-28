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
    const playerUpdates = players.map(async (player) => {
        if (player.banned) return player;

        const playerConfig = settings[player.id];
        if (!playerConfig) return player;

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
            pfp: configPfp
        } = playerConfig;

        // Get the pfp while we update
        const [playerPfp] = await Promise.all([
            determinePlayerPfp(player.id, configPfp),
        ]);

        return {
            ...player,
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
            name: customName || player.name,
            profilePicture: playerPfp
        };
    });

    // await all updates
    return Promise.all(playerUpdates);
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