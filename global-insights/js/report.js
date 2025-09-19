//     _____ ____  ______   __    _________    ____  __________  ____  ____  ___    ____  ____ 
//    / ___// __ \/_  __/  / /   / ____/   |  / __ \/ ____/ __ \/ __ )/ __ \/   |  / __ \/ __ \
//    \__ \/ /_/ / / /    / /   / __/ / /| | / / / / __/ / /_/ / __  / / / / /| | / /_/ / / / /  
//   ___/ / ____/ / /    / /___/ /___/ ___ |/ /_/ / /___/ _, _/ /_/ / /_/ / ___ |/ _, _/ /_/ / 
//  /____/_/     /_/    /_____/_____/_/  |_/_____/_____/_/ |_/_____/\____/_/  |_/_/ |_/_____/  

let playersData = [];
let mapsData = {};
let charts = {}; // to store all charts

// DOM
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');

// Initialize all charts
function initCharts() {
    // Destroy existing charts if they exist
    Object.values(charts).forEach(chart => {
        if (chart) chart.destroy();
    });

    charts = {
        pmcScavChart: createChart(
            'pmcScavChart',
            'pie',
            ['PMC', 'SCAV'],
            [0, 0],
            'Raids'
        ),
        survivalRateChart: createChart(
            'survivalRateChart',
            'bar',
            ['0-20%', '21-40%', '41-60%', '61-80%', '81-100%'],
            [0, 0, 0, 0, 0],
            'Players'
        ),
        kdRatioChart: createChart(
            'kdRatioChart',
            'bar',
            ['0-1 K/D', '2-5 K/D', '6-10 K/D', '11-20 K/D', '21+ K/D'],
            [0, 0, 0, 0, 0],
            'Players'
        ),
        accountTypesChart: createChart(
            'accountTypesChart',
            'doughnut',
            ['Standard', 'Edge of Darkness', 'Unheard Edition', 'Left Behind', 'Prepare For Escape'],
            [0, 0, 0, 0, 0],
            'Players'
        ),
        pmcSidesChart: createChart(
            'pmcSidesChart',
            'pie',
            ['USEC', 'BEAR'],
            [0, 0],
            'Players'
        ),
        levelsChart: createChart(
            'levelsChart',
            'bar',
            ['1-10 LVL', '11-20 LVL', '21-30 LVL', '31-40 LVL', '41-50 LVL', '51+ LVL'],
            [0, 0, 0, 0, 0, 0],
            'PMC Level'
        ),
        prestigeChart: createChart(
            'prestigeChart',
            'bar',
            ['No Prestige', 'Prestige LVL 1', 'Prestige LVL 2'],
            [0, 0, 0],
            'Level'
        ),
        lifetimeChart: createChart(
            'lifetimeChart',
            'bar',
            ['0-5 min', '5-10 min', '10-15 min', '15-20 min', '20+ min'],
            [0, 0, 0, 0, 0],
            'Players'
        ),
        longestShotsChart: createChart(
            'longestShotsChart',
            'bar',
            ['0-100m', '100-200m', '200-300m', '300-400m', '400+m'],
            [0, 0, 0, 0, 0],
            'Players'
        ),
        mapsChart: createChart(
            'mapsChart',
            'bar',
            [],
            [],
            'Raids Recorded',
            true
        ),
        hitDistributionChart: createChart(
            'hitDistributionChart',
            'bar',
            ['Head', 'Chest', 'Stomach', 'Left Arm', 'Right Arm', 'Left Leg', 'Right Leg'],
            [0, 0, 0, 0, 0, 0, 0],
            'Average Hits per Player',
            false,
            'Hit Distribution by Body Part'
        ),
        activityChart: createChart(
            'activityChart',
            'bar',
            ['<1 Week', '<1 Month', '<3 Months', '>3 Months'],
            [0, 0, 0, 0],
            'Players',
            false,
            'Player Activity (Last Played)'
        ),
        traderPopularityChart: createChart(
            'traderPopularityChart',
            'bar',
            ['Prapor', 'Therapist', 'Skier', 'Peacekeeper', 'Mechanic', 'Ragman', 'Jaeger', 'Fence', 'Lightkeeper'],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            'Players (LL > 2)',
            true,
            'Trader Popularity (Loyalty Level > 2)'
        ),
        salesSumChart: createChart(
            'salesSumChart',
            'bar',
            ['<1M', '1-5M', '5-10M', '10-50M', '50M+'],
            [0, 0, 0, 0, 0],
            'Players',
            false,
            'Total Trader Sales Sum'
        ),
        playstyleChart: createChart(
            'playstyleChart',
            'pie',
            ['PvE Focused', 'Mixed', 'PvP (PMC Kills) Focused'],
            [0, 0, 0],
            'Players',
            false,
            'Playstyle Distribution (PvP vs PvE)'
        ),
        bossKillsChart: createChart(
            'bossKillsChart',
            'bar',
            ['0 Kills', '1-50 Kills', '50-200 Kills', '200+ Kills'],
            [0, 0, 0, 0],
            'Players',
            false,
            'Boss Kills Distribution'
        )
    };
}

