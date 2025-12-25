/**
 * Страница настроек
 */

import storage from './core/storage.js';

document.addEventListener('DOMContentLoaded', async () => {
    await loadSettings();
    setupEventListeners();
});

async function loadSettings() {
    const settings = await storage.getSettings();
    const customDomainInput = document.getElementById('customDomain');
    
    if (customDomainInput && settings.customDomains.length > 0) {
        customDomainInput.value = settings.customDomains[0];
    }

    renderDomainList(settings.customDomains);
}

function setupEventListeners() {
    // Сохранение кастомного домена
    document.getElementById('saveDomainBtn')?.addEventListener('click', async () => {
        const domainInput = document.getElementById('customDomain');
        const domain = domainInput.value.trim();

        if (!domain) {
            alert('Введите домен');
            return;
        }

        // Простая валидация домена
        const domainPattern = /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
        if (!domainPattern.test(domain)) {
            alert('Некорректный формат домена');
            return;
        }

        try {
            await storage.addCustomDomain(domain);
            alert('Домен сохранен (в MVP версии это только настройка отображения)');
            await loadSettings();
        } catch (error) {
            alert('Ошибка сохранения домена: ' + error.message);
        }
    });

    // Экспорт данных
    document.getElementById('exportBtn')?.addEventListener('click', async () => {
        try {
            const data = await storage.exportData();
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `good-linker-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            alert('Ошибка экспорта данных: ' + error.message);
        }
    });

    // Импорт данных
    document.getElementById('importFile')?.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!confirm('Импорт данных заменит все текущие ссылки и настройки. Продолжить?')) {
            e.target.value = '';
            return;
        }

        try {
            const text = await file.text();
            await storage.importData(text);
            alert('Данные успешно импортированы');
            // Обновляем список доменов
            await loadSettings();
        } catch (error) {
            alert('Ошибка импорта данных: ' + error.message);
        } finally {
            e.target.value = '';
        }
    });

    // Очистка всех данных
    document.getElementById('clearAllBtn')?.addEventListener('click', async () => {
        if (!confirm('Вы уверены? Это удалит ВСЕ ссылки и настройки. Это действие нельзя отменить!')) {
            return;
        }

        if (!confirm('Это финальное предупреждение. Все данные будут удалены без возможности восстановления. Продолжить?')) {
            return;
        }

        try {
            await storage.clearAll();
            alert('Все данные очищены');
            window.location.href = 'index.html';
        } catch (error) {
            alert('Ошибка очистки данных: ' + error.message);
        }
    });
}

function renderDomainList(domains) {
    const container = document.getElementById('domainList');
    if (!container) return;

    if (domains.length === 0) {
        container.innerHTML = '<p class="text-sm text-gray-500">Кастомные домены не добавлены</p>';
        return;
    }

    container.innerHTML = domains.map(domain => `
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
            <span class="text-gray-900 font-mono">${escapeHtml(domain)}</span>
            <button 
                class="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm font-medium text-white transition-colors delete-domain-btn"
                data-domain="${escapeHtml(domain)}"
            >
                Удалить
            </button>
        </div>
    `).join('');

    // Добавляем обработчики удаления
    container.querySelectorAll('.delete-domain-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const domain = e.target.dataset.domain;
            if (confirm(`Удалить домен ${domain}?`)) {
                await storage.removeCustomDomain(domain);
                await loadSettings();
            }
        });
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

