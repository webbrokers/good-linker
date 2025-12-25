/**
 * UTM Builder - построение URL с UTM метками
 */

/**
 * Создает объект UTM параметров из формы
 */
export function getUtmParamsFromForm(prefix = '') {
    const params = {};
    const utmFields = ['source', 'medium', 'campaign', 'term', 'content'];
    
    utmFields.forEach(field => {
        const value = document.getElementById(`${prefix}utm_${field}`)?.value?.trim();
        if (value) {
            params[`utm_${field}`] = value;
        }
    });
    
    return Object.keys(params).length > 0 ? params : null;
}

/**
 * Добавляет UTM параметры к URL
 */
export function addUtmToUrl(url, utmParams) {
    if (!utmParams || Object.keys(utmParams).length === 0) {
        return url;
    }

    try {
        const urlObj = new URL(url);
        Object.entries(utmParams).forEach(([key, value]) => {
            urlObj.searchParams.set(key, value);
        });
        return urlObj.toString();
    } catch (error) {
        console.error('Error adding UTM to URL:', error);
        return url;
    }
}

/**
 * Извлекает UTM параметры из URL
 */
export function extractUtmFromUrl(url) {
    try {
        const urlObj = new URL(url);
        const utmParams = {};
        const utmFields = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
        
        utmFields.forEach(field => {
            const value = urlObj.searchParams.get(field);
            if (value) {
                utmParams[field] = value;
            }
        });
        
        return Object.keys(utmParams).length > 0 ? utmParams : null;
    } catch (error) {
        console.error('Error extracting UTM from URL:', error);
        return null;
    }
}

/**
 * Заполняет форму UTM параметрами
 */
export function fillUtmForm(utmParams, prefix = '') {
    if (!utmParams) return;
    
    Object.entries(utmParams).forEach(([key, value]) => {
        const fieldId = `${prefix}${key}`;
        const input = document.getElementById(fieldId);
        if (input) {
            input.value = value;
        }
    });
}

