//     _____ ____  ______   __    _________    ____  __________  ____  ____  ___    ____  ____ 
//    / ___// __ \/_  __/  / /   / ____/   |  / __ \/ ____/ __ \/ __ )/ __ \/   |  / __ \/ __ \
//    \__ \/ /_/ / / /    / /   / __/ / /| | / / / / __/ / /_/ / __  / / / / /| | / /_/ / / / /  
//   ___/ / ____/ / /    / /___/ /___/ ___ |/ /_/ / /___/ _, _/ /_/ / /_/ / ___ |/ _, _/ /_/ / 
//  /____/_/     /_/    /_____/_____/_/  |_/_____/_____/_/ |_/_____/\____/_/  |_/_/ |_/_____/  

function initHOF(player) {
    const toggleBtn = document.getElementById('toggle-hof-button');
    const hof = document.getElementById('player-profile-hof');
    const hof2 = document.getElementById('player-profile-hof-sec');

    const blocksToHide = [
        document.getElementById('raid-stats-grid'),
        document.getElementById('last-raid-feed')
    ];

    if (!toggleBtn || !hof || !hof2) {
        console.warn('HOF: toggle button or HOF block not found.');
        return;
    }

    toggleBtn.addEventListener('click', () => {
        const isHofVisible = hof.style.display === 'grid' || hof2.style.display === 'grid';

        hof.style.display = isHofVisible ? 'none' : 'grid';
        hof2.style.display = isHofVisible ? 'none' : 'grid';
        blocksToHide.forEach(block => {
            if (block) {
                block.style.display = isHofVisible ? 'grid' : 'none';
            }
        });

        toggleBtn.textContent = isHofVisible ? 'Profile Battlepass' : 'Back to Profile';
    });

    updatePlayerProfile(player);
    updatePlayerProfileMastery(player);
    refreshRewards(player);
}

function calculatePlayerLevel(player) {
    const expFromRaids = player.pmcRaids * 80;
    const expFromKills = player.pmcKills * 30;
    const expFromSurvival = player.survived * 75;
    const expFromDamage = Math.floor(player.damage / 1000);
    const expFromSkill = Math.round(player.totalScore * 1500);

    // get summary
    const totalExp = expFromRaids + expFromKills + expFromSurvival + expFromDamage + expFromSkill;

    // 1800 exp per lvl
    const level = Math.floor(totalExp / 1800);
    const currentLevelExp = totalExp % 1000;
    const expForNextLevel = 1000;

    player.battlePassLevel = level;

    return {
        level: level,
        currentExp: currentLevelExp,
        expForNextLevel: expForNextLevel,
        totalExp: totalExp
    };
}

function calculateMasteryLevel(player) {
    // Don't calculate for those who don't have mod installed
    if (!player?.isUsingStattrack || !player?.modWeaponStats?.bestWeapon?.stats) {
        return {
            level: 0,
            currentExp: 0,
            expForNextLevel: 1000,
            totalExp: 0
        };
    }

    const { totalShots = 0, kills = 0, headshots = 0 } = player.modWeaponStats.bestWeapon.stats;

    const expFromShots = Math.round(totalShots * 0.1);
    const expFromKills = kills * 10;
    const expFromHeadshots = headshots * 15;

    const totalExp = expFromShots + expFromKills + expFromHeadshots;
    const expPerLevel = 1000;

    const level = Math.floor(totalExp / expPerLevel);
    const currentLevelExp = totalExp % expPerLevel;

    return {
        level,
        currentExp: currentLevelExp,
        expForNextLevel: expPerLevel,
        totalExp
    };
}

// EXP for weapon mastery
function updatePlayerProfileMastery(player) {
    const levelData = calculateMasteryLevel(player);

    // update level
    document.querySelector('.level-value-wp').textContent = levelData.level;

    // update exp bar
    const expPercentage = (levelData.currentExp / levelData.expForNextLevel) * 100;
    document.querySelector('.exp-progress-wp').style.width = `${expPercentage}%`;

    // update exp values
    document.querySelector('.current-exp-wp').textContent = levelData.currentExp.toLocaleString();
    document.querySelector('.next-level-exp-wp').textContent = levelData.expForNextLevel.toLocaleString();
    const remainingExp = levelData.expForNextLevel - levelData.currentExp;
    document.querySelector('.remaining-value-wp').textContent = remainingExp.toLocaleString();
}

// EXP for leaderboard level
function updatePlayerProfile(player) {
    const levelData = calculatePlayerLevel(player);

    // update level
    document.querySelector('.level-value').textContent = levelData.level;

    // update exp bar
    const expPercentage = (levelData.currentExp / levelData.expForNextLevel) * 100;
    document.querySelector('.exp-progress').style.width = `${expPercentage}%`;

    // update exp values
    document.querySelector('.current-exp').textContent = levelData.currentExp.toLocaleString();
    document.querySelector('.next-level-exp').textContent = levelData.expForNextLevel.toLocaleString();
    const remainingExp = levelData.expForNextLevel - levelData.currentExp;
    document.querySelector('.remaining-value').textContent = remainingExp.toLocaleString();
}

