import { pool } from '../config/database.js';

export async function processOrderStatus(orderId) {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [orders] = await connection.execute(
            'SELECT status, delivery_method FROM orders WHERE id = ?',
            [orderId]
        );

        if (orders.length === 0) {
            await connection.rollback();
            return;
        }

        const currentStatus = orders[0].status;
        const deliveryMethod = orders[0].delivery_method;
        let nextStatus = null;
        let notes = '';

        // Обновляем логику статусов для самовывоза
        switch (currentStatus) {
            case 'pending':
                nextStatus = 'confirmed';
                notes = 'Заказ автоматически подтвержден';
                break;
            case 'confirmed':
                nextStatus = 'cooking';
                notes = 'Заказ передан на кухню';
                break;
            case 'cooking':
                nextStatus = 'ready';
                notes = 'Заказ готов к выдаче';
                break;
            case 'ready':
                if (deliveryMethod === 'delivery') {
                    nextStatus = 'delivering';
                    notes = 'Заказ передан курьеру';
                } else {
                    nextStatus = 'completed'; // Новый статус для завершенного самовывоза
                    notes = 'Заказ готов к самовывозу';
                }
                break;
            case 'delivering':
                nextStatus = 'delivered';
                notes = 'Заказ доставлен';
                break;
            default:
                await connection.commit();
                return;
        }

        await connection.execute(
            'UPDATE orders SET status = ? WHERE id = ?',
            [nextStatus, orderId]
        );

        await connection.execute(
            'INSERT INTO order_history (order_id, status, notes) VALUES (?, ?, ?)',
            [orderId, nextStatus, notes]
        );

        await connection.commit();

        // Обновляем задержки для самовывоза
        if (nextStatus !== 'completed' && nextStatus !== 'delivered' && nextStatus !== 'cancelled') {
            const delays = {
                confirmed: 30000,
                cooking: 60000,
                ready: 30000, // Уменьшаем время для самовывоза
                delivering: 60000
            };

            setTimeout(() => {
                processOrderStatus(orderId).catch(err => {
                    console.error(`Error processing order ${orderId} status:`, err);
                });
            }, delays[nextStatus] || 30000);
        }

    } catch (error) {
        await connection.rollback();
        console.error(`Error processing order ${orderId} status:`, error);
        throw error;
    } finally {
        connection.release();
    }
}