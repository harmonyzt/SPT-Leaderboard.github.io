<?php
// Note - this isn't a complete working PHP file ready to be deployed.
// All of the updating code was given along with other stuff - you're free to implement your own system on how to store tokens and ids, or just completely get rid of them. 

// Statistics where all players will be written to
$STATS_FILE = __DIR__ . '/season3.json';

// $data - Incoming data.
// Feel free to tinker on how you get the data off SPT mod and process it later on
// Token is forever tied to player ID. and is saved separately.
// $player - Existing (OR NOT) player data

function updatePlayerStats($data, $suspicious, $isBanned)
{
    global $STATS_FILE;
    $stats = file_exists($STATS_FILE) ? json_decode(file_get_contents($STATS_FILE), true) : ['leaderboard' => []];

    $playerFound = false;
    $isScav = $data['isScav'] ?? false;
    $raidKills = $data['raidKills'] ?? 0;


    foreach ($stats['leaderboard'] as &$player) {
        if ($player['id'] === $data['id']) {
            $playerFound = true;

            $survived = ($data['raidResult'] === 'Survived' || $data['raidResult'] === 'Transit') ? 1 : 0;
            $died = ($data['raidResult'] === 'Killed') ? 1 : 0;

            $player['totalRaids'] += 1;
            $player['damage'] = ($player['damage'] ?? 0) + ($data['raidDamage'] ?? 0);

            // SCAV stats
            if ($isScav && $data['publicProfile']) {
                $player['scavDeaths'] = ($player['scavDeaths'] ?? 0) + $died;
                $player['scavRaids'] = ($player['scavRaids'] ?? 0) + 1;
                $player['scavKills'] = ($player['scavKills'] ?? 0) + $raidKills;
                $player['scavAverageLifeTime'] = calculateNewAverage($player['scavAverageLifeTime'] ?? 0, $player['scavRaids'], $data['raidTime']);
                $player['scavKillToDeathRatio'] = $player['scavDeaths'] > 0 ? round($player['scavKills'] / $player['scavDeaths'], 2) : $player['scavKills'];

                $player['scavSurvived'] = ($player['scavSurvived'] ?? 0) + $survived;

                if ($player['scavRaids'] > 0) {
                    $player['scavSurvivalRate'] = round(($player['scavSurvived'] / $player['scavRaids']) * 100);
                } else {
                    $player['scavSurvivalRate'] = 0; // 0% if no raids
                }

            } else if (!$isScav) {
                // PMC STATS THAT ARE ALWAYS SENT
                $player['survived'] = ($player['survived'] ?? 0) + $survived;
                $player['pmcDeaths'] = ($player['pmcDeaths'] ?? 0) + $died;
                $player['pmcKills'] = ($player['pmcKills'] ?? 0) + $raidKills;
                // Global thingies
                $player['pmcRaids'] = ($player['pmcRaids'] ?? 0) + 1;
                $player['averageLifeTime'] = calculateNewAverage($player['averageLifeTime'] ?? 0, $player['pmcRaids'], $data['raidTime']);

                $deaths = max(1, $player['pmcDeaths']);
                $player['killToDeathRatio'] = round($player['pmcKills'] / $deaths, 2);

                if ($player['pmcRaids'] > 0) {
                    $player['survivalRate'] = round(($player['survived'] / $player['pmcRaids']) * 100);
                } else {
                    $player['survivalRate'] = 0; // 0% if no raids
                }
            }

            $updateFields = [
                'name',
                'lastPlayed',
                'pmcLevel',
                'accountType',
                'sptVer',
                'publicProfile',
                'registrationDate',
            ];

            foreach ($updateFields as $field) {
                if (isset($data[$field])) {
                    $player[$field] = $data[$field];
                }
            }

            // IF PROFILE IS PUBLIC
            if ($data['publicProfile']) {
                $player['profileAboutMe'] = $data['profileAboutMe'] ?? '';
                $player['profilePicture'] = $data['profilePicture'] ?? '';
                $player['profileTheme'] = $data['profileTheme'] ?? '';

                // Last raid stats
                $player['lastRaidEXP'] = $data['lastRaidEXP'];
                $player['isTransition'] = $data['isTransition'];
                $player['lastRaidTransitionTo'] = $data['lastRaidTransitionTo'];
                $player['discFromRaid'] = $data['discFromRaid'];

                $player['lastRaidKills'] = $data['raidKills'];
                $player['lastRaidAs'] = $data['playedAs'];
                $player['lastRaidDamage'] = $data['raidDamage'];
                $player['lastRaidMap'] = $data['lastRaidMap'];
                $player['lastRaidSurvived'] = $survived ? true : false;
                $player['lastRaidTimeSeconds'] = $data['raidTime'];
                $player['lastRaidEXP'] = $data['lastRaidEXP'];
                $player['lastRaidHits'] = $data['lastRaidHits'];
                $player['pmcSide'] = $data['pmcSide'];
                $player['scavLevel'] = $data['scavLevel'];
                $player['prestige'] = $data['prestige'];
                $player['usePrestigeStyling'] = $data['usePrestigeStyling'];
                $player['latestAchievementName'] = $data['latestAchievementName'];
                $player['latestAchievementDescription'] = $data['latestAchievementDescription'];
                $player['latestAchievementImageUrl'] = $data['latestAchievementImageUrl'];
                $player['latestAchievementTimestamp'] = $data['latestAchievementTimestamp'];

                // User profiles
                $player['hasKappa'] = $data['hasKappa'];
                $player['weaponMasteryId'] = $data['weaponMasteryId'];
                $player['weaponMasteryProgress'] = $data['weaponMasteryProgress'];
                $player['isUsingStattrack'] = $data['isUsingStattrack'];
                $player['modWeaponStats'] = $data['modWeaponStats'];
                $player['traderInfo'] = $data['traderInfo'];

                $player['bp_prestigebg'] = $data['bp_prestigebg'];
                $player['bp_cardbg'] = $data['bp_cardbg'];
                $player['bp_mainbg'] = $data['bp_mainbg'];
                $player['bp_cat'] = $data['bp_cat'];
                $player['bp_pfpstyle'] = $data['bp_pfpstyle'];
                $player['bp_pfpbordercolor'] = $data['bp_pfpbordercolor'];
            } else {
                // To prevent any issues with frontend
                $player['profileTheme'] = 'Default';
            }


            // Add playtime to a profile
            $currentTime = (int) ($player['totalPlayTime'] ?? 0);
            $raidTimeToAdd = (int) ($data['raidTime'] ?? 0);
            $player['totalPlayTime'] = $currentTime + $raidTimeToAdd;

            $player['suspicious'] = $suspicious;
            $player['disqualified'] = $isBanned;

            // Developer
            if ($data['token'] === "no") {
                $player['dev'] = true;
            }

            break;
        }
    }

    if (!$playerFound) {
        http_response_code(404);
        die(json_encode(['error' => 'Player not found in stats']));
    }

    file_put_contents($STATS_FILE, json_encode($stats, JSON_PRETTY_PRINT));
    return ['status' => 'updated', 'playerId' => $data['id']];
}

