/**
 * Страница списка ссылок
 */

import linkService from './core/link-service.js';
import statsTracker from './core/stats-tracker.js';

let allLinks = [];
let filteredLinks = [];

document.addEventListener('DOMContentLoaded', async () => {
    await loadLinks();
    setupEventListeners();
});

async function loadLinks() {
    const container = document.getElementById('linksContainer');
    const emptyState = document.getElementById('emptyState');

    try {
        allLinks = await linkService.getAllLinks();
        filteredLinks = [...allLinks];
        
        if (allLinks.length === 0) {
            container.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');
        renderLinks();
    } catch (error) {
        console.error('Error loading links:', error);
        container.innerHTML = '<div class="text-center py-12 text-red-600 dark:text-red-400">Ошибка загрузки ссылок</div>';
    }
}

function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    const sortSelect = document.getElementById('sortSelect');
    const filterSelect = document.getElementById('filterSelect');

    searchInput?.addEventListener('input', (e) => {
        filterAndSort(e.target.value, sortSelect.value, filterSelect.value);
    });

    sortSelect?.addEventListener('change', (e) => {
        filterAndSort(searchInput.value, e.target.value, filterSelect.value);
    });

    filterSelect?.addEventListener('change', (e) => {
        filterAndSort(searchInput.value, sortSelect.value, e.target.value);
    });
}

function filterAndSort(searchTerm, sortBy, filterBy) {
    // Фильтрация
    filteredLinks = allLinks.filter(link => {
        // Поиск
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            const matchesUrl = link.originalUrl.toLowerCase().includes(searchLower);
            const matchesCode = link.shortCode.toLowerCase().includes(searchLower);
            if (!matchesUrl && !matchesCode) return false;
        }

        // Фильтр по статусу
        if (filterBy === 'active' && !link.isActive) return false;
        if (filterBy === 'inactive' && link.isActive) return false;

        return true;
    });

    // Сортировка
    filteredLinks.sort((a, b) => {
        switch (sortBy) {
            case 'date-desc':
                return new Date(b.createdAt) - new Date(a.createdAt);
            case 'date-asc':
                return new Date(a.createdAt) - new Date(b.createdAt);
            case 'clicks-desc':
                return (b.stats?.totalClicks || 0) - (a.stats?.totalClicks || 0);
            case 'clicks-asc':
                return (a.stats?.totalClicks || 0) - (b.stats?.totalClicks || 0);
            default:
                return 0;
        }
    });

    renderLinks();
}

function renderLinks() {
    const container = document.getElementById('linksContainer');

    if (filteredLinks.length === 0) {
        container.innerHTML = '<div class="text-center py-12 text-gray-500 dark:text-slate-400">Ссылки не найдены</div>';
        return;
    }

    container.innerHTML = filteredLinks.map(link => createLinkCard(link)).join('');
    
    // Добавляем обработчики событий для переключателей статуса
    filteredLinks.forEach(link => {
        const toggle = document.getElementById(`toggle-${link.id}`);
        toggle?.addEventListener('change', async (e) => {
            await linkService.updateLink(link.id, { isActive: e.target.checked });
            await loadLinks();
        });
    });
}

function createLinkCard(link) {
    const totalClicks = link.stats?.totalClicks || 0;
    const clicks24h = link.stats?.clicks24h || 0;
    const createdDate = new Date(link.createdAt).toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const statusBadge = link.isActive 
        ? '<span class="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs font-medium">Активна</span>'
        : '<span class="px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400 rounded text-xs font-medium">Неактивна</span>';

    return `
        <div class="bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl p-6 hover:border-gray-300 dark:hover:border-slate-500 transition-colors card-shadow">
            <div class="flex items-start justify-between mb-4">
                <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-slate-100">${escapeHtml(link.shortCode)}</h3>
                        ${statusBadge}
                    </div>
                    <p class="text-sm text-gray-600 dark:text-slate-300 truncate mb-2">${escapeHtml(link.originalUrl)}</p>
                    <p class="text-xs text-gray-500 dark:text-slate-400">Создано: ${createdDate}</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer ml-4">
                    <input type="checkbox" id="toggle-${link.id}" ${link.isActive ? 'checked' : ''} class="sr-only peer">
                    <div class="w-11 h-6 bg-gray-200 dark:bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 dark:peer-focus:ring-slate-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900 dark:peer-checked:bg-slate-500"></div>
                </label>
            </div>
            <div class="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-slate-600">
                <div class="flex gap-6 text-sm">
                    <div>
                        <span class="text-gray-600 dark:text-slate-300">Всего кликов:</span>
                        <span class="text-gray-900 dark:text-slate-100 font-semibold ml-2">${totalClicks}</span>
                    </div>
                    <div>
                        <span class="text-gray-600 dark:text-slate-300">За 24ч:</span>
                        <span class="text-gray-900 dark:text-slate-100 font-semibold ml-2">${clicks24h}</span>
                    </div>
                </div>
                <a href="link.html?id=${link.id}" class="px-4 py-2 bg-gray-900 dark:bg-slate-600 hover:bg-gray-800 dark:hover:bg-slate-500 rounded-lg text-sm font-medium text-white transition-colors">
                    Детали
                </a>
            </div>
        </div>
    `;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

