// When data loaded
document.addEventListener('DOMContentLoaded', loadLeaderboardData);

let leaderboardData = []; // For keeping data
let sortDirection = {}; // Sort direction

// Loading data.json
async function loadLeaderboardData() {
    const loadingNotification = document.getElementById('loadingNotification');
    loadingNotification.style.display = 'block';

    try {
        const response = await fetch('js/data.json');
        if (!response.ok) {
            throw new Error('Failed to load leaderboard data');
        }
        const data = await response.json();
        leaderboardData = data.leaderboard;
        addColorIndicators(leaderboardData);
        calculateRanks(leaderboardData);
        calculateOverallStats(leaderboardData);
        displayLeaderboard(leaderboardData);
        addSortListeners();
    } catch (error) {
        console.error('Error loading leaderboard data:', error);
    } finally {
        loadingNotification.style.display = 'none';
    }
}

function displayLeaderboard(data) {
    const tableBody = document.querySelector('#leaderboardTable tbody');
    tableBody.innerHTML = '';

    data.forEach(player => {
        const row = document.createElement('tr');

        let rankClass = '';
        let nameClass = '';
        if (player.rank === 1) {
            rankClass = 'gold';
            nameClass = 'gold-name';
        } else if (player.rank === 2) {
            rankClass = 'silver';
            nameClass = 'silver-name';
        } else if (player.rank === 3) {
            rankClass = 'bronze';
            nameClass = 'bronze-name';
        }

        function formatLastPlayed(dateString) {
            const [day, month, year] = dateString.split('.').map(Number);
            const lastPlayedDate = new Date(year, month - 1, day);

            const currentDate = new Date();
        
            currentDate.setHours(0, 0, 0, 0);
            lastPlayedDate.setHours(0, 0, 0, 0);

            const timeDifference = currentDate - lastPlayedDate;
            const daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
        

            if (daysDifference === 0) {
                return 'just now';
            } else if (daysDifference === 1) {
                return '1d ago';
            } else if (daysDifference < 30) {
                return `${daysDifference}d ago`;
            } else if (daysDifference < 365) {
                const monthsDifference = Math.floor(daysDifference / 30);
                return `${monthsDifference}mo ago`;
            } else {
                const yearsDifference = Math.floor(daysDifference / 365);
                return `${yearsDifference}y ago`;
            }
        }

        // Turning last game to ago
        let lastGame = formatLastPlayed(player.lastPlayed)

        // EFT Account icons and colors
        let accountIcon = '';
        let accountColor = '';
        switch (player.accountType) {
            case 'edge_of_darkness':
                accountIcon = '<img src="media/EOD.png" alt="EOD" class="account-icon">';
                accountColor = '#be8301';
                break;
            case 'unheard_edition':
                accountIcon = '<img src="media/Unheard.png" alt="Unheard" class="account-icon">';
                accountColor = '#54d0e7';
                break;
        }

        // If using Twitch Players
        let TPicon = '';
        if (player.isUsingTwitchPlayers) {
            TPicon = '✅';
        } else {
            TPicon = '❌';
        }

        // Get skill
        const rankLabel = getRankLabel(player.totalScore);

        // Compare SPT version of user
        const sptVerClass = compareVersions(player.sptVer, '3.11.1') < 0 ? 'old-version' : 'current-version';
        function compareVersions(version1, version2) {
            const v1 = version1.split('.').map(Number);
            const v2 = version2.split('.').map(Number);

            for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
                const part1 = v1[i] || 0;
                const part2 = v2[i] || 0;

                if (part1 > part2) return 1;  // version1 > version2
                if (part1 < part2) return -1; // version1 < version2
            }

            return 0;
        }

        row.innerHTML = `
            <td class="rank ${rankClass}">${player.rank} ${player.medal}</td>
            <td class="player-name ${nameClass}" style="color: ${accountColor}">${accountIcon} ${player.name}</td>
            <td>${lastGame || 'N/A'}</td>
            <td>${player.pmcLevel}</td>
            <td>${player.totalRaids}</td>
            <td class="${player.survivedToDiedRatioClass}">${player.survivedToDiedRatio}%</td>
            <td class="${player.killToDeathRatioClass}">${player.killToDeathRatio}</td>
            <td class="${player.averageLifeTimeClass}">${player.averageLifeTime}</td>
            <td>${player.totalScore <= 0 ? 'Calibrating...' : player.totalScore.toFixed(2)} ${player.totalScore <= 0 ? '' : `(${rankLabel})`}</td>
            <td>${TPicon}</td>
            <td class="${sptVerClass}">${player.sptVer}</td>
        `;

        tableBody.appendChild(row);
    });
}

