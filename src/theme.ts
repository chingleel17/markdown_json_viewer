// Theme switcher implementation
const themeSwitcher = document.getElementById('theme-switcher');
const html = document.documentElement;

const currentTheme = localStorage.getItem('theme') || 'light';
html.setAttribute('data-theme', currentTheme);
updateThemeIcon(currentTheme);

themeSwitcher?.addEventListener('click', () => {
  const currentTheme = html.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeIcon(newTheme);
});

function updateThemeIcon(theme: string): void {
  const icon = themeSwitcher?.querySelector('i');
  if (!icon) return;
  
  if (theme === 'dark') {
    icon.classList.remove('bi-sun-fill');
    icon.classList.add('bi-moon-fill');
  } else {
    icon.classList.remove('bi-moon-fill');
    icon.classList.add('bi-sun-fill');
  }
}

export {};
