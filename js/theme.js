const themeSwitcher = {
    // Function to set a given theme/scheme
    setTheme: (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        const switcherIcon = document.querySelector('#theme-switcher i');
        if (theme === 'dark') {
            switcherIcon.classList.remove('bi-sun-fill');
            switcherIcon.classList.add('bi-moon-stars-fill');
        } else {
            switcherIcon.classList.remove('bi-moon-stars-fill');
            switcherIcon.classList.add('bi-sun-fill');
        }
    },

    // Function to toggle between light and dark theme
    toggleTheme: () => {
        const currentTheme = localStorage.getItem('theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        themeSwitcher.setTheme(newTheme);
    },

    // Function to get the preferred theme
    getPreferredTheme: () => {
        const storedTheme = localStorage.getItem('theme');
        if (storedTheme) {
            return storedTheme;
        }
        // Check OS preference
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    },

    // Initialize the theme
    init: () => {
        const preferredTheme = themeSwitcher.getPreferredTheme();
        themeSwitcher.setTheme(preferredTheme);

        const switcherButton = document.getElementById('theme-switcher');
        switcherButton.addEventListener('click', themeSwitcher.toggleTheme);
    }
};

// Initialize theme switcher on DOM content loaded
document.addEventListener('DOMContentLoaded', themeSwitcher.init);