function calculateNewAverage($oldAverage, $totalRaids, $newRaidTime)
{
    if ($totalRaids <= 1)
        return $newRaidTime;
    return round((($oldAverage * ($totalRaids - 1)) + $newRaidTime) / $totalRaids);
}

function addNewPlayer($data, $trusted, $suspicious, $isBanned, $isDev)
{
    global $STATS_FILE;
    $stats = file_exists($STATS_FILE) ? json_decode(file_get_contents($STATS_FILE), true) : ['leaderboard' => []];

    $isScav = $data['isScav'] ?? false;
    $raidKills = $data['raidKills'] ?? 0;
    $survived = ($data['raidResult'] === 'Survived') ? 1 : 0;
    $died = ($data['raidResult'] === 'Killed') ? 1 : 0;

    if (!$isDev && !$trusted) {
        $newPlayer['trusted'] = false;
    } else if ($trusted) {
        $newPlayer['trusted'] = true;
    } else if ($isDev) {
        $newPlayer['dev'] = true;
    }

    $newPlayer = [
        'id' => $data['id'],
        'name' => $data['name'] ?? '',
        'pmcLevel' => $data['pmcLevel'],
        'lastPlayed' => $data['lastPlayed'] ?? '',
        'damage' => $data['raidDamage'] ?? 0,
        'accountType' => $data['accountType'] ?? 'Standard',
        'sptVer' => $data['sptVer'] ?? 'Unknown',
        'disqualified' => $isBanned,
        'publicProfile' => $data['publicProfile'] ?? false,
        'currentWinstreak' => $data['winRaidStreak'] ?? 0,
        'longestShot' => $data['longestShot'] ?? 0,
        'suspicious' => $suspicious
    ];

    // Always update
    $newPlayer['pmcRaids'] = 1;
    $newPlayer['averageLifeTime'] = $data['raidTime'] ?? 0;
    $newPlayer['killToDeathRatio'] = $died > 0 ? round($raidKills / $died, 2) : $raidKills;
    $newPlayer['survivalRate'] = $survived ? 100 : 0;


    // IF PROFILE IS PUBLIC
    if ($data['publicProfile']) {
        $newPlayer['profileAboutMe'] = $data['profileAboutMe'] ?? '';
        $newPlayer['profilePicture'] = $data['profilePicture'] ?? '';
        $newPlayer['registrationDate'] = $data['registrationDate'] ?? '';

        // Last raid stats and ach
        $newPlayer['lastRaidKills'] = $data['raidKills'];
        $newPlayer['lastRaidAs'] = $data['playedAs'];
        $newPlayer['lastRaidDamage'] = $data['raidDamage'];
        $newPlayer['lastRaidEXP'] = $data['lastRaidEXP'];
        $newPlayer['isTransition'] = $data['isTransition'];
        $newPlayer['lastRaidTransitionTo'] = $data['lastRaidTransitionTo'];
        $newPlayer['discFromRaid'] = $data['discFromRaid'];
        $newPlayer['latestAchievementName'] = $data['latestAchievementName'];
        $newPlayer['latestAchievementDescription'] = $data['latestAchievementDescription'];
        $newPlayer['latestAchievementImageUrl'] = $data['latestAchievementImageUrl'];
        $newPlayer['latestAchievementTimestamp'] = $data['latestAchievementTimestamp'];
        $newPlayer['lastRaidEXP'] = $data['lastRaidEXP'];
        $newPlayer['lastRaidHits'] = $data['lastRaidHits'];

        $newPlayer['hasKappa'] = $data['hasKappa'];
        $newPlayer['weaponMasteryId'] = $data['weaponMasteryId'];
        $newPlayer['weaponMasteryProgress'] = $data['weaponMasteryProgress'];
        $newPlayer['isUsingStattrack'] = $data['isUsingStattrack'];
        $newPlayer['modWeaponStats'] = $data['modWeaponStats'];
        $newPlayer['traderInfo'] = $data['traderInfo'];

        $newPlayer['bp_prestigebg'] = $data['bp_prestigebg'];
        $newPlayer['bp_cardbg'] = $data['bp_cardbg'];
        $newPlayer['bp_mainbg'] = $data['bp_mainbg'];
        $newPlayer['bp_cat'] = $data['bp_cat'];
        $newPlayer['bp_pfpstyle'] = $data['bp_pfpstyle'];
        $newPlayer['bp_pfpbordercolor'] = $data['bp_pfpbordercolor'];

        if ($data['lastRaidMap'] === "east") {
            $newPlayer['lastRaidMap'] = "Ground Zero - Low";
        } else if ($data['lastRaidMap'] === "west") {
            $newPlayer['lastRaidMap'] = "Ground Zero - High";
        } else {
            $newPlayer['lastRaidMap'] = $data['lastRaidMap'];
        }

        $newPlayer['lastRaidSurvived'] = $survived ? true : false;
        $newPlayer['lastRaidTimeSeconds'] = $data['raidTime'];
        $newPlayer['pmcSide'] = $data['pmcSide'];
        $newPlayer['scavLevel'] = $data['scavLevel'];
        $newPlayer['prestige'] = $data['prestige'];

        // SCAV stats
        if ($isScav) {
            $newPlayer['scavRaids'] = 1;
            $newPlayer['scavKills'] = $raidKills;
            $newPlayer['scavDeaths'] = $died;
            $newPlayer['scavSurvived'] = $survived;
            $newPlayer['scavAverageLifeTime'] = $data['raidTime'] ?? 0;
            $newPlayer['scavKillToDeathRatio'] = $died > 0 ? round($raidKills / $died, 2) : $raidKills;
            $newPlayer['scavSurvivalRate'] = $survived ? 100 : 0;

            // Initialize PMC stats to 0
            $newPlayer['pmcRaids'] = 0;
            $newPlayer['pmcKills'] = 0;
            $newPlayer['pmcDeaths'] = 0;
            $newPlayer['pmcSurvived'] = 0;
            $newPlayer['averageLifeTime'] = 0;
            $newPlayer['killToDeathRatio'] = 0;
            $newPlayer['survivalRate'] = 0;

            // Send this anyways - it won't be updated anyways
        } else {
            // PMC Public stats
            $newPlayer['pmcRaids'] = 1;
            $newPlayer['pmcKills'] = $raidKills;
            $newPlayer['pmcDeaths'] = $died;
            $newPlayer['survived'] = $survived;
            $newPlayer['averageLifeTime'] = $data['raidTime'] ?? 0;
            $newPlayer['killToDeathRatio'] = $died > 0 ? round($raidKills / $died, 2) : $raidKills;
            $newPlayer['survivalRate'] = $survived ? 100 : 0;

            // Initialize SCAV stats to 0
            $newPlayer['scavRaids'] = 0;
            $newPlayer['scavKills'] = 0;
            $newPlayer['scavDeaths'] = 0;
            $newPlayer['scavSurvived'] = 0;
            $newPlayer['scavAverageLifeTime'] = 0;
            $newPlayer['scavKillToDeathRatio'] = 0;
            $newPlayer['scavSurvivalRate'] = 0;
        }
    }

    $stats['leaderboard'][] = $newPlayer;
    file_put_contents($STATS_FILE, json_encode($stats, JSON_PRETTY_PRINT));

    return ['status' => 'created', 'playerId' => $data['id']];
}