function addSortListeners() {
    const headers = document.querySelectorAll('#leaderboardTable th[data-sort]');
    headers.forEach(header => {
        header.addEventListener('click', () => {
            const sortKey = header.getAttribute('data-sort');
            sortLeaderboard(sortKey);
        });
    });
}

function sortLeaderboard(sortKey) {
    if (!sortDirection[sortKey]) {
        sortDirection[sortKey] = 'asc';
    } else {
        sortDirection[sortKey] = sortDirection[sortKey] === 'asc' ? 'desc' : 'asc';
    }

    leaderboardData.sort((a, b) => {
        let valueA = a[sortKey];
        let valueB = b[sortKey];

        if (sortKey === 'rank') {
            valueA = a.rank;
            valueB = b.rank;
        }

        if (sortKey === 'pmcLevel' || sortKey === 'totalRaids' || sortKey === 'survivedToDiedRatio' || sortKey === 'killToDeathRatio' || sortKey === 'totalScore') {
            valueA = parseFloat(valueA);
            valueB = parseFloat(valueB);
        }

        if (sortKey === 'averageLifeTime') {
            valueA = convertTimeToSeconds(valueA);
            valueB = convertTimeToSeconds(valueB);
        }

        if (valueA < valueB) {
            return sortDirection[sortKey] === 'asc' ? -1 : 1;
        }
        if (valueA > valueB) {
            return sortDirection[sortKey] === 'asc' ? 1 : -1;
        }
        return 0;
    });

    displayLeaderboard(leaderboardData);
}

function convertTimeToSeconds(time) {
    const [minutes, seconds] = time.split(':').map(Number);
    return minutes * 60 + seconds;
}

function addColorIndicators(data) {
    data.forEach(player => {
        // Survived/Died Ratio
        if (player.survivedToDiedRatio < 30) { // Less than 30%
            player.survivedToDiedRatioClass = 'bad';
        } else if (player.survivedToDiedRatio >= 30 && player.survivedToDiedRatio < 55) { // 30% - 54%
            player.survivedToDiedRatioClass = 'average';
        } else if (player.survivedToDiedRatio >= 55 && player.survivedToDiedRatio < 65) { // 55% - 64%
            player.survivedToDiedRatioClass = 'good';
        } else { // 65% and above
            player.survivedToDiedRatioClass = 'impressive';
        }

        // Kill/Death Ratio
        if (player.killToDeathRatio < 5) { // Less than 5
            player.killToDeathRatioClass = 'bad';
        } else if (player.killToDeathRatio >= 5 && player.killToDeathRatio < 12) { // 5 - 7.99
            player.killToDeathRatioClass = 'average';
        } else if (player.killToDeathRatio >= 12 && player.killToDeathRatio < 15) { // 8 - 14.99
            player.killToDeathRatioClass = 'good';
        } else { // 15 and above
            player.killToDeathRatioClass = 'impressive';
        }

        // Average Life Time
        const lifeTimeSeconds = convertTimeToSeconds(player.averageLifeTime);
        if (lifeTimeSeconds < 300) { // Less than 5 minutes
            player.averageLifeTimeClass = 'bad';
        } else if (lifeTimeSeconds >= 300 && lifeTimeSeconds < 900) { // 5 - 14.99 minutes
            player.averageLifeTimeClass = 'average';
        } else if (lifeTimeSeconds >= 900 && lifeTimeSeconds < 1200) { // 15 - 19.99 minutes
            player.averageLifeTimeClass = 'good';
        } else { // 20 minutes and above
            player.averageLifeTimeClass = 'impressive';
        }
    });
}

// Ranking calculation (needed comments for this one)
function calculateRanks(data) {
    data.forEach(player => {
        const kdrScore = player.killToDeathRatio * 0.2; // 20% weight
        const sdrScore = player.survivedToDiedRatio * 0.2; // 20% weight
        const raidsScore = player.totalRaids * 0.4; // 40% weight with smoothing
        const pmcLevelScore = player.pmcLevel * 0.2; // 20% weight

        // Total score
        player.totalScore = kdrScore + sdrScore + Math.log(raidsScore) + pmcLevelScore;

        // Tune the player skill score down if he has less than 30 raids


        // If player is not using Twitch Players (with intent that it's gonna be easier) tune down his total score
        // Very hacky, but should work for now
        if(!player.isUsingTwitchPlayers){
            player.totalScore -= 5;
        }
    });

    // Sorting by skill score
    data.sort((a, b) => b.totalScore - a.totalScore);

    // Ranks and medals :D
    data.forEach((player, index) => {
        player.rank = index + 1;
        if (player.rank === 1) {
            player.medal = '🥇';
        } else if (player.rank === 2) {
            player.medal = '🥈';
        } else if (player.rank === 3) {
            player.medal = '🥉';
        } else {
            player.medal = '';
        }
    });
}

