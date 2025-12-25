/**
 * AB Test Engine - логика A/B тестирования
 */

export class ABTestEngine {
    /**
     * Выбирает вариант для A/B теста на основе весов
     */
    selectVariant(variants) {
        if (!variants || variants.length === 0) {
            return null;
        }

        // Проверяем, что веса в сумме дают 100 (или близко к 100)
        const totalWeight = variants.reduce((sum, v) => sum + (v.weight || 0), 0);
        if (totalWeight === 0) {
            return variants[0]; // Если веса не заданы, возвращаем первый вариант
        }

        // Нормализуем веса до 100
        const normalizedVariants = variants.map(v => ({
            ...v,
            normalizedWeight: (v.weight / totalWeight) * 100
        }));

        // Генерируем случайное число от 0 до 100
        const random = Math.random() * 100;

        // Распределяем варианты по диапазонам
        let cumulative = 0;
        for (const variant of normalizedVariants) {
            cumulative += variant.normalizedWeight;
            if (random <= cumulative) {
                return variant;
            }
        }

        // Если что-то пошло не так, возвращаем последний вариант
        return normalizedVariants[normalizedVariants.length - 1];
    }

    /**
     * Валидирует конфигурацию A/B тестов
     */
    validateABTests(variants) {
        if (!variants || variants.length === 0) {
            return { valid: true };
        }

        if (variants.length < 2) {
            return { valid: false, error: 'Нужно минимум 2 варианта для A/B теста' };
        }

        // Проверяем, что у всех вариантов есть URL и weight
        for (const variant of variants) {
            if (!variant.url || typeof variant.url !== 'string') {
                return { valid: false, error: 'У всех вариантов должен быть указан URL' };
            }
            if (typeof variant.weight !== 'number' || variant.weight < 0) {
                return { valid: false, error: 'Вес должен быть положительным числом' };
            }
        }

        const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
        if (totalWeight === 0) {
            return { valid: false, error: 'Сумма весов не может быть равна нулю' };
        }

        // Предупреждение, если сумма не равна 100 (но не ошибка)
        if (Math.abs(totalWeight - 100) > 0.01) {
            return { 
                valid: true, 
                warning: `Сумма весов (${totalWeight}%) не равна 100%. Веса будут нормализованы.` 
            };
        }

        return { valid: true };
    }

    /**
     * Нормализует веса до 100
     */
    normalizeWeights(variants) {
        const totalWeight = variants.reduce((sum, v) => sum + (v.weight || 0), 0);
        if (totalWeight === 0) return variants;

        return variants.map(v => ({
            ...v,
            weight: (v.weight / totalWeight) * 100
        }));
    }
}

// Экспортируем singleton instance
const abTestEngine = new ABTestEngine();
export default abTestEngine;

