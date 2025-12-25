/**
 * Страница редиректа - обработка переходов по коротким ссылкам
 */

import redirectEngine from './core/redirect-engine.js';
import statsTracker from './core/stats-tracker.js';
import abTestEngine from './core/ab-test-engine.js';

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const errorMessage = document.getElementById('errorMessage');

    if (!code) {
        showError('Код ссылки не указан');
        return;
    }

    try {
        // Обрабатываем редирект
        const finalUrl = await redirectEngine.handleRedirect(code, abTestEngine);

        // Регистрируем клик
        const link = await redirectEngine.getRedirectData(code);
        if (link && link.abTests && link.abTests.length > 0) {
            const selectedVariant = abTestEngine.selectVariant(link.abTests);
            await statsTracker.trackClick(code, {
                abVariant: selectedVariant ? selectedVariant.url : null
            });
        } else {
            await statsTracker.trackClick(code);
        }

        // Выполняем редирект
        window.location.replace(finalUrl);
    } catch (error) {
        console.error('Redirect error:', error);
        showError(error.message || 'Ошибка при обработке ссылки');
    }
});

function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    if (errorMessage) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
    }
}

