//     _____ ____  ______   __    _________    ____  __________  ____  ____  ___    ____  ____ 
//    / ___// __ \/_  __/  / /   / ____/   |  / __ \/ ____/ __ \/ __ )/ __ \/   |  / __ \/ __ \
//    \__ \/ /_/ / / /    / /   / __/ / /| | / / / / __/ / /_/ / __  / / / / /| | / /_/ / / / /  
//   ___/ / ____/ / /    / /___/ /___/ ___ |/ /_/ / /___/ _, _/ /_/ / /_/ / ___ |/ _, _/ /_/ / 
//  /____/_/     /_/    /_____/_____/_/  |_/_____/_____/_/ |_/_____/\____/_/  |_/_/ |_/_____/    

document.addEventListener('DOMContentLoaded', () => {
    const elements = {
        infoModal: document.getElementById('infoModal'),
        infoButton: document.getElementById('infoButton'),
        tosModal: document.getElementById('tosModal'),
        tosButton: document.getElementById('tosButton'),

        settingsModal: document.getElementById('settingsModal'),
        settingsButton: document.getElementById('settingsButton'),

        closeButtons: document.querySelectorAll('.close'),
        modals: document.querySelectorAll('.modal')
    };

    const toggleModal = (modal, show) => {
        if (show) {
            modal.style.display = 'block';
            setTimeout(() => {
                modal.style.opacity = '1';
                modal.style.visibility = 'visible';
            }, 10);
        } else {
            modal.style.opacity = '0';
            modal.style.visibility = 'hidden';
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
    };

    // Event listeners
    elements.infoButton.addEventListener('click', () => toggleModal(elements.infoModal, true));
    elements.tosButton.addEventListener('click', () => toggleModal(elements.tosModal, true));
    elements.settingsButton.addEventListener('click', () => {
        initProfileWatchList(leaderboardData);
        toggleModal(elements.settingsModal, true);
    });

    // Close modal if close button was clicked
    elements.closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            toggleModal(elements.infoModal, false);
            toggleModal(elements.tosModal, false);
            toggleModal(elements.settingsModal, false);
        });
    });

    // Close modal if user clicked outside of it
    window.addEventListener('click', (event) => {
        if (event.target === elements.infoModal) toggleModal(elements.infoModal, false);
        if (event.target === elements.tosModal) toggleModal(elements.tosModal, false);
        if (event.target === elements.settingsModal) toggleModal(elements.settingsModal, false);
    });
});


function initProfileWatchList(data) {
    const getPlayerStatsHTML = (player) => `
        <div class="raid-stats-grid">
            <div class="raid-stat-block">
                <span class="profile-stat-label">Name:</span>
                <span class="profile-stat-value">${player.name}</span>
            </div>
            <div class="raid-stat-block">
                <span class="profile-stat-label">Rank:</span>
                <span class="profile-stat-value">${player.rank}</span>
            </div>
            <div class="raid-stat-block">
                <span class="profile-stat-label">K/D:</span>
                <span class="profile-stat-value">${player.killToDeathRatio}</span>
            </div>
            <div class="raid-stat-block">
                <span class="profile-stat-label">Skill:</span>
                <span class="profile-stat-value">${player.totalScore.toFixed(2)}(${getRankLabel(player.totalScore)})</span>
            </div>
        </div>
  `;

    const findPlayerById = (id) => data.find(p => p.id === id);

    const playerOneInput = document.getElementById('playerOneId');
    const playerTwoInput = document.getElementById('playerTwoId');
    const playerOneStatsDiv = document.getElementById('playerOneStats');
    const playerTwoStatsDiv = document.getElementById('playerTwoStats');
    const comparisonResultDiv = document.getElementById('comparisonResult');

    playerOneInput.value = localStorage.getItem('playerOneId') || '';
    playerTwoInput.value = localStorage.getItem('playerTwoId') || '';

    const updateStats = () => {
        const p1Id = playerOneInput.value.trim();
        const p2Id = playerTwoInput.value.trim();

        localStorage.setItem('playerOneId', p1Id);
        localStorage.setItem('playerTwoId', p2Id);

        const p1 = findPlayerById(p1Id);
        const p2 = findPlayerById(p2Id);

        playerOneStatsDiv.innerHTML = p1 ? getPlayerStatsHTML(p1) : '<p>Player ID not found</p>';
        playerTwoStatsDiv.innerHTML = p2 ? getPlayerStatsHTML(p2) : '<p>Player ID not found</p>';

        if (p1 && p2) {
            let result = '<h3>Comparison</h3><ul>';
            result += `<li>Raids: ${p1.pmcRaids} vs ${p2.pmcRaids} (${p1.pmcRaids > p2.pmcRaids ? `${p1.name} wins` : p1.pmcRaids < p2.pmcRaids ? `${p2.name} wins` : 'Tie'})</li>`;
            result += `<li>Kills: ${p1.pmcKills} vs ${p2.pmcKills} (${p1.pmcKills > p2.pmcKills ? `${p1.name} wins` : p1.pmcKills < p2.pmcKills ? `${p2.name} wins` : 'Tie'})</li>`;
            result += `<li>Rank: ${p1.rank} vs ${p2.rank} (${p1.rank < p2.rank ? `${p1.name} wins` : p1.rank > p2.rank ? `${p2.name} wins` : 'Tie'})</li>`;
            result += '</ul>';
            comparisonResultDiv.innerHTML = result;
        } else {
            comparisonResultDiv.innerHTML = '';
        }
    };

    playerOneInput.addEventListener('input', updateStats);
    playerTwoInput.addEventListener('input', updateStats);

    // First launch
    if (playerOneInput.value || playerTwoInput.value) {
        updateStats();
    }
}