// Helper function to create chart
function createChart(canvasId, type, labels, data, label, isMapChart = false) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error(`Canvas element with id '${canvasId}' not found`);
        return null;
    }

    const ctx = canvas.getContext('2d');

    const backgroundColors = isMapChart
        ? Array(labels.length).fill().map(() => getRandomColor())
        : ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#f59e0b'];

    return new Chart(ctx, {
        type: type,
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                backgroundColor: backgroundColors,
                borderColor: '#334155',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#f8fafc',
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    enabled: true,
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function (context) {
                            return `${context.label}: ${context.raw}`;
                        }
                    }
                }
            },
            scales: (type === 'bar' || type === 'line') ? {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#94a3b8'
                    },
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#94a3b8'
                    },
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    }
                }
            } : undefined
        }
    });
}

// Fetch data
async function fetchData() {
    try {
        initCharts();

        // Fetch data from all
        const [season1Response, season2Response, season3Response, season4Response, season5Response, mapsResponse] = await Promise.all([
            fetch('../fallbacks/season1.json'),
            fetch('../fallbacks/season2.json'),
            fetch('../fallbacks/season3.json'),
            fetch('../fallbacks/season4.json'),
            fetch('https://visuals.nullcore.net/SPT/data/seasons/season5.json'),
            fetch('https://visuals.nullcore.net/SPT/data/shared/global_counters.json')
        ]);

        const season1Data = await season1Response.json();
        const season2Data = await season2Response.json();
        const season3Data = await season3Response.json();
        const season4Data = await season4Response.json();
        const season5Data = await season5Response.json();
        mapsData = await mapsResponse.json();

        // Combine
        playersData = [...season1Data.leaderboard, ...season2Data.leaderboard, ...season3Data.leaderboard, ...season4Data.leaderboard, ...season5Data.leaderboard];

        // Display
        processPlayersData();
        processMapsData();
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

// Process players data
function processPlayersData() {
    const totalPlayers = playersData.length;

    const trustedPlayers = playersData.filter(p => p.trusted).length;
    const trustedPercent = (trustedPlayers / totalPlayers * 100).toFixed(1);
    const kappaPlayers = playersData.filter(p => p.hasKappa).length;
    const kappaPercent = (kappaPlayers / totalPlayers * 100).toFixed(1);
    const avgLevel = (playersData.reduce((sum, p) => sum + p.pmcLevel, 0) / totalPlayers).toFixed(1);

    const totalPmcRaids = playersData.reduce((sum, p) => sum + (p.pmcRaids || 0), 0);
    const totalScavRaids = playersData.reduce((sum, p) => sum + (p.scavRaids || 0), 0);
    const totalRaids = totalPmcRaids + totalScavRaids;
    const totalPlayTimeSeconds = playersData.reduce((sum, p) => sum + (p.totalPlayTime || 0), 0);
    const totalPlayTimeFormatted = formatPlayTime(totalPlayTimeSeconds);

    const totalKills = playersData.reduce((sum, p) => sum + (p.pmcKills || 0) + (p.bossesKilled || 0) + (p.scavsKilled || 0), 0);
    const totalDeaths = playersData.reduce((sum, p) => sum + (p.pmcDeaths || 0) + (p.scavDeaths || 0), 0);
    const globalKDRatio = (totalKills / Math.max(totalDeaths, 1)).toFixed(2);

    document.getElementById('total-players').textContent = totalPlayers;
    document.getElementById('total-raids-recorded').textContent = totalRaids;
    document.getElementById('total-play-time').textContent = totalPlayTimeFormatted;
    document.getElementById('trusted-players').textContent = trustedPlayers;
    document.getElementById('trusted-percent').textContent = `${trustedPercent}%`;
    document.getElementById('kappa-players').textContent = kappaPlayers;
    document.getElementById('kappa-percent').textContent = `${kappaPercent}%`;
    document.getElementById('avg-level').textContent = avgLevel;
    document.getElementById('total-kills').textContent = totalKills;
    document.getElementById('global-kd').textContent = globalKDRatio;

    // PMC/SCAV raids
    updateChart(charts.pmcScavChart, [totalPmcRaids, totalScavRaids]);

    // Survival rate distribution
    const survivalRates = [0, 0, 0, 0, 0];
    playersData.forEach(p => {
        const rate = p.survivalRate;
        if (rate <= 20) survivalRates[0]++;
        else if (rate <= 40) survivalRates[1]++;
        else if (rate <= 60) survivalRates[2]++;
        else if (rate <= 80) survivalRates[3]++;
        else survivalRates[4]++;
    });
    updateChart(charts.survivalRateChart, survivalRates);

    // K/D ratio distribution
    const kdRatios = [0, 0, 0, 0, 0];
    playersData.forEach(p => {
        const kd = p.killToDeathRatio;
        if (kd <= 1) kdRatios[0]++;
        else if (kd <= 5) kdRatios[1]++;
        else if (kd <= 10) kdRatios[2]++;
        else if (kd <= 20) kdRatios[3]++;
        else kdRatios[4]++;
    });
    updateChart(charts.kdRatioChart, kdRatios);

    // Account editions
    const standardAccounts = playersData.filter(p => p.accountType === 'standard').length;
    const eodAccounts = playersData.filter(p => p.accountType === 'edge_of_darkness').length;
    const unheardAccounts = playersData.filter(p => p.accountType === 'unheard_edition').length;
    const leftbehindAccounts = playersData.filter(p => p.accountType === 'left_behind').length;
    const preparetoescapeAccounts = playersData.filter(p => p.accountType === 'prepare_for_escape').length;

    updateChart(charts.accountTypesChart, [standardAccounts, eodAccounts, unheardAccounts, leftbehindAccounts, preparetoescapeAccounts]);

    // PMC sides
    const usecPlayers = playersData.filter(p => p.pmcSide === 'Usec').length;
    const bearPlayers = playersData.filter(p => p.pmcSide === 'Bear').length;
    updateChart(charts.pmcSidesChart, [usecPlayers, bearPlayers]);

    // Levels distribution
    const levels = [0, 0, 0, 0, 0, 0];
    playersData.forEach(p => {
        const level = p.pmcLevel;
        if (level <= 10) levels[0]++;
        else if (level <= 20) levels[1]++;
        else if (level <= 30) levels[2]++;
        else if (level <= 40) levels[3]++;
        else if (level <= 50) levels[4]++;
        else levels[5]++;
    });
    updateChart(charts.levelsChart, levels);

    // Prestige distribution
    const prestiges = [0, 0, 0, 0, 0];
    playersData.forEach(p => {
        const prestige = p.prestige || 0;
        if (prestige === 0) prestiges[0]++;
        else if (prestige === 1) prestiges[1]++;
        else if (prestige === 2) prestiges[2]++;
        else if (prestige === 3) prestiges[3]++;
        else prestiges[4]++;
    });
    updateChart(charts.prestigeChart, prestiges);

    // Average lifetime distribution (in minutes)
    const lifetimes = [0, 0, 0, 0, 0];
    playersData.forEach(p => {
        const lifetime = p.averageLifeTime / 60;
        if (lifetime <= 5) lifetimes[0]++;
        else if (lifetime <= 10) lifetimes[1]++;
        else if (lifetime <= 15) lifetimes[2]++;
        else if (lifetime <= 20) lifetimes[3]++;
        else lifetimes[4]++;
    });
    updateChart(charts.lifetimeChart, lifetimes);

    // Longest shots distribution
    const longestShots = [0, 0, 0, 0, 0];
    playersData.forEach(p => {
        const shot = p.longestShot || 0;
        if (shot <= 100) longestShots[0]++;
        else if (shot <= 200) longestShots[1]++;
        else if (shot <= 300) longestShots[2]++;
        else if (shot <= 400) longestShots[3]++;
        else longestShots[4]++;
    });
    updateChart(charts.longestShotsChart, longestShots);

    // Hit Distribution
    const avgHitDistribution = { head: 0, chest: 0, stomach: 0, leftArm: 0, rightArm: 0, leftLeg: 0, rightLeg: 0 };
    playersData.forEach(p => {
        if (p.raidHits) {
            for (const [zone, count] of Object.entries(p.raidHits)) {
                avgHitDistribution[zone] += count;
            }
        }
    });
    const hitDistributionValues = [
        (avgHitDistribution.head / totalPlayers).toFixed(1),
        (avgHitDistribution.chest / totalPlayers).toFixed(1),
        (avgHitDistribution.stomach / totalPlayers).toFixed(1),
        (avgHitDistribution.leftArm / totalPlayers).toFixed(1),
        (avgHitDistribution.rightArm / totalPlayers).toFixed(1),
        (avgHitDistribution.leftLeg / totalPlayers).toFixed(1),
        (avgHitDistribution.rightLeg / totalPlayers).toFixed(1)
    ];
    updateChart(charts.hitDistributionChart, hitDistributionValues);

    // Activity (online)
    const now = Math.floor(Date.now() / 1000);
    const activityGroups = [0, 0, 0, 0]; // <1 week, <1 month, <3 months, >3 months

    playersData.forEach(p => {
        const daysSinceLastPlayed = (now - p.lastPlayed) / (60 * 60 * 24);

        if (daysSinceLastPlayed <= 7) activityGroups[0]++;
        else if (daysSinceLastPlayed <= 30) activityGroups[1]++;
        else if (daysSinceLastPlayed <= 90) activityGroups[2]++;
        else activityGroups[3]++;
    });
    updateChart(charts.activityChart, activityGroups);

    // trader popularity
    const traderPopularity = {
        'PRAPOR': 0, 'THERAPIST': 0, 'SKIER': 0, 'PEACEKEEPER': 0,
        'MECHANIC': 0, 'RAGMAN': 0, 'JAEGER': 0, 'FENCE': 0, 'LIGHTKEEPER': 0
    };

    playersData.forEach(p => {
        if (p.traderInfo) {
            for (const [traderName, info] of Object.entries(p.traderInfo)) {
                if (traderPopularity.hasOwnProperty(traderName) && info.unlocked && info.loyaltyLevel >= 2) {
                    traderPopularity[traderName]++;
                }
            }
        }
    });

    const traderValues = [
        traderPopularity.PRAPOR,
        traderPopularity.THERAPIST,
        traderPopularity.SKIER,
        traderPopularity.PEACEKEEPER,
        traderPopularity.MECHANIC,
        traderPopularity.RAGMAN,
        traderPopularity.JAEGER,
        traderPopularity.FENCE,
        traderPopularity.LIGHTKEEPER
    ];
    updateChart(charts.traderPopularityChart, traderValues);

    // Sales Sum Distribution
    const salesSumRanges = [0, 0, 0, 0, 0]; // <1M, 1-5M, 5-10M, 10-50M, 50M+
    playersData.forEach(p => {
        let totalSales = 0;
        if (p.traderInfo) {
            for (const trader of Object.values(p.traderInfo)) {
                totalSales += trader.salesSum || 0;
            }
        }
        totalSales /= 1000000;

        if (totalSales < 1) salesSumRanges[0]++;
        else if (totalSales < 5) salesSumRanges[1]++;
        else if (totalSales < 10) salesSumRanges[2]++;
        else if (totalSales < 50) salesSumRanges[3]++;
        else salesSumRanges[4]++;
    });
    updateChart(charts.salesSumChart, salesSumRanges);

    // Playstyle Distribution (PvP (pmc kills) vs PvE)
    const playstyleGroups = [0, 0, 0]; // PvE Focused, Mixed, PvP Focused
    playersData.forEach(p => {
        const totalKills = p.scavsKilled + p.bossesKilled + p.pmcKills;
        if (totalKills === 0) {
            playstyleGroups[1]++; // Mixed
            return;
        }
        const pvpRatio = (p.pmcKills / totalKills) * 100;

        if (pvpRatio < 30) playstyleGroups[0]++;
        else if (pvpRatio < 70) playstyleGroups[1]++;
        else playstyleGroups[2]++;
    });
    updateChart(charts.playstyleChart, playstyleGroups);

    // Boss Kills Distribution
    const bossKillsRanges = [0, 0, 0, 0]; // 0, 1-50, 50-200, 200+
    playersData.forEach(p => {
        const bossKills = p.bossesKilled || 0;
        if (bossKills === 0) bossKillsRanges[0]++;
        else if (bossKills <= 50) bossKillsRanges[1]++;
        else if (bossKills <= 200) bossKillsRanges[2]++;
        else bossKillsRanges[3]++;
    });
    updateChart(charts.bossKillsChart, bossKillsRanges);
}

// Process maps data
function processMapsData() {

    // Filter so we only show maps
    const validMapIds = [
        "factory4_day",
        "factory4_night",
        "bigmap",
        "Woods",
        "Shoreline",
        "Interchange",
        "RezervBase",
        "Lighthouse",
        "TarkovStreets",
        "laboratory",
        "Sandbox",
        "Sandbox_high"
    ];

    const mapEntries = Object.entries(mapsData).filter(([mapId]) => validMapIds.includes(mapId));

    const mapNames = mapEntries.map(([mapId]) => mapId);
    const mapCounts = mapEntries.map(([_, count]) => count);
    const backgroundColors = mapNames.map(() => getRandomColor());
    const friendlyMapNames = mapNames.map(mapId => getFriendlyMapName(mapId));

    // Update chart
    charts.mapsChart.data.labels = friendlyMapNames;
    charts.mapsChart.data.datasets[0].data = mapCounts;
    charts.mapsChart.data.datasets[0].backgroundColor = backgroundColors;
    charts.mapsChart.update();

    // Update map list
    const mapStatsContainer = document.getElementById('map-stats');
    mapStatsContainer.innerHTML = '';

    // Calculate total raids for percentage
    const totalRaids = mapCounts.reduce((sum, count) => sum + count, 0);

    // Sort maps by raids
    const sortedMaps = mapNames.map((mapId, i) => ({
        id: mapId,
        name: friendlyMapNames[i],
        count: mapCounts[i],
        percent: (mapCounts[i] / totalRaids * 100).toFixed(1),
        color: backgroundColors[i]
    })).sort((a, b) => b.count - a.count);

    sortedMaps.forEach(map => {
        const mapItem = document.createElement('div');
        mapItem.className = 'map-item';
        mapItem.innerHTML = `
            <span>${map.name}</span>
            <span class="map-count">${map.count}</span>
            <span>(${map.percent}%)</span>
        `;
        mapStatsContainer.appendChild(mapItem);
    });
}

function formatPlayTime(seconds) {
    if (!seconds) return "0 min";

    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0 || parts.length === 0) parts.push(`${minutes}min`);

    return parts.join(' ');
}

// To update chart data
function updateChart(chart, newData) {
    chart.data.datasets[0].data = newData;
    chart.update();
}

// Get a nice name for a map :3
function getFriendlyMapName(mapId) {
    const mapNames = {
        "factory4_day": "Factory (day)",
        "factory4_night": "Factory (night)",
        "bigmap": "Customs",
        "Woods": "Woods",
        "Shoreline": "Shoreline",
        "Interchange": "Interchange",
        "RezervBase": "Reserve",
        "Lighthouse": "Lighthouse",
        "TarkovStreets": "Streets of Tarkov",
        "laboratory": "Labs",
        "Sandbox": "Ground Zero",
        "Sandbox_high": "Ground Zero - High"
    };
    return mapNames[mapId] || mapId;
}

// Random color
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// Initialize
document.addEventListener('DOMContentLoaded', fetchData);