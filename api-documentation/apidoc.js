document.addEventListener('DOMContentLoaded', function () {
    const commandItems = document.querySelectorAll('.command-item');
    const apiDocs = document.querySelectorAll('.api-doc');
    const searchInput = document.getElementById('searchInput');

    // Hide all API docs initially except the first one
    for (let i = 1; i < apiDocs.length; i++) {
        apiDocs[i].style.display = 'none';
    }

    // Add click event to command items
    commandItems.forEach(item => {
        item.addEventListener('click', function () {
            const command = this.getAttribute('data-command');

            // Update active state
            commandItems.forEach(cmd => cmd.classList.remove('active'));
            this.classList.add('active');

            // Show corresponding API doc
            apiDocs.forEach(doc => {
                if (doc.id === command) {
                    doc.style.display = 'block';
                } else {
                    doc.style.display = 'none';
                }
            });
        });
    });

    // Search func
    searchInput.addEventListener('input', function () {
        const searchTerm = this.value.toLowerCase();

        commandItems.forEach(item => {
            const text = item.textContent.toLowerCase();
            if (text.includes(searchTerm)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    });
});