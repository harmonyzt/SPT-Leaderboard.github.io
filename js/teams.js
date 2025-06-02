
let teamData = [];
const teamsPath = "https://visuals.nullcore.net/hidden/teams/player_teams3.json"

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