/**
 * Storage Adapter - абстракция для хранения данных
 * В MVP использует localStorage, готов к миграции на Supabase
 */

class StorageAdapter {
    constructor() {
        this.linksKey = 'good-linker-links';
        this.settingsKey = 'good-linker-settings';
    }

    // Links methods
    async getAllLinks() {
        try {
            const data = localStorage.getItem(this.linksKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error getting links:', error);
            return [];
        }
    }

    async getLink(code) {
        const links = await this.getAllLinks();
        return links.find(link => link.shortCode === code);
    }

    async getLinkById(id) {
        const links = await this.getAllLinks();
        return links.find(link => link.id === id);
    }

    async saveLink(link) {
        const links = await this.getAllLinks();
        const existingIndex = links.findIndex(l => l.id === link.id);
        
        if (existingIndex >= 0) {
            links[existingIndex] = link;
        } else {
            links.push(link);
        }
        
        localStorage.setItem(this.linksKey, JSON.stringify(links));
        return link;
    }

    async deleteLink(id) {
        const links = await this.getAllLinks();
        const filtered = links.filter(l => l.id !== id);
        localStorage.setItem(this.linksKey, JSON.stringify(filtered));
        return true;
    }

    async updateLinkStats(code, clickData) {
        const link = await this.getLink(code);
        if (!link) return null;

        link.stats = link.stats || {
            totalClicks: 0,
            clicks24h: 0,
            clicksHistory: [],
            clickTimestamps: []
        };

        link.stats.totalClicks = (link.stats.totalClicks || 0) + 1;
        link.stats.clickTimestamps = link.stats.clickTimestamps || [];
        link.stats.clickTimestamps.push({
            timestamp: new Date().toISOString(),
            ...clickData
        });

        // Обновляем историю по дням
        const today = new Date().toISOString().split('T')[0];
        const historyIndex = link.stats.clicksHistory.findIndex(h => h.date === today);
        if (historyIndex >= 0) {
            link.stats.clicksHistory[historyIndex].count++;
        } else {
            link.stats.clicksHistory.push({ date: today, count: 1 });
        }

        // Подсчитываем клики за последние 24 часа
        const now = new Date();
        const last24h = link.stats.clickTimestamps.filter(ts => {
            const clickTime = new Date(ts.timestamp);
            return (now - clickTime) < 24 * 60 * 60 * 1000;
        });
        link.stats.clicks24h = last24h.length;

        // Очищаем старые данные (старше 90 дней)
        const daysToKeep = 90;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        link.stats.clickTimestamps = link.stats.clickTimestamps.filter(ts => 
            new Date(ts.timestamp) >= cutoffDate
        );

        await this.saveLink(link);
        return link;
    }

    // Settings methods
    async getSettings() {
        try {
            const data = localStorage.getItem(this.settingsKey);
            return data ? JSON.parse(data) : {
                defaultDomain: window.location.hostname,
                customDomains: []
            };
        } catch (error) {
            console.error('Error getting settings:', error);
            return {
                defaultDomain: window.location.hostname,
                customDomains: []
            };
        }
    }

    async saveSettings(settings) {
        localStorage.setItem(this.settingsKey, JSON.stringify(settings));
        return settings;
    }

    async addCustomDomain(domain) {
        const settings = await this.getSettings();
        if (!settings.customDomains.includes(domain)) {
            settings.customDomains.push(domain);
            await this.saveSettings(settings);
        }
        return settings;
    }

    async removeCustomDomain(domain) {
        const settings = await this.getSettings();
        settings.customDomains = settings.customDomains.filter(d => d !== domain);
        await this.saveSettings(settings);
        return settings;
    }

    // Utility methods
    async clearAll() {
        localStorage.removeItem(this.linksKey);
        localStorage.removeItem(this.settingsKey);
    }

    async exportData() {
        const links = await this.getAllLinks();
        const settings = await this.getSettings();
        return JSON.stringify({ links, settings }, null, 2);
    }

    async importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            if (data.links) {
                localStorage.setItem(this.linksKey, JSON.stringify(data.links));
            }
            if (data.settings) {
                localStorage.setItem(this.settingsKey, JSON.stringify(data.settings));
            }
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            throw error;
        }
    }
}

// Экспортируем singleton instance
const storage = new StorageAdapter();
export default storage;

