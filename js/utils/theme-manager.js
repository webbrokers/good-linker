/**
 * Theme Manager - управление темами приложения
 */

const THEME_KEY = 'good-linker-theme';
const DEFAULT_THEME = 'light';

class ThemeManager {
    constructor() {
        this.currentTheme = this.loadTheme();
        this.applyTheme(this.currentTheme);
    }

    /**
     * Загружает сохраненную тему из localStorage
     */
    loadTheme() {
        try {
            const saved = localStorage.getItem(THEME_KEY);
            return saved || DEFAULT_THEME;
        } catch (error) {
            console.error('Error loading theme:', error);
            return DEFAULT_THEME;
        }
    }

    /**
     * Сохраняет тему в localStorage
     */
    saveTheme(theme) {
        try {
            localStorage.setItem(THEME_KEY, theme);
        } catch (error) {
            console.error('Error saving theme:', error);
        }
    }

    /**
     * Применяет тему к документу
     */
    applyTheme(theme) {
        const html = document.documentElement;
        if (theme === 'dark') {
            html.classList.add('dark');
            html.setAttribute('data-theme', 'dark');
        } else {
            html.classList.remove('dark');
            html.removeAttribute('data-theme');
        }
        this.currentTheme = theme;
        this.saveTheme(theme);
    }

    /**
     * Переключает тему
     */
    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
        return newTheme;
    }

    /**
     * Получает текущую тему
     */
    getTheme() {
        return this.currentTheme;
    }

    /**
     * Устанавливает тему явно
     */
    setTheme(theme) {
        if (theme === 'light' || theme === 'dark') {
            this.applyTheme(theme);
        }
    }
}

// Экспортируем singleton instance
const themeManager = new ThemeManager();
export default themeManager;

