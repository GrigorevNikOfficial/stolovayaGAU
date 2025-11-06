import { pool } from '../config/database.js';
import { generateOrderNumber } from '../utils/helpers.js';
import { processOrderStatus } from '../services/orderService.js';

export const createOrder = async (req, res) => {
  try {
    const { items, deliveryMethod = 'pickup' } = req.body;
    const userId = req.user.id;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Корзина пуста' });
    }

    // Убираем проверку адреса для самовывоза
    if (deliveryMethod === 'delivery') {
      return res.status(400).json({
        error: 'Доставка временно недоступна. Пожалуйста, выберите самовывоз.'
      });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      let totalAmount = 0;
      for (const item of items) {
        const [itemData] = await connection.execute(
            'SELECT price, is_available FROM items WHERE id = ?',
            [item.id]
        );

        if (itemData.length === 0) {
          throw new Error(`Блюдо с ID ${item.id} не найдено`);
        }

        if (!itemData[0].is_available) {
          throw new Error(`Блюдо "${item.id}" временно недоступно`);
        }

        if (!item.quantity || item.quantity < 1) {
          throw new Error(`Некорректное количество для блюда ${item.id}`);
        }

        totalAmount += itemData[0].price * item.quantity;
      }

      // Генерируем уникальный номер заказа
      let orderNumber = generateOrderNumber();
      let attempts = 0;
      while (attempts < 10) {
        const [existing] = await connection.execute(
            'SELECT id FROM orders WHERE order_number = ?',
            [orderNumber]
        );
        if (existing.length === 0) break;
        orderNumber = generateOrderNumber();
        attempts++;
      }

      // Создаем заказ со статусом 'pending' и методом доставки
      const [orderResult] = await connection.execute(
          'INSERT INTO orders (user_id, order_number, total_amount, status, delivery_method) VALUES (?, ?, ?, ?, ?)',
          [userId, orderNumber, totalAmount, 'pending', deliveryMethod]
      );

      const orderId = orderResult.insertId;

      // Сохраняем историю создания заказа
      await connection.execute(
          'INSERT INTO order_history (order_id, status, notes) VALUES (?, ?, ?)',
          [orderId, 'pending', 'Заказ создан']
      );

      // Добавляем товары в заказ
      for (const item of items) {
        const [itemData] = await connection.execute(
            'SELECT price FROM items WHERE id = ?',
            [item.id]
        );

        await connection.execute(
            'INSERT INTO order_items (order_id, item_id, quantity, price_at_time) VALUES (?, ?, ?, ?)',
            [orderId, item.id, item.quantity, itemData[0].price]
        );
      }

      // УБИРАЕМ создание доставки для самовывоза

      // Автоматически переводим заказ в статус 'confirmed'
      setTimeout(async () => {
        try {
          await processOrderStatus(orderId);
        } catch (err) {
          console.error('Error auto-confirming order:', err);
        }
      }, 5000);

      await connection.commit();

      // Обновляем запрос - убираем JOIN с deliveries
      const [order] = await pool.execute(`
        SELECT o.*
        FROM orders o 
        WHERE o.id = ?
      `, [orderId]);

      res.status(201).json({
        message: 'Заказ успешно создан',
        order: order[0],
        order_number: orderNumber
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: error.message || 'Ошибка при создании заказа' });
  }
};

// Получить свои заказы (обычный пользователь) или все заказы (админ)
export const getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let query = `
      SELECT o.*
      FROM orders o 
    `;
    const params = [];

    if (userRole !== 'admin') {
      query += ' WHERE o.user_id = ?';
      params.push(userId);
    }

    query += ' ORDER BY o.created_at DESC';

    const [orders] = await pool.execute(query, params);

    res.json({ orders });

  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Ошибка при получении заказов' });
  }
};

// Получить историю заказа (изменения статусов) - ДОБАВЛЯЕМ ЭКСПОРТ
export const getOrderHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Проверяем доступ к заказу
    let accessQuery = 'SELECT id, user_id FROM orders WHERE id = ?';
    const accessParams = [id];

    if (userRole !== 'admin') {
      accessQuery += ' AND user_id = ?';
      accessParams.push(userId);
    }

    const [orders] = await pool.execute(accessQuery, accessParams);

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    const [history] = await pool.execute(
        'SELECT * FROM order_history WHERE order_id = ? ORDER BY changed_at ASC',
        [id]
    );

    res.json({ history });

  } catch (error) {
    console.error('Get order history error:', error);
    res.status(500).json({ error: 'Ошибка при получении истории заказа' });
  }
};

// Получить заказ по ID (пользователь видит только свои, админ - любые)
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    let query = 'SELECT * FROM orders WHERE id = ?';
    const params = [id];

    // Обычные пользователи могут видеть только свои заказы
    if (userRole !== 'admin') {
      query += ' AND user_id = ?';
      params.push(userId);
    }

    const [orders] = await pool.execute(query, params);

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    // Убираем JOIN с deliveries
    const [orderDetails] = await pool.execute(`
      SELECT o.*
      FROM orders o 
      WHERE o.id = ?
    `, [id]);

    const [orderItems] = await pool.execute(`
      SELECT oi.*, i.name, i.image_url, i.description
      FROM order_items oi
      LEFT JOIN items i ON oi.item_id = i.id
      WHERE oi.order_id = ?
    `, [id]);

    const [orderHistory] = await pool.execute(
        'SELECT * FROM order_history WHERE order_id = ? ORDER BY changed_at ASC',
        [id]
    );

    res.json({
      order: orderDetails[0],
      items: orderItems,
      history: orderHistory
    });

  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Ошибка при получении заказа' });
  }
};

// Обновить статус заказа
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userRole = req.user.role;

    // Только админы могут менять статусы
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Недостаточно прав для изменения статуса заказа' });
    }

    const validStatuses = ['pending', 'confirmed', 'cooking', 'ready', 'delivering', 'delivered', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Неверный статус заказа' });
    }

    const connection = await pool.getConnection();

    try {
      // Проверяем существование заказа
      const [orders] = await connection.execute(
          'SELECT id FROM orders WHERE id = ?',
          [id]
      );

      if (orders.length === 0) {
        return res.status(404).json({ error: 'Заказ не найден' });
      }

      // Обновляем статус заказа
      await connection.execute(
          'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?',
          [status, id]
      );

      // Добавляем запись в историю
      const statusNotes = {
        pending: 'Заказ создан',
        confirmed: 'Заказ подтвержден',
        cooking: 'Заказ передан на кухню',
        ready: 'Заказ готов',
        delivering: 'Заказ передан курьеру',
        delivered: 'Заказ доставлен',
        completed: 'Заказ завершен',
        cancelled: 'Заказ отменен'
      };

      await connection.execute(
          'INSERT INTO order_history (order_id, status, notes) VALUES (?, ?, ?)',
          [id, status, statusNotes[status] || `Статус изменен на ${status}`]
      );

      // Получаем обновленный заказ
      const [updatedOrder] = await connection.execute(
          'SELECT * FROM orders WHERE id = ?',
          [id]
      );

      res.json(updatedOrder[0]);

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Ошибка при обновлении статуса заказа' });
  }
};