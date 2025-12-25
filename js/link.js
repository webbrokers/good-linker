/**
 * Детальная страница ссылки
 */

import linkService from './core/link-service.js';
import statsTracker from './core/stats-tracker.js';
import abTestEngine from './core/ab-test-engine.js';
import qrGenerator from './core/qr-generator.js';
import { getUtmParamsFromForm, fillUtmForm, addUtmToUrl } from './utils/utm-builder.js';
import { validateAndNormalizeUrl } from './utils/url-validator.js';

let currentLink = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Получаем ID из URL параметров
    const urlParams = new URLSearchParams(window.location.search);
    const linkId = urlParams.get('id');

    if (!linkId) {
        showError('ID ссылки не указан');
        return;
    }

    await loadLink(linkId);
    setupEventListeners();

    // Если есть якорь #qr, прокручиваем к QR коду
    if (window.location.hash === '#qr') {
        setTimeout(() => {
            document.getElementById('qrCodeContainer')?.scrollIntoView({ behavior: 'smooth' });
        }, 500);
    }
});

async function loadLink(id) {
    const loadingState = document.getElementById('loadingState');
    const linkContent = document.getElementById('linkContent');

    try {
        currentLink = await linkService.getLinkById(id);
        
        if (!currentLink) {
            showError('Ссылка не найдена');
            return;
        }

        loadingState.classList.add('hidden');
        linkContent.classList.remove('hidden');

        await renderLink();
        await generateQRCode();
    } catch (error) {
        console.error('Error loading link:', error);
        showError('Ошибка загрузки ссылки');
    }
}

async function renderLink() {
    // Основная информация
    document.getElementById('toggleActive').checked = currentLink.isActive;
    document.getElementById('statusText').textContent = currentLink.isActive ? 'Активна' : 'Неактивна';
    document.getElementById('createdAt').textContent = new Date(currentLink.createdAt).toLocaleString('ru-RU');
    document.getElementById('linkCode').textContent = currentLink.shortCode;

    // Короткая ссылка
    const shortUrl = await linkService.getShortUrl(currentLink);
    document.getElementById('shortLinkDisplay').value = shortUrl;
    document.getElementById('testLink').href = shortUrl;

    // Оригинальный URL
    document.getElementById('originalUrlInput').value = currentLink.originalUrl;

    // UTM метки
    fillUtmForm(currentLink.utmParams, 'edit_');

    // Статистика
    const stats = currentLink.stats || {
        totalClicks: 0,
        clicks24h: 0,
        clicksHistory: []
    };
    document.getElementById('totalClicks').textContent = stats.totalClicks || 0;
    document.getElementById('clicks24h').textContent = stats.clicks24h || 0;

    // График кликов
    renderChart(stats.clicksHistory || []);

    // A/B тесты
    renderABTests(currentLink.abTests || []);
}

function setupEventListeners() {
    // Переключение статуса
    document.getElementById('toggleActive')?.addEventListener('change', async (e) => {
        const statusText = document.getElementById('statusText');
        statusText.textContent = e.target.checked ? 'Активна' : 'Неактивна';
        
        await linkService.updateLink(currentLink.id, { isActive: e.target.checked });
        currentLink.isActive = e.target.checked;
    });

    // Сохранение URL
    document.getElementById('originalUrlInput')?.addEventListener('blur', async (e) => {
        const url = e.target.value.trim();
        if (url && url !== currentLink.originalUrl) {
            try {
                const validation = validateAndNormalizeUrl(url);
                if (validation.valid) {
                    await linkService.updateLink(currentLink.id, { originalUrl: validation.url });
                    currentLink.originalUrl = validation.url;
                } else {
                    alert('Некорректный URL');
                    e.target.value = currentLink.originalUrl;
                }
            } catch (error) {
                alert('Ошибка обновления: ' + error.message);
                e.target.value = currentLink.originalUrl;
            }
        }
    });

    // Сохранение UTM
    document.getElementById('saveUtmBtn')?.addEventListener('click', async () => {
        const utmParams = getUtmParamsFromForm('edit_');
        await linkService.updateLink(currentLink.id, { utmParams });
        currentLink.utmParams = utmParams;
        alert('UTM метки сохранены');
    });

    // Сохранение A/B тестов
    document.getElementById('saveAbBtn')?.addEventListener('click', async () => {
        const variants = getABTestVariants();
        const validation = abTestEngine.validateABTests(variants);
        
        if (!validation.valid) {
            alert('Ошибка: ' + validation.error);
            return;
        }

        if (validation.warning) {
            if (!confirm(validation.warning + ' Продолжить?')) {
                return;
            }
        }

        const normalizedVariants = abTestEngine.normalizeWeights(variants);
        await linkService.updateLink(currentLink.id, { abTests: normalizedVariants });
        currentLink.abTests = normalizedVariants;
        renderABTests(normalizedVariants);
        alert('A/B тесты сохранены');
    });

    // Добавление варианта A/B
    document.getElementById('addAbVariantBtn')?.addEventListener('click', () => {
        addABTestVariant();
    });

    // Удаление ссылки
    document.getElementById('deleteBtn')?.addEventListener('click', async () => {
        if (confirm('Вы уверены, что хотите удалить эту ссылку? Это действие нельзя отменить.')) {
            await linkService.deleteLink(currentLink.id);
            window.location.href = 'links.html';
        }
    });

    // Копирование короткой ссылки
    document.getElementById('copyShortBtn')?.addEventListener('click', async () => {
        const link = document.getElementById('shortLinkDisplay').value;
        try {
            await navigator.clipboard.writeText(link);
            const btn = document.getElementById('copyShortBtn');
            btn.textContent = 'Скопировано!';
            setTimeout(() => {
                btn.textContent = 'Копировать';
            }, 2000);
        } catch (error) {
            document.getElementById('shortLinkDisplay').select();
            document.execCommand('copy');
        }
    });

    // Скачивание QR кода
    document.getElementById('downloadQrBtn')?.addEventListener('click', () => {
        try {
            qrGenerator.downloadQRCode('qrCanvas', `qr-${currentLink.shortCode}.png`);
        } catch (error) {
            alert('Ошибка скачивания QR кода');
        }
    });
}

