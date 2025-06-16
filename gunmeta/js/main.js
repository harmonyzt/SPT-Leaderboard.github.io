//     _____ ____  ______   __    _________    ____  __________  ____  ____  ___    ____  ____ 
//    / ___// __ \/_  __/  / /   / ____/   |  / __ \/ ____/ __ \/ __ )/ __ \/   |  / __ \/ __ \
//    \__ \/ /_/ / / /    / /   / __/ / /| | / / / / __/ / /_/ / __  / / / / /| | / /_/ / / / /  
//   ___/ / ____/ / /    / /___/ /___/ ___ |/ /_/ / /___/ _, _/ /_/ / /_/ / ___ |/ _, _/ /_/ / 
//  /____/_/     /_/    /_____/_____/_/  |_/_____/_____/_/ |_/_____/\____/_/  |_/_/ |_/_____/  

document.addEventListener('DOMContentLoaded', function () {
    //../fallbacks/shared/weapon_counters.json
    // https://visuals.nullcore.net/SPT/data/shared/weapon_counters.json
    fetch('https://visuals.nullcore.net/SPT/data/shared/weapon_counters.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok >:(');
            }
            return response.json();
        })
        .then(weaponData => {
            processWeaponData(weaponData);
        })
        .catch(error => {
            console.error('Error loading weapon data:', error);
        });

    function processWeaponData(weaponData) {
        const weaponMap = new Map();

        // Get all maps and weapons info
        for (const userId in weaponData.weapons) {
            const userData = weaponData.weapons[userId];
            const userLevel = userData.level || 0;
            const userMaps = userData.playedMaps || {};

            // Weapons
            if (userData.weapons) {
                for (const weaponName in userData.weapons) {
                    const weaponInfo = userData.weapons[weaponName];
                    const stats = weaponInfo.stats;

                    if (!weaponMap.has(weaponName)) {
                        weaponMap.set(weaponName, {
                            kills: 0,
                            headshots: 0,
                            totalShots: 0,
                            timesLost: 0,
                            levels: [],
                            originalIds: [],
                            maps: {}
                        });
                    }

                    const weaponEntry = weaponMap.get(weaponName);
                    weaponEntry.kills += stats.kills;
                    weaponEntry.headshots += stats.headshots;
                    weaponEntry.totalShots += stats.totalShots;
                    weaponEntry.timesLost += stats.timesLost;
                    weaponEntry.levels.push(userLevel);

                    if (weaponInfo.originalId) {
                        weaponEntry.originalIds.push(weaponInfo.originalId);
                    }

                    // Maps
                    if (userData.playedMaps) {
                        for (const mapName in userMaps) {
                            if (!weaponEntry.maps[mapName]) {
                                weaponEntry.maps[mapName] = 0;
                            }
                            weaponEntry.maps[mapName] += userMaps[mapName];
                        }
                    }
                }
            }
        }

        const allWeapons = Array.from(weaponMap.entries()).map(([name, stats]) => {
            const avgLevel = stats.levels.length > 0
                ? stats.levels.reduce((sum, level) => sum + level, 0) / stats.levels.length
                : 0;

            const topMaps = Object.entries(stats.maps)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([mapName]) => mapName);

            return {
                name,
                kills: stats.kills,
                headshots: stats.headshots,
                totalShots: stats.totalShots,
                timesLost: stats.timesLost,
                avgLevel: Math.round(avgLevel),
                playerCount: stats.levels.length,
                killsPercent: stats.totalShots > 0
                    ? ((stats.kills / stats.totalShots) * 100).toFixed(2)
                    : 0,
                headshotsPercent: stats.kills > 0
                    ? ((stats.headshots / stats.kills) * 100).toFixed(2)
                    : 0,
                avgShots: stats.kills > 0
                    ? (stats.totalShots / stats.kills).toFixed(2)
                    : 0,
                survivalRate: (stats.timesLost + stats.kills) > 0
                    ? (stats.kills / (stats.timesLost + stats.kills) * 100).toFixed(2)
                    : 0,    // NOT a survival rate but is meant for total times lost 
                topMaps // Top 3 maps for each weapon
            };
        });

        // Sort by kills
        allWeapons.sort((a, b) => b.kills - a.kills);

        // Get max kills
        const maxKills = Math.max(...allWeapons.map(w => w.kills));
        const maxPlayerCount = Math.max(...allWeapons.map(w => w.playerCount));

        // Tags
        allWeapons.forEach(weapon => {
            weapon.tags = [];
            weapon.mapTags = [];

            // Weapon tags
            if (weapon.avgLevel < 15) weapon.tags.push({ text: 'Fresh Wipe Meta', type: 'level' });
            if (weapon.avgLevel > 30) weapon.tags.push({ text: 'Veteran Choice', type: 'level' });
            if (weapon.kills === maxKills) weapon.tags.push({ text: 'Most Kills', type: 'kills' });
            if (weapon.kills > 50 && weapon.avgLevel > 20) weapon.tags.push({ text: 'Hot', type: 'kills' });
            if (weapon.headshotsPercent > 60 && weapon.headshotsPercent !== 100) weapon.tags.push({ text: 'Headhunter', type: 'accuracy' });
            if (weapon.headshotsPercent < 20 && weapon.headshotsPercent !== 0) weapon.tags.push({ text: 'Spray & Pray', type: 'accuracy' });
            if (weapon.playerCount === maxPlayerCount) weapon.tags.push({ text: 'Popular', type: 'popularity' });
            if (weapon.survivalRate > 95) weapon.tags.push({ text: 'Survivor', type: 'survival' });

            // Map tags
            if (weapon.topMaps.includes('factory4_day')) weapon.mapTags.push({ text: 'Factory Dominator', type: 'factory' });
            if (weapon.topMaps.includes('factory4_night')) weapon.mapTags.push({ text: 'Cultist Hunter', type: 'factory' });
            if (weapon.topMaps.includes('Woods')) weapon.mapTags.push({ text: 'Woods Stalker', type: 'woods' });
            if (weapon.topMaps.includes('bigmap')) weapon.mapTags.push({ text: 'Export Specialist', type: 'customs' });
            if (weapon.topMaps.includes('RezervBase')) weapon.mapTags.push({ text: 'Military Prototype', type: 'reserve' });
            if (weapon.topMaps.includes('Shoreline')) weapon.mapTags.push({ text: 'Shoreline Monster', type: 'shoreline' });
            if (weapon.topMaps.includes('Lighthouse')) weapon.mapTags.push({ text: 'Light Keeper', type: 'lighthouse' });
            if (weapon.topMaps.includes('Sandbox')) weapon.mapTags.push({ text: 'Ground Zero Dominator', type: 'reserve' });
            if (weapon.topMaps.includes('Sandbox_high')) weapon.mapTags.push({ text: 'Ground Zero Hero', type: 'woods' });
            if (weapon.topMaps.includes('Interchange')) weapon.mapTags.push({ text: 'Inter-raptor', type: 'factory' });
            if (weapon.topMaps.includes('TarkovStreets')) weapon.mapTags.push({ text: 'Streets Ruler', type: 'lighthouse' });
            if (weapon.topMaps.includes('laboratory')) weapon.mapTags.push({ text: 'Labs Demolisher', type: 'lighthouse' });
        });

        // Render
        const container = document.getElementById('weaponsContainer');
        container.innerHTML = '';

        allWeapons.forEach((weapon, index) => {
            const card = document.createElement('div');

            const weaponTagsHTML = weapon.tags.map(tag =>
                `<span class="weapon-tag weapon-tag--${tag.type}">${tag.text}</span>`
            ).join('');

            const mapTagsHTML = weapon.mapTags.map(tag =>
                `<span class="map-tag map-tag--${tag.type}">${tag.text}</span>`
            ).join('');

            card.innerHTML = `
        <div class="weapon-card animate__fadeIn">
            <div class="weapon-header">
                <div class="weapon-name-wrapper">
                    ${weapon.name ? `<img src="../media/weapon_icons/${weapon.name}.webp" alt="${weapon.name}" class="weapon-icon">` : ''}
                    <div class="weapon-name-container">
                        <span class="weapon-name">${weapon.name}</span>
                        <div class="weapon-tags">${weaponTagsHTML}</div>
                    </div>
                </div>
                <span class="weapon-rank">#${index + 1}</span>
            </div>
            
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-label">Kills</div>
                    <div class="stat-value">${weapon.kills.toLocaleString()} <span class="stat-extra">(${weapon.killsPercent}%)</span></div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Headshot Rate</div>
                    <div class="stat-value">${weapon.headshotsPercent}%</div>
                    <div class="progress-container">
                        <div class="progress-bar" style="width: ${weapon.headshotsPercent}%;"></div>
                    </div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">AVG Shots to kill</div>
                    <div class="stat-value">${weapon.avgShots}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Used by (Lvl avg)</div>
                    <div class="stat-value">${weapon.playerCount} <span class="stat-extra">(${weapon.avgLevel})</span></div>
                </div>
            </div>
            <div class="map-tags-container">
                <div class="map-tags">${mapTagsHTML}</div>
            </div>
        </div>
        `;
            container.appendChild(card);
        });
    }
});