document.addEventListener('DOMContentLoaded', () => {
    const mainTabs = document.getElementById('myTab');
    const defaultTabId = '#rag-viewer-pane';

    // Function to show a tab based on a hash
    const showTabFromHash = () => {
        let hash = window.location.hash;
        // If the hash is invalid or empty, use the default
        if (!hash || !document.querySelector(`[data-bs-target="${hash}"]`)) {
            hash = defaultTabId;
        }

        const tabTrigger = document.querySelector(`[data-bs-target="${hash}"]`);
        if (tabTrigger) {
            const tab = new bootstrap.Tab(tabTrigger);
            tab.show();
        }
    };

    // When a new tab is shown, update the URL hash
    mainTabs.addEventListener('show.bs.tab', event => {
        const newHash = event.target.dataset.bsTarget;
        // Use pushState to allow back/forward navigation
        if (window.location.hash !== newHash) {
             history.pushState(null, null, newHash);
        }
    });

    // When the user navigates with back/forward buttons, show the correct tab
    window.addEventListener('popstate', () => {
        showTabFromHash();
    });

    // Show the correct tab on initial page load
    showTabFromHash();
});