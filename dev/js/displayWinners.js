//     _____ ____  ______   __    _________    ____  __________  ____  ____  ___    ____  ____ 
//    / ___// __ \/_  __/  / /   / ____/   |  / __ \/ ____/ __ \/ __ )/ __ \/   |  / __ \/ __ \
//    \__ \/ /_/ / / /    / /   / __/ / /| | / / / / __/ / /_/ / __  / / / / /| | / /_/ / / / /  
//   ___/ / ____/ / /    / /___/ /___/ ___ |/ /_/ / /___/ _, _/ /_/ / /_/ / ___ |/ _, _/ /_/ / 
//  /____/_/     /_/    /_____/_____/_/  |_/_____/_____/_/ |_/_____/\____/_/  |_/_/ |_/_____/  

/**
 * Displays top 3 winners in the UI
 * @param {Array<Object>} data - Leaderboard entries of previous season from loadPreviousSeasonWinners()
 */
function displayWinners(data) {
    const winnersTab = document.getElementById('winners');

    winnersTab.innerHTML = `
        <h2>Our previous season Champions!</h2>
    `;

    const top3Players = data.filter(player => player.rank <= 3);
    const winnersContainer = document.createElement('div');
    winnersContainer.className = 'winners-container';

    const orderedPlayers = [
        top3Players.find(p => p.rank === 2),
        top3Players.find(p => p.rank === 1),
        top3Players.find(p => p.rank === 3)
    ].filter(Boolean);

    orderedPlayers.forEach(player => {
        winnersContainer.innerHTML += `
            <div class="winner-card">
                <p class="winner-name">${player.medal} ${player.name}</p>
                <p class="winner-rank">${getRankText(player.rank)}</p>
                <p class="winner-skill">Skill score: ${player.totalScore.toFixed(2)}</p>
                <p class="winner-stats">Raids: ${player.pmcRaids} | KDR: ${player.killToDeathRatio}</p>
            </div>
        `;
    });

    winnersTab.appendChild(winnersContainer);
}

/**
 * Returns text based on player ranking for displayWinners() e.g player.rank = 1 -> '👑 First place 👑'
 * @param {Array<Object>} rank - 3 winners determined by displayWinners() - player.rank
 */
function getRankText(rank) {
    switch (rank) {
        case 1: return '👑 First place 👑';
        case 2: return 'Second place';
        case 3: return 'Third place';
        default: return '';
    }
}