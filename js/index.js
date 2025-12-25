/**
 * Главная страница - создание ссылки
 */

import linkService from './core/link-service.js';
import { getUtmParamsFromForm } from './utils/utm-builder.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('linkForm');
    const toggleUtmBtn = document.getElementById('toggleUtm');
    const utmSection = document.getElementById('utmSection');
    const utmArrow = document.getElementById('utmArrow');
    const resultDiv = document.getElementById('result');
    const shortLinkInput = document.getElementById('shortLink');
    const copyBtn = document.getElementById('copyBtn');
    const viewLink = document.getElementById('viewLink');
    const qrLink = document.getElementById('qrLink');

    // Переключение видимости UTM секции
    toggleUtmBtn?.addEventListener('click', () => {
        const isHidden = utmSection.classList.contains('hidden');
        utmSection.classList.toggle('hidden');
        utmArrow.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
    });

    // Обработка формы
    form?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const originalUrl = document.getElementById('originalUrl').value.trim();
        const customCode = document.getElementById('customCode').value.trim();

        try {
            // Получаем UTM параметры
            const utmParams = getUtmParamsFromForm();

            // Создаем ссылку
            const link = await linkService.createLink({
                originalUrl,
                customCode: customCode || null,
                utmParams
            });

            // Получаем короткий URL
            const shortUrl = await linkService.getShortUrl(link);

            // Отображаем результат
            shortLinkInput.value = shortUrl;
            viewLink.href = `link.html?id=${link.id}`;
            qrLink.href = `link.html?id=${link.id}#qr`;
            resultDiv.classList.remove('hidden');

            // Прокручиваем к результату
            resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

            // Очищаем форму
            form.reset();
            utmSection.classList.add('hidden');
            utmArrow.style.transform = 'rotate(0deg)';
        } catch (error) {
            alert('Ошибка: ' + error.message);
        }
    });

    // Копирование ссылки
    copyBtn?.addEventListener('click', async () => {
        const link = shortLinkInput.value;
        try {
            await navigator.clipboard.writeText(link);
            copyBtn.textContent = 'Скопировано!';
            setTimeout(() => {
                copyBtn.textContent = 'Копировать';
            }, 2000);
        } catch (error) {
            // Fallback для старых браузеров
            shortLinkInput.select();
            document.execCommand('copy');
            copyBtn.textContent = 'Скопировано!';
            setTimeout(() => {
                copyBtn.textContent = 'Копировать';
            }, 2000);
        }
    });
});

