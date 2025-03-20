// DOM
const uploadButton = document.getElementById('uploadButton');
const fileInput = document.getElementById('fileInput');
const progressBar = document.querySelector('.progress');
const statusText = document.getElementById('status');


// Функция для поиска значения по ключу в массиве Items
function findValueByKey(items, key) {
    const item = items.find((item) => {
        return (
            item.Key.length === key.length &&
            item.Key.every((k, index) => k === key[index])
        );
    });
    return item ? item.Value : null;
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60); // Получаем минуты
    const remainingSeconds = seconds % 60; // Получаем оставшиеся секунды

    // Форматируем минуты и секунды с ведущим нулём, если нужно
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`; // Возвращаем время в формате MM:SS
}

// Открываем диалог выбора файла при нажатии на кнопку
uploadButton.addEventListener('click', () => {
    fileInput.click(); // Программно кликаем на input type="file"
});

// Обработка выбора файла
fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/json') {
        progressBar.style.width = '0%';
        statusText.textContent = 'Загрузка файла...';

        // For reading
        const reader = new FileReader();

        reader.onprogress = (e) => {
            if (e.lengthComputable) {
                const percentLoaded = (e.loaded / e.total) * 100;
                progressBar.style.width = `${percentLoaded}%`;
            }
        };

        reader.onload = (e) => {
            const profile = JSON.parse(e.target.result);

            // Извлекаем нужные данные из профиля
            const kills = findValueByKey(profile.characters.pmc.Stats.Eft.OverallCounters.Items, ['Kills']);
            const deaths = findValueByKey(profile.characters.pmc.Stats.Eft.OverallCounters.Items, ['Deaths']);
            const totalRaids = findValueByKey(profile.characters.pmc.Stats.Eft.OverallCounters.Items, ['Sessions', 'Pmc']);

            // Рассчитываем Survive Rate
            let surviveRate = 0;
            if (totalRaids > 0) {
                surviveRate = ((totalRaids - deaths) / totalRaids) * 100;
                surviveRate = surviveRate.toFixed(2);
            }
            // K/D Ratio
            const killToDeathRatio = deaths !== 0 ? (kills / deaths).toFixed(2) : kills.toFixed(2); // Если deaths = 0, возвращаем kills

            const averageLifeTimeSeconds = findValueByKey(profile.characters.pmc.Stats.Eft.OverallCounters.Items, ['LifeTime', 'Pmc']);

            // Преобразуем секунды в формат MM:SS
            const averageLifeTimeFormatted = formatTime(averageLifeTimeSeconds);

            // Extracting data from JSON profile
            const requiredData = {
                name: profile.characters.pmc.Info.Nickname,
                lastPlayed: profile.characters.pmc.Stats.Eft.LastSessionDate,
                pmcLevel: profile.characters.pmc.Info.Level,
                totalRaids: totalRaids,
                survivedToDiedRatio: surviveRate,
                killToDeathRatio: killToDeathRatio,
                averageLifeTime: averageLifeTimeFormatted,
                accountType: profile.characters.pmc.Info.GameVersion,
                isUsingTwitchPlayers: profile.spt.mods.name,
                sptVer: profile.spt.version,
            };

            // Loading data.json
            fetch('js/data.json')
                .then((response) => response.json())
                .then((data) => {
                    // Adding new data (from SPT profile) to leaderboard
                    data.leaderboard.push(requiredData);

                    // Save data.json
                    return fetch('data.json', {
                        method: 'PUT', // 'POST'
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(data),
                    });
                })
                .then(() => {
                    statusText.textContent = 'Профиль успешно загружен и данные обновлены!';
                    progressBar.style.width = '100%';
                })
                .catch((error) => {
                    console.error('Ошибка:', error);
                    statusText.textContent = 'Произошла ошибка при загрузке или обновлении данных.';
                    progressBar.style.backgroundColor = '#ff0000';
                });
        };

        reader.onerror = () => {
            statusText.textContent = 'Ошибка при чтении файла.';
            progressBar.style.backgroundColor = '#ff0000';
        };

        reader.readAsText(file);
    } else {
        alert('Пожалуйста, выберите JSON-файл.');
    }
});