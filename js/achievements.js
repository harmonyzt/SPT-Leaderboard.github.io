//     _____ ____  ______   __    _________    ____  __________  ____  ____  ___    ____  ____ 
//    / ___// __ \/_  __/  / /   / ____/   |  / __ \/ ____/ __ \/ __ )/ __ \/   |  / __ \/ __ \
//    \__ \/ /_/ / / /    / /   / __/ / /| | / / / / __/ / /_/ / __  / / / / /| | / /_/ / / / /  
//   ___/ / ____/ / /    / /___/ /___/ ___ |/ /_/ / /___/ _, _/ /_/ / /_/ / ___ |/ _, _/ /_/ / 
//  /____/_/     /_/    /_____/_____/_/  |_/_____/_____/_/ |_/_____/\____/_/  |_/_/ |_/_____/  

let achievementsData = {};
let playerAchievements = {};
let totalPlayers = 0;
let achievementStats = {};

async function loadAchievementsData() {
    try {
        [achievementsData, playerAchievements] = await Promise.all([
            fetch('global-achieve/js/compiledAchData.json'),
            fetch(`${achievementsPath}`)
        ]);

        if (!achievementsResponse.ok || !playersResponse.ok) {
            throw new Error('Failed to load one achievements');
        }

        totalPlayers = Object.keys(playerAchievements.achievements).length;
        achievementStats = calculateAchievementStats();

        return {
            achievementsData,
            playerAchievements,
            totalPlayers,
            achievementStats
        };
    } catch (error) {
        console.error('Error loading achievements data:', error);
        throw error;
    }
}

function calculateAchievementStats() {
    const stats = {};

    // Initialize stats
    for (const achievementId in achievementsData.achievementCompiled) {
        stats[achievementId] = {
            obtained: 0,
            percent: 0
        };
    }

    // Count how many players have each achievement
    for (const playerId in playerAchievements.achievements) {
        const playerAchData = playerAchievements.achievements[playerId][0];

        for (const achievementId in playerAchData) {
            if (stats.hasOwnProperty(achievementId)) {
                stats[achievementId].obtained++;
            }
        }
    }

    // Calculate percentage for each achievement
    for (const achievementId in stats) {
        stats[achievementId].percent = totalPlayers > 0
            ? (stats[achievementId].obtained / totalPlayers * 100).toFixed(2)
            : 0;
    }

    return stats;
}

function getAchievementPercentage(achievementId) {
    return achievementStats[achievementId]?.percent || 0;
}