function renderChart(clicksHistory) {
    const canvas = document.getElementById('clicksChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const data = statsTracker.formatHistoryForChart(clicksHistory, 30);

    // Очищаем canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Находим максимум для масштабирования
    const maxValue = Math.max(...data.map(d => d.count), 1);

    // Рисуем оси
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Рисуем график
    if (data.length > 0) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.beginPath();

        data.forEach((point, index) => {
            const x = padding + (index / (data.length - 1)) * chartWidth;
            const y = height - padding - (point.count / maxValue) * chartHeight;

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        // Заливка под графиком
        ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
        ctx.lineTo(width - padding, height - padding);
        ctx.lineTo(padding, height - padding);
        ctx.closePath();
        ctx.fill();
    }

    // Подписи осей
    ctx.fillStyle = '#9ca3af';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('0', padding - 20, height - padding + 5);
    ctx.fillText(maxValue.toString(), padding - 20, padding + 5);
}

function renderABTests(variants) {
    const container = document.getElementById('abTestsContainer');
    if (!container) return;

    if (variants.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-sm">A/B тесты не настроены. Оригинальный URL будет использоваться для всех переходов.</p>';
        return;
    }

    container.innerHTML = variants.map((variant, index) => createABTestVariantHTML(variant, index)).join('');

    // Добавляем обработчики удаления
    variants.forEach((variant, index) => {
        const deleteBtn = document.getElementById(`delete-ab-${index}`);
        deleteBtn?.addEventListener('click', () => {
            removeABTestVariant(index);
        });
    });
}

function createABTestVariantHTML(variant, index) {
    return `
        <div class="bg-gray-800/50 rounded-lg p-4">
            <div class="flex items-start justify-between mb-3">
                <div class="flex-1">
                    <label class="block text-sm font-medium text-gray-300 mb-2">URL варианта ${index + 1}</label>
                    <input 
                        type="url" 
                        id="ab-url-${index}" 
                        value="${escapeHtml(variant.url)}"
                        class="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white mb-3"
                    >
                    <label class="block text-sm font-medium text-gray-300 mb-2">Вес (%)</label>
                    <input 
                        type="number" 
                        id="ab-weight-${index}" 
                        value="${variant.weight}"
                        min="0"
                        max="100"
                        step="0.1"
                        class="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    >
                </div>
                ${variants.length > 1 ? `
                    <button 
                        id="delete-ab-${index}"
                        class="ml-4 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors"
                    >
                        Удалить
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}

function getABTestVariants() {
    const container = document.getElementById('abTestsContainer');
    if (!container) return [];

    const variants = [];
    let index = 0;

    while (true) {
        const urlInput = document.getElementById(`ab-url-${index}`);
        const weightInput = document.getElementById(`ab-weight-${index}`);

        if (!urlInput || !weightInput) break;

        const url = urlInput.value.trim();
        const weight = parseFloat(weightInput.value) || 0;

        if (url) {
            variants.push({ url, weight });
        }

        index++;
    }

    return variants;
}

function addABTestVariant() {
    const variants = getABTestVariants();
    variants.push({ url: '', weight: 0 });
    renderABTests(variants);
}

function removeABTestVariant(index) {
    const variants = getABTestVariants();
    variants.splice(index, 1);
    renderABTests(variants);
}

async function generateQRCode() {
    try {
        const shortUrl = await linkService.getShortUrl(currentLink);
        await qrGenerator.generateQRCode(shortUrl, 'qrCanvas', {
            width: 256,
            margin: 2
        });
    } catch (error) {
        console.error('Error generating QR code:', error);
    }
}

function showError(message) {
    const loadingState = document.getElementById('loadingState');
    loadingState.innerHTML = `<div class="text-red-400">${escapeHtml(message)}</div>`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

