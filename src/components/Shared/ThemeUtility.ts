const ThemeUtility = {
    getTheme: () => {
        const theme = localStorage.getItem('theme');
        if (theme) {
            return theme;
        } else {
            // Default to light theme
            return 'light';
        }
    },
    setTheme: (theme: string) => {
        localStorage.setItem('theme', theme);
        document.documentElement.className = theme;
    },
    toggleTheme: () => {
        const currentTheme = ThemeUtility.getTheme();
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        ThemeUtility.setTheme(newTheme);
    }
}

export default ThemeUtility;

