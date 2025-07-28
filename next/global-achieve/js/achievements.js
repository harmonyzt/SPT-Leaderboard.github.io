//     _____ ____  ______   __    _________    ____  __________  ____  ____  ___    ____  ____ 
//    / ___// __ \/_  __/  / /   / ____/   |  / __ \/ ____/ __ \/ __ )/ __ \/   |  / __ \/ __ \
//    \__ \/ /_/ / / /    / /   / __/ / /| | / / / / __/ / /_/ / __  / / / / /| | / /_/ / / / /  
//   ___/ / ____/ / /    / /___/ /___/ ___ |/ /_/ / /___/ _, _/ /_/ / /_/ / ___ |/ _, _/ /_/ / 
//  /____/_/     /_/    /_____/_____/_/  |_/_____/_____/_/ |_/_____/\____/_/  |_/_/ |_/_____/  

// Global variables to store our data
let achievementsData = {};
let playerAchievements = {};
let totalPlayers = 0;

async function loadJSON(url) {
    const response = await fetch(url);
    return await response.json();
}

// Calculate achievement statistics
function calculateAchievementStats() {
    const achievementStats = {};

    // Initialize stats
    for (const achievementId in achievementsData.achievementCompiled) {
        achievementStats[achievementId] = {
            obtained: 0,
            percent: 0
        };
    }

    // Count how many players have each achievement
    for (const playerId in playerAchievements.achievements) {
        const playerAchData = playerAchievements.achievements[playerId][0];

        for (const achievementId in playerAchData) {
            if (achievementStats.hasOwnProperty(achievementId)) {
                achievementStats[achievementId].obtained++;
            }
        }
    }

    // Percentage for each achievement
    const totalPlayers = Object.keys(playerAchievements.achievements).length;

    for (const achievementId in achievementStats) {
        achievementStats[achievementId].percent = totalPlayers > 0
            ? (achievementStats[achievementId].obtained / totalPlayers * 100).toFixed(2)
            : 0;
    }

    return achievementStats;
}

// Render achievements
function renderAchievements(stats, searchTerm = '') {
    const container = document.getElementById('achievements-container');
    const searchTermLower = searchTerm.toLowerCase();

    // Filter achievements
    const filteredAchievements = Object.entries(achievementsData.achievementCompiled)
        .filter(([id, achievement]) => {
            if (!achievement) return false;

            const name = achievement.name || '';
            const description = achievement.description || '';

            const nameMatch = name.toLowerCase().includes(searchTermLower);
            const descMatch = description.toLowerCase().includes(searchTermLower);

            return nameMatch || descMatch;
        });

    // Average completion percentage
    //const totalCompletion = filteredAchievements.reduce((sum, [id]) => {
    //    return sum + parseFloat(stats[id]?.percent || 0);
    //}, 0);

    //const averageCompletion = filteredAchievements.length > 0
    //    ? (totalCompletion / filteredAchievements.length).toFixed(2)
    //    : 0;


    // Sort by rarity
    const rarityOrder = { common: 1, rare: 2, legendary: 3 };
    filteredAchievements.sort((a, b) => {
        const rarityA = a[1]?.rarity?.toLowerCase() || 'common';
        const rarityB = b[1]?.rarity?.toLowerCase() || 'common';

        // First sort by rarity (descending)
        if (rarityOrder[rarityB] !== rarityOrder[rarityA]) {
            return rarityOrder[rarityB] - rarityOrder[rarityA];
        }

        // If rarity is equal, sort by completion rate (descending)
        const completionA = parseFloat(stats[a[0]]?.percent || 0);
        const completionB = parseFloat(stats[b[0]]?.percent || 0);
        return completionB - completionA;
    });

    // Make HTML ELement first
    container.innerHTML = '<div class="achievements-grid"></div>';
    const grid = container.querySelector('.achievements-grid');

    filteredAchievements.forEach(([id, achievement]) => {
        if (!achievement) return;

        const achievementStat = stats[id] || { percent: 0 };
        const rarity = achievement.rarity?.toLowerCase() || 'common';

        const card = document.createElement('div');
        card.className = 'achievement-card';

        // Border color based on rarity
        let borderColor = '#444';
        if (rarity === 'common') borderColor = '#2e7d32';
        else if (rarity === 'rare') borderColor = '#1565c0';
        else if (rarity === 'legendary') borderColor = '#ff8f00';

        card.style.borderLeftColor = borderColor;

        card.innerHTML = `
            <div class="achievement-header">
                <img src="..${achievement.imageUrl}" alt="${achievement.name}" class="achievement-icon">
                <h3 class="achievement-title">${achievement.name}</h3>
            </div>
            <p class="achievement-description">${achievement.description}</p>
            <div class="achievement-progress-container">
                <div class="achievement-progress-label">
                    <span>Completion Rate</span>
                    <span class="achievement-progress-percent">${achievementStat.percent}%</span>
                </div>
                <div class="achievement-progress" style="--progress-width: ${achievementStat.percent}%"></div>
            </div>
            <div class="achievement-meta">
                <span class="achievement-rarity rarity-${rarity}">
                    ${rarity.charAt(0).toUpperCase() + rarity.slice(1)}
                </span>
            </div>
        `;

        grid.appendChild(card);
    });
}

// Main function to load and process data
async function initAchievements() {
    try {
        // Load both JSON files in parallel
        [achievementsData, playerAchievements] = await Promise.all([
            loadJSON('../global-achieve/js/compiledAchData.json'),
            loadJSON('https://visuals.nullcore.net/SPT/data/shared/achievement_counters.json')
        ]);

        // Get total number of players with achievements
        totalPlayers = playerAchievements.achievements.length;

        // Calculate achievement statistics
        const achievementStats = calculateAchievementStats();

        // Render
        renderAchievements(achievementStats);

    } catch (error) {
        console.error('Error loading data:', error);
    }
}

initAchievements();