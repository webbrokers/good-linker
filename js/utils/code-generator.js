/**
 * Code Generator - генерация уникальных коротких кодов
 */

/**
 * Генерирует случайную строку заданной длины
 */
function generateRandomString(length = 7) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Проверяет, существует ли код в списке ссылок
 */
async function codeExists(code, existingLinks) {
    return existingLinks.some(link => link.shortCode === code);
}

/**
 * Генерирует уникальный код
 */
export async function generateUniqueCode(existingLinks, length = 7) {
    let attempts = 0;
    const maxAttempts = 100;
    
    while (attempts < maxAttempts) {
        const code = generateRandomString(length);
        if (!(await codeExists(code, existingLinks))) {
            return code;
        }
        attempts++;
    }
    
    // Если не удалось сгенерировать за maxAttempts попыток, увеличиваем длину
    return generateUniqueCode(existingLinks, length + 1);
}

/**
 * Валидирует кастомный код
 */
export function validateCustomCode(code) {
    if (!code || typeof code !== 'string') {
        return { valid: false, error: 'Код не может быть пустым' };
    }

    // Проверяем формат: только буквы, цифры, дефисы и подчеркивания
    if (!/^[a-zA-Z0-9-_]+$/.test(code)) {
        return { valid: false, error: 'Код может содержать только буквы, цифры, дефисы и подчеркивания' };
    }

    // Проверяем длину (рекомендуется 3-20 символов)
    if (code.length < 3) {
        return { valid: false, error: 'Код должен содержать минимум 3 символа' };
    }

    if (code.length > 20) {
        return { valid: false, error: 'Код не должен превышать 20 символов' };
    }

    return { valid: true };
}

