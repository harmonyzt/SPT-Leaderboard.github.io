//     _____ ____  ______   __    _________    ____  __________  ____  ____  ___    ____  ____
//    / ___// __ \/_  __/  / /   / ____/   |  / __ \/ ____/ __ \/ __ )/ __ \/   |  / __ \/ __ \
//    \__ \/ /_/ / / /    / /   / __/ / /| | / / / / __/ / /_/ / __  / / / / /| | / /_/ / / / /
//   ___/ / ____/ / /    / /___/ /___/ ___ |/ /_/ / /___/ _, _/ /_/ / /_/ / ___ |/ _, _/ /_/ /
//  /____/_/     /_/    /_____/_____/_/  |_/_____/_____/_/ |_/_____/\____/_/  |_/_/ |_/_____/

const BASE_EXP_PER_LEVEL = 2200;
const MAX_LEVEL = 30;

async function initHOF(player, bestWeapon) {
    updatePlayerProfile(player);
    updatePlayerProfileMastery(player, bestWeapon);
    
    // rewardSystem.js
    refreshRewards(player);
}

function calculatePlayerLevel(player) {
    const expFromPmcRaids = player.pmcRaids * 60;
    const expFromPmcKills = player.pmcKills * 25;
    const expFromScavRaids = player.scavRaids ? player.scavRaids * 30 : 0;
    const expFromScavKills = player.scavKills ? player.scavKills * 15 : 0;

    const survivalMultiplier = 1 + player.survivalRate / 100;
    const expFromSurvival = player.survived * 120 * survivalMultiplier;

    const expFromLifeTime = Math.floor(player.averageLifeTime / 60) * 5;

    const expFromDamage = Math.floor(player.damage / 1500);

    // Get all EXP
    const totalExp = Math.floor(
        expFromPmcRaids +
        expFromPmcKills +
        expFromScavRaids +
        expFromScavKills +
        expFromSurvival +
        expFromLifeTime +
        expFromDamage
    );

    // Calculate level and keep in mind max level
    let level = Math.floor(totalExp / BASE_EXP_PER_LEVEL);
    level = Math.min(level, MAX_LEVEL);

    // Dynamic
    const currentLevelExp = totalExp - level * BASE_EXP_PER_LEVEL;
    const expForNextLevel = BASE_EXP_PER_LEVEL - currentLevelExp;

    player.battlePassLevel = level;
    setRankImage(player.battlePassLevel);

    return {
        level: level,
        currentExp: currentLevelExp,
        expForNextLevel: expForNextLevel,
        totalExp: totalExp,
    };
}

function calculateMasteryLevel(player, bestWeapon) {
    // Don't calculate for those who don't have mod installed
    if (!player?.isUsingStattrack || !bestWeapon) {
        return {
            level: 0,
            currentExp: 0,
            expForNextLevel: 1000,
            totalExp: 0,
        };
    }

    const { totalShots = 0, kills = 0, headshots = 0 } = bestWeapon.stats;

    const expFromShots = Math.round(totalShots * 0.1);
    const expFromKills = kills * 30;
    const expFromHeadshots = headshots * 70;

    const totalExp = expFromShots + expFromKills + expFromHeadshots;
    const expPerLevel = 800;

    const level = Math.floor(totalExp / expPerLevel);
    player.masteryLevel = level;

    const currentLevelExp = totalExp % expPerLevel;

    return {
        level,
        currentExp: currentLevelExp,
        expForNextLevel: expPerLevel,
        totalExp,
    };
}

// EXP for weapon mastery
async function updatePlayerProfileMastery(player, bestWeapon) {
    const levelData = calculateMasteryLevel(player, bestWeapon);

    // update level
    document.querySelector(".level-value-wp").textContent = levelData.level;

    // update exp bar
    const expPercentage =
        (levelData.currentExp / levelData.expForNextLevel) * 100;
    document.querySelector(
        ".exp-progress-wp"
    ).style.width = `${expPercentage}%`;

    // update exp values
    document.querySelector(".current-exp-wp").textContent =
        levelData.currentExp.toLocaleString();
    document.querySelector(".next-level-exp-wp").textContent =
        levelData.expForNextLevel.toLocaleString();
    const remainingExp = levelData.expForNextLevel - levelData.currentExp;
    document.querySelector(".remaining-value-wp").textContent =
        remainingExp.toLocaleString();
}

// EXP for leaderboard level
async function updatePlayerProfile(player) {
    const levelData = calculatePlayerLevel(player);

    // update level
    document.querySelector(".level-value").textContent = levelData.level;

    // update exp bar
    const expPercentage =
        levelData.level >= MAX_LEVEL
            ? 100
            : (levelData.currentExp / BASE_EXP_PER_LEVEL) * 100;
    document.querySelector(".exp-progress").style.width = `${expPercentage}%`;

    // update exp values
    document.querySelector(".current-exp").textContent =
        levelData.currentExp.toLocaleString();
    document.querySelector(".next-level-exp").textContent =
        levelData.level >= MAX_LEVEL
            ? "MAX"
            : levelData.expForNextLevel.toLocaleString();

    const remainingExp =
        levelData.level >= MAX_LEVEL ? 0 : levelData.expForNextLevel;

    document.querySelector(".remaining-value").textContent =
        remainingExp.toLocaleString();
}

async function setRankImage(playerLevel) {
    const level = Math.min(Math.max(0, playerLevel), 80);
    const rankLevel = Math.floor(level / 5) * 5;
    const finalRankLevel = rankLevel < 5 ? 5 : rankLevel;
    const levelClass = document.querySelector(".rank-icon");
    levelClass.src = `media/profile_ranks/rank${finalRankLevel}.png`;
}
