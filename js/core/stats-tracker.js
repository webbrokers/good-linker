/**
 * Stats Tracker - сбор и анализ статистики
 */

import storage from './storage.js';

export class StatsTracker {
    /**
     * Регистрирует клик по ссылке
     */
    async trackClick(code, additionalData = {}) {
        const clickData = {
            ...additionalData,
            userAgent: navigator.userAgent,
            referrer: document.referrer || null,
            timestamp: new Date().toISOString()
        };

        return await storage.updateLinkStats(code, clickData);
    }

    /**
     * Получает статистику ссылки
     */
    async getLinkStats(code) {
        const link = await storage.getLink(code);
        if (!link) return null;

        return link.stats || {
            totalClicks: 0,
            clicks24h: 0,
            clicksHistory: [],
            clickTimestamps: []
        };
    }

    /**
     * Подсчитывает клики за последние 24 часа
     */
    calculateClicks24h(clickTimestamps) {
        if (!clickTimestamps || clickTimestamps.length === 0) return 0;

        const now = new Date();
        const last24h = clickTimestamps.filter(ts => {
            const clickTime = new Date(ts.timestamp);
            return (now - clickTime) < 24 * 60 * 60 * 1000;
        });

        return last24h.length;
    }

    /**
     * Форматирует историю кликов для графика (последние 30 дней)
     */
    formatHistoryForChart(clicksHistory, days = 30) {
        const today = new Date();
        const result = [];

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            const historyEntry = clicksHistory.find(h => h.date === dateStr);
            result.push({
                date: dateStr,
                count: historyEntry ? historyEntry.count : 0
            });
        }

        return result;
    }
}

// Экспортируем singleton instance
const statsTracker = new StatsTracker();
export default statsTracker;

