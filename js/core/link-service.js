/**
 * Link Service - создание, редактирование и управление ссылками
 */

import storage from './storage.js';
import { validateAndNormalizeUrl } from '../utils/url-validator.js';
import { generateUniqueCode, validateCustomCode } from '../utils/code-generator.js';

export class LinkService {
    /**
     * Создает новую сокращенную ссылку
     */
    async createLink(data) {
        const { originalUrl, customCode, utmParams, abTests } = data;

        // Валидация URL
        const urlValidation = validateAndNormalizeUrl(originalUrl);
        if (!urlValidation.valid) {
            throw new Error(urlValidation.error);
        }

        const normalizedUrl = urlValidation.url;

        // Получаем все существующие ссылки
        const existingLinks = await storage.getAllLinks();

        // Генерируем или валидируем код
        let shortCode;
        if (customCode) {
            const codeValidation = validateCustomCode(customCode);
            if (!codeValidation.valid) {
                throw new Error(codeValidation.error);
            }
            
            // Проверяем уникальность
            if (await this.codeExists(customCode, existingLinks)) {
                throw new Error('Этот код уже используется');
            }
            
            shortCode = customCode;
        } else {
            shortCode = await generateUniqueCode(existingLinks);
        }

        // Создаем объект ссылки
        const link = {
            id: this.generateId(),
            shortCode,
            originalUrl: normalizedUrl,
            createdAt: new Date().toISOString(),
            isActive: true,
            customDomain: null,
            utmParams: utmParams || null,
            abTests: abTests || null,
            stats: {
                totalClicks: 0,
                clicks24h: 0,
                clicksHistory: [],
                clickTimestamps: []
            }
        };

        await storage.saveLink(link);
        return link;
    }

    /**
     * Обновляет существующую ссылку
     */
    async updateLink(id, updates) {
        const link = await storage.getLinkById(id);
        if (!link) {
            throw new Error('Ссылка не найдена');
        }

        // Обновляем URL если указан
        if (updates.originalUrl) {
            const urlValidation = validateAndNormalizeUrl(updates.originalUrl);
            if (!urlValidation.valid) {
                throw new Error(urlValidation.error);
            }
            link.originalUrl = urlValidation.url;
        }

        // Обновляем другие поля
        if (updates.utmParams !== undefined) {
            link.utmParams = updates.utmParams;
        }

        if (updates.abTests !== undefined) {
            link.abTests = updates.abTests;
        }

        if (updates.isActive !== undefined) {
            link.isActive = updates.isActive;
        }

        if (updates.customDomain !== undefined) {
            link.customDomain = updates.customDomain;
        }

        await storage.saveLink(link);
        return link;
    }

    /**
     * Удаляет ссылку
     */
    async deleteLink(id) {
        return await storage.deleteLink(id);
    }

    /**
     * Получает все ссылки
     */
    async getAllLinks() {
        return await storage.getAllLinks();
    }

    /**
     * Получает ссылку по коду
     */
    async getLinkByCode(code) {
        return await storage.getLink(code);
    }

    /**
     * Получает ссылку по ID
     */
    async getLinkById(id) {
        return await storage.getLinkById(id);
    }

    /**
     * Проверяет, существует ли код
     */
    async codeExists(code, existingLinks = null) {
        if (!existingLinks) {
            existingLinks = await storage.getAllLinks();
        }
        return existingLinks.some(link => link.shortCode === code);
    }

    /**
     * Генерирует уникальный ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Форматирует короткую ссылку с учетом домена
     */
    async getShortUrl(link) {
        const settings = await storage.getSettings();
        const domain = link.customDomain || settings.defaultDomain || window.location.hostname;
        const protocol = window.location.protocol;
        return `${protocol}//${domain}/redirect.html?code=${link.shortCode}`;
    }
}

// Экспортируем singleton instance
const linkService = new LinkService();
export default linkService;

