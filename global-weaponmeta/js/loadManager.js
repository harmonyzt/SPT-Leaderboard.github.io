class LoaderManager {
    constructor() {
        this.loaderElement = document.querySelector('.loader-grid-item');
        this.loaderText = document.querySelector('.loader-text');
        this.loaderDetails = document.querySelector('.loader-details');
        this.progressBar = document.querySelector('.progress-bar');
        this.totalImages = 0;
        this.loadedImages = 0;
    }

    show() {
        this.loaderElement.style.display = 'flex';
    }

    hide() {
        this.loaderElement.style.display = 'none';
    }

    updateProgress(loaded, total, message = '') {
        this.loadedImages = loaded;
        this.totalImages = total;
        const percent = Math.round((loaded / total) * 100);
        
        this.progressBar.style.width = `${percent}%`;
        this.loaderText.textContent = `Loading data... ${loaded}/${total}`;
        
        if (message) {
            this.loaderDetails.textContent = message;
        }
    }

    setMessage(message) {
        this.loaderDetails.textContent = message;
    }
}

const loader = new LoaderManager();