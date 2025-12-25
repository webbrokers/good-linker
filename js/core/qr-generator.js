/**
 * QR Generator - генерация QR кодов
 * Использует библиотеку qrcode.js (подключена через CDN)
 */

export class QRGenerator {
    /**
     * Генерирует QR код для URL и отображает на canvas
     */
    async generateQRCode(url, canvasId, options = {}) {
        return new Promise((resolve, reject) => {
            const canvas = document.getElementById(canvasId);
            if (!canvas) {
                reject(new Error('Canvas элемент не найден'));
                return;
            }

            const defaultOptions = {
                width: 256,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                },
                ...options
            };

            // Используем глобальную функцию QRCode из библиотеки qrcode.js
            if (typeof QRCode !== 'undefined') {
                QRCode.toCanvas(canvas, url, defaultOptions, (error) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(canvas.toDataURL('image/png'));
                    }
                });
            } else {
                reject(new Error('Библиотека QRCode не загружена'));
            }
        });
    }

    /**
     * Генерирует QR код и возвращает data URL
     */
    async generateQRCodeDataURL(url, options = {}) {
        return new Promise((resolve, reject) => {
            const defaultOptions = {
                width: 256,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                },
                ...options
            };

            if (typeof QRCode !== 'undefined') {
                QRCode.toDataURL(url, defaultOptions, (error, url) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(url);
                    }
                });
            } else {
                reject(new Error('Библиотека QRCode не загружена'));
            }
        });
    }

    /**
     * Скачивает QR код как PNG файл
     */
    downloadQRCode(canvasId, filename = 'qrcode.png') {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            throw new Error('Canvas элемент не найден');
        }

        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 'image/png');
    }
}

// Экспортируем singleton instance
const qrGenerator = new QRGenerator();
export default qrGenerator;

