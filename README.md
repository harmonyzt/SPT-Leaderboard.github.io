<div align="center">
  <img src="https://elite.nullcore.net/i/fa24992a.png" alt="SPT Leaderboard Logo" width="150" />
</div>

<h1 align="center">SPT Leaderboard</h1>

<p align="center">
  Dynamic leaderboard for <strong>SPT (Single Player Tarkov)</strong> player statistics, displaying player rankings, skill score, profiles and more.
</p>

---
## How does it work?

To minimize costs, we use a static website (GitHub Pages) that pulls dynamic data in JSON format made by proxy API hosted on our server.
SPtarkov mod sends a request to the API, and it turns your request into JSON - exactly what this system was designed to deliver. Straightforward.

---

## Contribution
Pull requests and issue reports are welcome!
Submit them here on GitHub or contact through other channels.

---

## Installation & Hosting (Private Setup)
Don't like how the leaderboard is open for everyone else and want to set it up just for your friends? Now you can do that!

### Requirements
- **SPT 3.11.3** (or latest compatible version)
- Interdemate knowledge of **PHP**, basic knowledge of **JavaScript**
- Server with **PHP/JSON** support

### First Step
1. [Download the latest SPT Mod release](https://github.com/harmonyzt/SPT-Leaderboard/releases)
2. Drop the zip contents in your SPT root game folder (Extract at `/SPT_GAME/`)
3. Navigate to the mod config:
`mods/SPT-Leaderboard/config/config.js`

4. Open `config.js` and edit the following values:

`PHP_ENDPOINT: "your.domain.com", // Your server domain`

`PHP_PATH: "/backend/SPT_Profiles_Backend.php" // Relative PHP path`

Change them accordingly where your PHP files will be hosted.

### Second Step
1. [Download Dynamic Leaderboard Website](https://github.com/harmonyzt/TPLeaderboard.github.io/archive/refs/heads/main.zip)
2. Extract the contents to your web server's root or subdirectory. 
3. Navigate to the BACKEND folder and configure which JSON file stores stats (Recommended to use `season` in both scenarios. The season system on frontend adds the number automatically.)
4. Go to the `js` folder and open `appCore.js`. At the top you'll see all the paths the mod uses to fetch data. Put your paths that correspond your server.
5. Update the URL (seasonPath) to match your own hosted path.

⚠️ AGAIN - Do not include a season number - the system adds that automatically when reading through files (FRONT-END).

⚠️ Note that there's no ready back-end to proccess the data - only its barebones. But website comes with latest accessible file of demo backend (BACKEND folder)

### You're good to go!
Now you can play and rank up just like in present leaderboard with all of its features!
