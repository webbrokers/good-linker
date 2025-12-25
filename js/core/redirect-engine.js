/**
 * Redirect Engine - обработка редиректов
 */

import storage from './storage.js';
import { addUtmToUrl } from '../utils/utm-builder.js';

export class RedirectEngine {
    /**
     * Обрабатывает редирект для указанного кода
     */
    async handleRedirect(code, abTestEngine = null) {
        // Получаем ссылку
        const link = await storage.getLink(code);
        
        if (!link) {
            throw new Error('Ссылка не найдена');
        }

        // Проверяем активность
        if (!link.isActive) {
            throw new Error('Ссылка неактивна');
        }

        // Определяем финальный URL
        let finalUrl = link.originalUrl;

        // Если есть A/B тесты, выбираем вариант
        if (link.abTests && link.abTests.length > 0 && abTestEngine) {
            const selectedVariant = abTestEngine.selectVariant(link.abTests);
            if (selectedVariant) {
                finalUrl = selectedVariant.url;
            }
        }

        // Добавляем UTM метки
        if (link.utmParams) {
            finalUrl = addUtmToUrl(finalUrl, link.utmParams);
        }

        return finalUrl;
    }

    /**
     * Получает данные о ссылке для редиректа (без редиректа)
     */
    async getRedirectData(code) {
        const link = await storage.getLink(code);
        return link;
    }
}

// Экспортируем singleton instance
const redirectEngine = new RedirectEngine();
export default redirectEngine;

