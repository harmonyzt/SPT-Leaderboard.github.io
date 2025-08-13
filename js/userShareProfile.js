//     _____ ____  ______   __    _________    ____  __________  ____  ____  ___    ____  ____ 
//    / ___// __ \/_  __/  / /   / ____/   |  / __ \/ ____/ __ \/ __ )/ __ \/   |  / __ \/ __ \
//    \__ \/ /_/ / / /    / /   / __/ / /| | / / / / __/ / /_/ / __  / / / / /| | / /_/ / / / /  
//   ___/ / ____/ / /    / /___/ /___/ ___ |/ /_/ / /___/ _, _/ /_/ / /_/ / ___ |/ _, _/ /_/ / 
//  /____/_/     /_/    /_____/_____/_/  |_/_____/_____/_/ |_/_____/\____/_/  |_/_/ |_/_____/  

function copyProfile(playerId) {
    const profileUrl = `${profileUrlPath}${encodeURIComponent(playerId)}`;

    navigator.clipboard.writeText(profileUrl)
        .then(() => {
            showToast('Profile link copied. Now you can share it with someone!', 'success');
        })
        .catch(err => {
            showToast('Failed to copy profile link.', 'error');

            // Try alternative way of copying
            const textArea = document.createElement('textarea');
            textArea.value = profileUrl;
            document.body.appendChild(textArea);
            textArea.select();

            try {
                document.execCommand('copy');
                showToast('Profile link copied. Now you can share it with someone!', 'success');
            } catch (err) {
                showToast('Failed to copy profile link.', 'error');
            }

            document.body.removeChild(textArea);
        });
}

// Upon page loading check URL for profile link hash
window.addEventListener('DOMContentLoaded', () => {
    checkUrlHash();
});

window.addEventListener('hashchange', () => {
    checkUrlHash();
});

function checkUrlHash() {
    const hash = window.location.hash;
    const match = hash.match(/id=([^&]+)/);

    if (match && match[1]) {
        const playerId = match[1];

        // If season data is ready just open profile
        if (isDataReady) {
            openProfile(playerId);
        } else {
            // Waiting for data to be ready to open profile
            waitForDataReady(() => openProfile(playerId));
        }
    }
}

function waitForDataReady(callback, timeout = 10000) {
    const startTime = Date.now();
    const checkInterval = 300;

    const intervalId = setInterval(() => {
        if (isDataReady) {
            clearInterval(intervalId);
            callback();
        }

        else if (Date.now() - startTime > timeout) {
            clearInterval(intervalId);
            showToast(`Couldn't get profile data.`, 'error');
        }
    }, checkInterval);
}