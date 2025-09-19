//     _____ ____  ______   __    _________    ____  __________  ____  ____  ___    ____  ____ 
//    / ___// __ \/_  __/  / /   / ____/   |  / __ \/ ____/ __ \/ __ )/ __ \/   |  / __ \/ __ \
//    \__ \/ /_/ / / /    / /   / __/ / /| | / / / / __/ / /_/ / __  / / / / /| | / /_/ / / / /  
//   ___/ / ____/ / /    / /___/ /___/ ___ |/ /_/ / /___/ _, _/ /_/ / /_/ / ___ |/ _, _/ /_/ / 
//  /____/_/     /_/    /_____/_____/_/  |_/_____/_____/_/ |_/_____/\____/_/  |_/_/ |_/_____/  

let currentTeamData = [];

async function loadTeamsData() {
    try {
        const response = await fetch(teamsPath);

        if (!response.ok) {
            throw new Error('Failed to load team data');
        }

        const data = await response.json();
        teamData = data.teams || {};

        // Check if team data is empty
        if (Object.keys(teamData).length === 0) {
            return;
        } else {
            //processTeamData(teamData); 
        }
    } catch (error) {
        console.error('Error loading team data:', error);
    }
}

function openTeam(tag) {
    console.log('Team tag clicked:', tag);
    if (teamData[tag]) {
        console.log('Team members:', teamData[tag]);
    } else {
        console.log('Team not found');
    }
}