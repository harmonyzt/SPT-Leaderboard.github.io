<div align="center">
  <img src="https://elite.nullcore.net/i/fa24992a.png" alt="SPT Leaderboard Logo" width="150" />
</div>

<h1 align="center">SPT Leaderboard</h1>

<p align="center">
  Dynamic leaderboard for <strong>SPT (Single Player Tarkov)</strong> player statistics, displaying player rankings, skill score, profiles and more.
</p>

---

## Contribution
Pull requests and issue reports are welcome!
Submit them here on GitHub or contact through other channels.

---

## Installation & Hosting (Private Setup)
Don't like how the leaderboard is open for everyone else and want to set it up just for your friends? Now you can do that!

### Requirements
- **SPT 3.11.3** (or latest compatible version)
- Basic knowledge of **JS/PHP**
- Server with **PHP/JSON** support

### First Step
1. Download the latest SPT Mod release (NOT HERE YET)
2. Drop the zip contents in your SPT root game folder (`/SPT_GAME/`)

Navigate to the mod config:
`mods/SPT-Leaderboard/config/config.js`

Open `config.js` and edit the following values:

`PHP_ENDPOINT: "your.domain.com", // Your server domain`

`PHP_PATH: "/backend/SPT_Profiles_Backend.php" // Relative PHP path`

Change them accordingly where your PHP files will be hosted.

### Second Step
Download the leaderboard frontend: https://github.com/harmonyzt/TPLeaderboard.github.io/archive/refs/heads/main.zip

Extract the contents to your web server's root or subdirectory.
Navigate to the BACKEND folder and configure which JSON file stores stats
(Recommended to use `season` in both scenarios. The season system on frontend adds the number automatically.)

Go to the js folder and open main.js. At the top:

`const seasonPath = "https://your.domain.com/backend/season";`

`const seasonPathEnd = ".json";`

Update the URL (seasonPath) to match your own hosted path.

⚠️ AGAIN - Do not include a season number - the system adds that automatically when reading through files (FRONTEND).
