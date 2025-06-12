document.addEventListener('DOMContentLoaded', function () {
    //../fallbacks/shared/weapon_counters.json
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
            document.querySelector('#leaderboardTable tbody').innerHTML =
                '<tr><td colspan="5" style="color: red;">Error loading data.</td></tr>';
        });

    function processWeaponData(weaponData) {
        const weaponMap = new Map(); // { weaponName: { kills, headshots, totalShots } }

        for (const userId in weaponData.weapons) {
            const userWeapons = weaponData.weapons[userId];

            for (const weaponName in userWeapons) {
                const stats = userWeapons[weaponName].stats;

                if (!weaponMap.has(weaponName)) {
                    weaponMap.set(weaponName, {
                        kills: 0,
                        headshots: 0,
                        totalShots: 0,
                        timesLost: 0
                    });
                }

                const weaponEntry = weaponMap.get(weaponName);
                weaponEntry.kills += stats.kills;
                weaponEntry.headshots += stats.headshots;
                weaponEntry.totalShots += stats.totalShots;
                weaponEntry.timesLost += stats.timesLost;
            }
        }

        // Map to string
        const allWeapons = Array.from(weaponMap.entries()).map(([name, stats]) => ({
            name,
            kills: stats.kills,
            headshots: stats.headshots,
            totalShots: stats.totalShots,
            timesLost: stats.timesLost
        }));

        allWeapons.forEach(weapon => {
            weapon.killsPercent = weapon.totalShots > 0
                ? ((weapon.kills / weapon.totalShots) * 100).toFixed(2)
                : 0;

            weapon.headshotsPercent = weapon.totalShots > 0
                ? ((weapon.headshots / weapon.kills) * 100).toFixed(2)
                : 0;

            weapon.avgShots = weapon.kills > 0
                ? (weapon.totalShots / weapon.kills).toFixed(2)
                : 0;
        });

        // Sort by kills
        allWeapons.sort((a, b) => b.kills - a.kills);

        // Now fill
        const tableBody = document.querySelector('#leaderboardTable tbody');
        tableBody.innerHTML = '';

        allWeapons.forEach((weapon, index) => {
            const row = document.createElement('tr');

            row.innerHTML = `
            <td>${index + 1}</td>
            <td>${weapon.name}</td>
            <td>${weapon.kills}</td>
            <td>${weapon.killsPercent}%</td>
            <td>${weapon.headshots}</td>
            <td>${weapon.headshotsPercent}%</td>
            <td>${weapon.avgShots}</td>
            <td>${weapon.totalShots}</td>
        `;

            tableBody.appendChild(row);
        });
    }
});