function getRankLabel(totalScore) {
    if (totalScore < 15) return 'L-';
    if (totalScore < 16) return 'L';
    if (totalScore < 17) return 'L+';
    if (totalScore < 18) return 'M-';
    if (totalScore < 19) return 'M';
    if (totalScore < 20) return 'M+';
    if (totalScore < 21) return 'H-';
    if (totalScore < 23) return 'H';
    if (totalScore < 24) return 'H+';
    if (totalScore < 25) return 'P-';
    if (totalScore < 27) return 'P';
    if (totalScore < 30) return 'P+';
    return 'G';
}

// Overall stats calc
function calculateOverallStats(data) {
    let totalDeaths = 0;
    let totalRaids = 0;
    let totalKills = 0;
    let totalKDR = 0;
    let totalSurvival = 0;
    let totalDeathsFromTwitchPlayers = 0;

    data.forEach(player => {
        if (player.isUsingTwitchPlayers) {
            totalDeaths += Math.round(player.totalRaids * (100 - player.survivedToDiedRatio) / 100);
            totalDeathsFromTwitchPlayers += Math.round(player.totalRaids * (100 - player.survivedToDiedRatio) / 100);
        } else {
            totalDeaths += Math.round(player.totalRaids * (100 - player.survivedToDiedRatio) / 100);
        }
        totalRaids += parseInt(player.totalRaids);
        totalKills += parseFloat(player.killToDeathRatio) * Math.round(player.totalRaids * (100 - player.survivedToDiedRatio) / 100);
        totalKDR += parseFloat(player.killToDeathRatio);
        totalSurvival += parseFloat(player.survivedToDiedRatio);
    });

    const averageKDR = (totalKDR / data.length).toFixed(2);
    const averageSurvival = (totalSurvival / data.length).toFixed(2);

    // Update all stats
    animateNumber('totalDeaths', totalDeaths);
    animateNumber('totalDeathsFromTP', totalDeathsFromTwitchPlayers);
    animateNumber('totalRaids', totalRaids);
    animateNumber('totalKills', Math.round(totalKills));
    animateNumber('averageKDR', averageKDR, 2);
    animateNumber('averageSurvival', averageSurvival, 2);
}

// Simple number animation (CountUp.js)
function animateNumber(elementId, targetValue, decimals = 0) {
    const element = document.getElementById(elementId);
    const suffix = elementId === 'averageSurvival' ? '%' : '';

    const countUp = new CountUp(element, targetValue, {
        startVal: 0,
        duration: 2,
        decimalPlaces: decimals,
        separator: ',',
        suffix: suffix
    });

    if (!countUp.error) {
        countUp.start();
    } else {
        console.error(countUp.error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const infoModal = document.getElementById('infoModal');
    const infoButton = document.getElementById('infoButton');
    const calcModal = document.getElementById('calcModal');
    const calcButton = document.getElementById('calcButton');
    const closeButtons = document.querySelectorAll('.close');

    if (infoButton && infoModal && calcButton && calcModal && closeButtons.length) {
        infoButton.addEventListener('click', () => {
            infoModal.style.display = 'block';
        });

        calcButton.addEventListener('click', () => {
            calcModal.style.display = 'block';
        });

        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                infoModal.style.display = 'none';
                calcModal.style.display = 'none';
            });
        });

        window.addEventListener('click', (event) => {
            if (event.target === infoModal) {
                infoModal.style.display = 'none';
            }
            if (event.target === calcModal) {
                calcModal.style.display = 'none';
            }
        });
    } else {
        console.error('Cant find elements for modal');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // format time diff
    function formatTimeDifference(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000); // Difference in seconds

        const intervals = {
            year: 31536000,
            month: 2592000,
            week: 604800,
            day: 86400,
            hour: 3600,
            minute: 60,
            second: 1,
        };

        // Find interval
        for (const [unit, seconds] of Object.entries(intervals)) {
            const interval = Math.floor(diffInSeconds / seconds);
            if (interval >= 1) {
                return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
            }
        }

        return 'just now';
    }

    // Load date (yes I use two similar functions because fuck JS)
    fetch('js/last-updated.txt')
        .then(response => response.text())
        .then(data => {
            const dateParts = data.split(/[ .:]/);
            const year = parseInt(dateParts[0], 10);
            const month = parseInt(dateParts[1], 10) - 1; // JS is so stupid holy fuck
            const day = parseInt(dateParts[2], 10);
            const hour = parseInt(dateParts[3], 10);
            const minute = parseInt(dateParts[4], 10);

            const lastUpdatedDate = new Date(year, month, day, hour, minute);

            const formattedDifference = formatTimeDifference(lastUpdatedDate);

            // Display
            document.getElementById('highlight').textContent = formattedDifference;
        }).catch(error => console.error('Error loading date:', error));
});