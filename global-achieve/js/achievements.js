//     _____ ____  ______   __    _________    ____  __________  ____  ____  ___    ____  ____ 
//    / ___// __ \/_  __/  / /   / ____/   |  / __ \/ ____/ __ \/ __ )/ __ \/   |  / __ \/ __ \
//    \__ \/ /_/ / / /    / /   / __/ / /| | / / / / __/ / /_/ / __  / / / / /| | / /_/ / / / /  
//   ___/ / ____/ / /    / /___/ /___/ ___ |/ /_/ / /___/ _, _/ /_/ / /_/ / ___ |/ _, _/ /_/ / 
//  /____/_/     /_/    /_____/_____/_/  |_/_____/_____/_/ |_/_____/\____/_/  |_/_/ |_/_____/  

// Global variables to store our data
let achievementsData = {};
let leaderboardData = {};
let totalPlayers = 0;

// Function to load JSON data
async function loadJSON(url) {
    const response = await fetch(url);
    return await response.json();
}

// Function to calculate achievement statistics
function calculateAchievementStats() {
    const achievementStats = {};

    // Initialize stats for each achievement
    for (const achievementId in achievementsData.achievementCompiled) {
        achievementStats[achievementId] = {
            obtained: 0,
            percent: 0
        };
    }

    // Count how many players have each achievement
    for (const player of leaderboardData.leaderboard) {
        if (player.allAchievements) {
            for (const achievementId in player.allAchievements) {
                if (achievementStats[achievementId]) {
                    achievementStats[achievementId].obtained++;
                }
            }
        }
    }

    // Calculate percentage for each achievement
    for (const achievementId in achievementStats) {
        achievementStats[achievementId].percent = totalPlayers > 0
            ? (achievementStats[achievementId].obtained / totalPlayers * 100).toFixed(2)
            : 0;
    }

    return achievementStats;
}

// Function to render achievements
function renderAchievements(stats, searchTerm = '') {
    const container = document.getElementById('achievements-container');

    // Filter achievements
    const filteredAchievements = Object.entries(achievementsData.achievementCompiled)
        .filter(([id, achievement]) => {
            const matchesSearch = achievement.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                achievement.desc.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesSearch;
        });

    // Update stats display
    document.getElementById('total-achievements').textContent = filteredAchievements.length;
    document.getElementById('total-players').textContent = totalPlayers;

    // Calculate average completion percentage
    const totalCompletion = filteredAchievements.reduce((sum, [id]) => sum + parseFloat(stats[id].percent), 0);
    const averageCompletion = filteredAchievements.length > 0 ? (totalCompletion / filteredAchievements.length).toFixed(2) : 0;
    document.getElementById('average-completion').textContent = `${averageCompletion}%`;

    if (filteredAchievements.length === 0) {
        container.innerHTML = '<div class="loading">No achievements found matching your criteria.</div>';
        return;
    }

    // Sort by rarity (you can customize the sorting logic)
    const rarityOrder = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5 };
    filteredAchievements.sort((a, b) => rarityOrder[b[1].rarity] - rarityOrder[a[1].rarity]);

    // Create HTML for each achievement
    container.innerHTML = '<div class="achievements-grid"></div>';
    const grid = container.querySelector('.achievements-grid');

    filteredAchievements.forEach(([id, achievement]) => {
        const achievementStat = stats[id];

        const card = document.createElement('div');
        card.className = 'achievement-card';

        // Set border color based on rarity
        let borderColor = '#444';
        if (achievement.rarity === 'Common') borderColor = '#2e7d32';
        else if (achievement.rarity === 'Rare') borderColor = '#1565c0';
        else if (achievement.rarity === 'Legendary') borderColor = '#ff8f00';

        card.style.borderLeftColor = borderColor;

        card.innerHTML = `
                    <div class="achievement-header">
                        <img src="..${achievement.imageUrl}" alt="${achievement.name}" class="achievement-icon">
                        <h3 class="achievement-title">${achievement.name}</h3>
                    </div>
                    <p class="achievement-description">${achievement.description}</p>
                    <div class="achievement-meta">
                        <span class="achievement-rarity rarity-${achievement.rarity}">
                            ${achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1)}
                        </span>
                        <span class="achievement-percent">${achievementStat.percent}% of players</span>
                    </div>
                `;

        grid.appendChild(card);
    });
}

// Main function to load and process data
async function init() {
    try {
        // Load both JSON files in parallel
        [achievementsData, leaderboardData] = await Promise.all([
            loadJSON('../global-achieve/js/compiledAchData.json'),
            loadJSON('../fallbacks/season3.json')
        ]);

        // Get total number of players
        totalPlayers = leaderboardData.leaderboard.length;

        // Calculate achievement statistics
        const achievementStats = calculateAchievementStats();

        // Initial render
        renderAchievements(achievementStats);

    } catch (error) {
        console.error('Error loading data:', error);
        document.getElementById('achievements-container').innerHTML =
            '<div class="loading">Error loading achievements data. Please check console for details.</div>';
    }
}

// Start the application
init();