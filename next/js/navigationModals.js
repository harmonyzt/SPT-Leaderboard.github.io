//     _____ ____  ______   __    _________    ____  __________  ____  ____  ___    ____  ____ 
//    / ___// __ \/_  __/  / /   / ____/   |  / __ \/ ____/ __ \/ __ )/ __ \/   |  / __ \/ __ \
//    \__ \/ /_/ / / /    / /   / __/ / /| | / / / / __/ / /_/ / __  / / / / /| | / /_/ / / / /  
//   ___/ / ____/ / /    / /___/ /___/ ___ |/ /_/ / /___/ _, _/ /_/ / /_/ / ___ |/ _, _/ /_/ / 
//  /____/_/     /_/    /_____/_____/_/  |_/_____/_____/_/ |_/_____/\____/_/  |_/_/ |_/_____/    

let playerWidget;
let playerOneInput;
let widgetContainer;

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
        toggleModal(elements.settingsModal, true);
        if (playerWidget) playerWidget.show();
    });

    // Close modal if close button was clicked
    elements.closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            toggleModal(elements.infoModal, false);
            toggleModal(elements.tosModal, false);
            toggleModal(elements.settingsModal, false);
            if (playerWidget) playerWidget.hideIfEmpty();
        });
    });

    // Close modal if user clicked outside of it
    window.addEventListener('click', (event) => {
        if (event.target === elements.infoModal) toggleModal(elements.infoModal, false);
        if (event.target === elements.tosModal) toggleModal(elements.tosModal, false);
        if (event.target === elements.settingsModal) {
            toggleModal(elements.settingsModal, false);
            if (playerWidget) playerWidget.hideIfEmpty();
        }
    });
});

function initProfileWatchList(data) {
    if (document.getElementById('playerComparisonWidget')) return; // already have widget

    // Create widget when settings opened or it has id
    widgetContainer = document.createElement('div');
    widgetContainer.id = 'playerComparisonWidget';
    widgetContainer.className = 'draggable-widget';
    widgetContainer.style.display = 'none';
    widgetContainer.innerHTML = `
        <div class="widget-header">
            <h3>Player Watchlist</h3>
            <button class="close-widget">x</button>
        </div>
        <div class="widget-content">
            <div class="player-inputs">
                <div class="player-input-group">
                    <label for="widgetPlayerOneId">Player ID:</label>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <input type="text" id="widgetPlayerOneId" class="player-id-input" style="flex: 1;">
                        <button id="copyIdBtn" title="Copy ID" class="icon-btn" style="display: none;"><i class='bx bx-copy'></i></button>
                        <button id="openProfileBtn" title="Open Profile" class="icon-btn" style="display: none;"><i class='bx bx-user-circle'></i></button>
                    </div>
                </div>
            </div>
            <div class="player-stats-container-watchlist">
                <div id="widgetPlayerOneStats"></div>
            </div>
        </div>
    `;
    document.body.appendChild(widgetContainer);

    const savedPosition = JSON.parse(localStorage.getItem('widgetPosition')) || { top: '20px', left: '20px' };
    widgetContainer.style.top = savedPosition.top;
    widgetContainer.style.left = savedPosition.left;

    // Drag logic
    const header = widgetContainer.querySelector('.widget-header');
    let isDragging = false, offsetX, offsetY;

    header.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('close-widget')) return;
        isDragging = true;
        offsetX = e.clientX - widgetContainer.getBoundingClientRect().left;
        offsetY = e.clientY - widgetContainer.getBoundingClientRect().top;
        widgetContainer.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        widgetContainer.style.left = `${e.clientX - offsetX}px`;
        widgetContainer.style.top = `${e.clientY - offsetY}px`;
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            widgetContainer.style.cursor = 'grab';
            localStorage.setItem('widgetPosition', JSON.stringify({
                top: widgetContainer.style.top,
                left: widgetContainer.style.left
            }));
        }
    });

    // Close widget
    widgetContainer.querySelector('.close-widget').addEventListener('click', () => {
        playerOneInput.value = '';
        localStorage.removeItem('playerOneId');
        playerOneStatsDiv.innerHTML = '';
        widgetContainer.style.display = 'none';
    });

    const getPlayerStatsHTML = (player) => `
        <div class="raid-stats-grid">
            <div class="raid-stat-block"><span class="profile-stat-label">Name:</span><span class="profile-stat-value"> ${player.name}</span></div>
            <div class="raid-stat-block"><span class="profile-stat-label">Rank:</span><span class="profile-stat-value"> ${player.rank}</span></div>
            <div class="raid-stat-block"><span class="profile-stat-label">K/D:</span><span class="profile-stat-value"> ${player.killToDeathRatio}</span></div>
            <div class="raid-stat-block"><span class="profile-stat-label">Skill:</span><span class="profile-stat-value"> ${player.totalScore.toFixed(2)}(${getRankLabel(player.totalScore)})</span></div>
        </div>
    `;

    const findPlayerById = (id) => data.find(p => p.id === id);
    playerOneInput = widgetContainer.querySelector('#widgetPlayerOneId');
    const playerOneStatsDiv = widgetContainer.querySelector('#widgetPlayerOneStats');
    const copyBtn = widgetContainer.querySelector('#copyIdBtn');
    const openBtn = widgetContainer.querySelector('#openProfileBtn');

    playerOneInput.value = localStorage.getItem('playerOneId') || '';

    const updateStats = () => {
        const p1Id = playerOneInput.value.trim();
        localStorage.setItem('playerOneId', p1Id);

        const p1 = findPlayerById(p1Id);

        if (p1) {
            playerOneStatsDiv.innerHTML = getPlayerStatsHTML(p1);
            copyBtn.style.display = 'inline-block';
            openBtn.style.display = 'inline-block';
        } else {
            playerOneStatsDiv.innerHTML = '<p class="not-found">Player ID not found</p>';
            copyBtn.style.display = 'none';
            openBtn.style.display = 'none';
        }
    };

    playerOneInput.addEventListener('input', updateStats);
    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(playerOneInput.value.trim()).then(() => {
            copyBtn.innerHTML = "<i class='bx bx-check'></i>";
            setTimeout(() => copyBtn.innerHTML = "<i class='bx bx-copy'></i>", 1500);
        });
    });

    openBtn.addEventListener('click', () => {
        const id = playerOneInput.value.trim();
        if (id) openProfile(id);
    });

    if (playerOneInput.value) {
        updateStats();
        widgetContainer.style.display = 'block';
    }

    // Show hide
    playerWidget = {
        show: () => widgetContainer.style.display = 'block',
        hideIfEmpty: () => {
            if (!playerOneInput.value.trim()) {
                widgetContainer.style.display = 'none';
            }
        }
    };
}