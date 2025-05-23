//   _____ ____  ______   __    _________    ____  __________  ____  ____  ___    ____  ____ 
//  / ___// __ \/_  __/  / /   / ____/   |  / __ \/ ____/ __ \/ __ )/ __ \/   |  / __ \/ __ \
//  \__ \/ /_/ / / /    / /   / __/ / /| | / / / / __/ / /_/ / __  / / / / /| | / /_/ / / / /  
// ___/ / ____/ / /    / /___/ /___/ ___ |/ /_/ / /___/ _, _/ /_/ / /_/ / ___ |/ _, _/ /_/ / 
///____/_/     /_/    /_____/_____/_/  |_/_____/_____/_/ |_/_____/\____/_/  |_/_/ |_/_____/  

document.addEventListener('DOMContentLoaded', () => {
    const elements = {
        infoModal: document.getElementById('infoModal'),
        infoButton: document.getElementById('infoButton'),
        tosModal: document.getElementById('tosModal'),
        tosButton: document.getElementById('tosButton'),

        settingsModal: document.getElementById('settingsModal'),
        settingsButton: document.getElementById('settingsButton'),

        closeButtons: document.querySelectorAll('.close'),
        modals: document.querySelectorAll('.modal')
    };

    const toggleModal = (modal, show) => {
        if (show) {
            modal.style.display = 'block';
            setTimeout(() => {
                modal.style.opacity = '1';
                modal.style.visibility = 'visible';
            }, 10);
        } else {
            modal.style.opacity = '0';
            modal.style.visibility = 'hidden';
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
    };

    // Event listeners
    elements.infoButton.addEventListener('click', () => toggleModal(elements.infoModal, true));
    elements.tosButton.addEventListener('click', () => toggleModal(elements.tosModal, true));
    elements.settingsButton.addEventListener('click', () => toggleModal(elements.settingsModal, true));

    // Close modal if close button was clicked
    elements.closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            toggleModal(elements.infoModal, false);
            toggleModal(elements.tosModal, false);
            toggleModal(elements.settingsModal, false);
        });
    });

    // Close modal if user clicked outside of it
    window.addEventListener('click', (event) => {
        if (event.target === elements.infoModal) toggleModal(elements.infoModal, false);
        if (event.target === elements.tosModal) toggleModal(elements.tosModal, false);
        if (event.target === elements.settingsModal) toggleModal(elements.settingsModal, false);
    });
});