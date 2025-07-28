//     _____ ____  ______   __    _________    ____  __________  ____  ____  ___    ____  ____ 
//    / ___// __ \/_  __/  / /   / ____/   |  / __ \/ ____/ __ \/ __ )/ __ \/   |  / __ \/ __ \
//    \__ \/ /_/ / / /    / /   / __/ / /| | / / / / __/ / /_/ / __  / / / / /| | / /_/ / / / /  
//   ___/ / ____/ / /    / /___/ /___/ ___ |/ /_/ / /___/ _, _/ /_/ / /_/ / ___ |/ _, _/ /_/ / 
//  /____/_/     /_/    /_____/_____/_/  |_/_____/_____/_/ |_/_____/\____/_/  |_/_/ |_/_____/  

/**
 * Show toast notification
 * @param {string} message - Text
 * @param {string} type - Type of toast ('success', 'error', 'warning', 'info')
 * @param {number} duration - Duration to show (0 for manual close)
 */
function showToast(message, type = 'info', duration = 3000) {
    // Create container for toasts
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    // Create
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const textSpan = document.createElement('span');
    textSpan.textContent = message;

    const closeSpan = document.createElement('span');
    closeSpan.className = 'toast-close';
    closeSpan.innerHTML = '&times;';
    closeSpan.onclick = () => dismissToast(toast);

    toast.appendChild(textSpan);
    toast.appendChild(closeSpan);
    container.appendChild(toast);

    // Start animation
    setTimeout(() => {
        toast.style.opacity = '1';
    }, 10);

    // Close if duration > 0
    if (duration > 0) {
        setTimeout(() => {
            dismissToast(toast);
        }, duration);
    }

    return toast;
}

/**
 * Delete toast
 * @param {HTMLElement} toast - Element (no way)
 */
function dismissToast(toast) {
    if (!toast) return;

    toast.style.animation = 'toastSlideOut 0.3s ease-out forwards';
    setTimeout(() => {
        toast.remove();

        // Delete container if empty
        const container = document.querySelector('.toast-container');
        if (container && container.children.length === 0) {
            container.remove();
        }
    }, 300);
}