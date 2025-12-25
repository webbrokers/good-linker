/**
 * URL Validator - валидация и нормализация URL
 */

export function isValidUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
}

export function normalizeUrl(url) {
    url = url.trim();
    
    // Если URL не начинается с протокола, добавляем https://
    if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
    }
    
    return url;
}

export function validateAndNormalizeUrl(url) {
    if (!url || typeof url !== 'string') {
        return { valid: false, error: 'URL не может быть пустым' };
    }

    const normalized = normalizeUrl(url);
    
    if (!isValidUrl(normalized)) {
        return { valid: false, error: 'Некорректный URL' };
    }

    return { valid: true, url: normalized };
}

