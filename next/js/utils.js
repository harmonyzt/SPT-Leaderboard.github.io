//     _____ ____  ______   __    _________    ____  __________  ____  ____  ___    ____  ____
//    / ___// __ \/_  __/  / /   / ____/   |  / __ \/ ____/ __ \/ __ )/ __ \/   |  / __ \/ __ \
//    \__ \/ /_/ / / /    / /   / __/ / /| | / / / / __/ / /_/ / __  / / / / /| | / /_/ / / / /
//   ___/ / ____/ / /    / /___/ /___/ ___ |/ /_/ / /___/ _, _/ /_/ / /_/ / ___ |/ _, _/ /_/ /
//  /____/_/     /_/    /_____/_____/_/  |_/_____/_____/_/ |_/_____/\____/_/  |_/_/ |_/_____/

function getPrettyMapName(entry) {
    const mapAliases = {
        "bigmap": "Customs",
        "factory4_day": "Factory",
        "factory4_night": "Night Factory",
        "interchange": "Interchange",
        "laboratory": "Labs",
        "RezervBase": "Reserve",
        "shoreline": "Shoreline",
        "woods": "Woods",
        "lighthouse": "Lighthouse",
        "TarkovStreets": "Streets of Tarkov",
        "Sandbox": "Ground Zero - Low",
        "Sandbox_high": "Ground Zero - High"
    };

    entry.toLowerCase();

    return mapAliases[entry] || entry; // returning raw if not found
}