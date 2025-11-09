// Вспомогательные функции для работы с датами и форматированием

/**
 * Форматирует дату для отображения пользователю
 * @param {Date|string} date - Дата для форматирования
 * @param {string} format - Формат ('short', 'long', 'datetime', 'time')
 * @returns {string} Отформатированная дата
 */
export function formatDate(date, format = 'short') {
    if (!date) return '';

    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    const options = {
        short: { day: '2-digit', month: '2-digit', year: 'numeric' },
        long: { day: 'numeric', month: 'long', year: 'numeric' },
        datetime: { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' },
        time: { hour: '2-digit', minute: '2-digit' }
    };

    return d.toLocaleDateString('ru-RU', options[format] || options.short);
}

/**
 * Форматирует дату и время для отображения статуса заказа
 * @param {Date|string} date - Дата
 * @returns {string} Отформатированная дата и время
 */
export function formatOrderDate(date) {
    return formatDate(date, 'datetime');
}

/**
 * Получает относительное время (например, "2 часа назад")
 * @param {Date|string} date - Дата
 * @returns {string} Относительное время
 */
export function getRelativeTime(date) {
    if (!date) return '';

    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'только что';
    if (diffMins < 60) return `${diffMins} ${getPlural(diffMins, 'минуту', 'минуты', 'минут')} назад`;
    if (diffHours < 24) return `${diffHours} ${getPlural(diffHours, 'час', 'часа', 'часов')} назад`;
    if (diffDays < 7) return `${diffDays} ${getPlural(diffDays, 'день', 'дня', 'дней')} назад`;

    return formatDate(date, 'short');
}

/**
 * Получает правильную форму слова в зависимости от числа
 */
function getPlural(n, one, few, many) {
    const mod10 = n % 10;
    const mod100 = n % 100;

    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
    return many;
}

/**
 * Генерирует уникальный номер заказа
 * Формат: ORD-YYYYMMDD-HHMMSS-XXXX (где XXXX - случайное число)
 * @returns {string} Уникальный номер заказа
 */
export function generateOrderNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');

    return `ORD-${year}${month}${day}-${hours}${minutes}${seconds}-${random}`;
}

/**
 * Получает читаемое название статуса заказа
 * @param {string} status - Статус заказа
 * @returns {string} Читаемое название
 */
export function getOrderStatusLabel(status) {
    const labels = {
        pending: 'Ожидает подтверждения',
        confirmed: 'Подтвержден',
        cooking: 'Готовится',
        ready: 'Готов к выдаче',
        delivering: 'В доставке',
        delivered: 'Доставлен',
        cancelled: 'Отменен'
    };

    return labels[status] || status;
}

/**
 * Получает читаемое название статуса доставки
 * @param {string} status - Статус доставки
 * @returns {string} Читаемое название
 */
export function getDeliveryStatusLabel(status) {
    const labels = {
        pending: 'Ожидает упаковки',
        packing: 'Упаковывается',
        on_way: 'В пути',
        delivered: 'Доставлено',
        cancelled: 'Отменено'
    };

    return labels[status] || status;
}

