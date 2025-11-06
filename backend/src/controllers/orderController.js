import { pool } from '../config/database.js';

export const createOrder = async (req, res) => {
  try {
    const { items, address } = req.body;
    const userId = req.user.id;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Корзина пуста' });
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
          throw new Error(`Блюдо временно недоступно`);
        }
        
        totalAmount += itemData[0].price * item.quantity;
      }

      const [orderResult] = await connection.execute(
        'INSERT INTO orders (user_id, total_amount, status) VALUES (?, ?, ?)',
        [userId, totalAmount, 'pending']
      );

      const orderId = orderResult.insertId;

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

      const trackingNumber = `TRACK-${Date.now()}-${orderId}`;
      await connection.execute(
        'INSERT INTO deliveries (order_id, tracking_number, address, status) VALUES (?, ?, ?, ?)',
        [orderId, trackingNumber, address, 'pending']
      );

      await connection.commit();

      const [order] = await pool.execute(`
        SELECT o.*, d.tracking_number, d.status as delivery_status
        FROM orders o 
        LEFT JOIN deliveries d ON o.id = d.order_id 
        WHERE o.id = ?
      `, [orderId]);

      res.status(201).json({
        message: 'Заказ успешно создан',
        order: order[0],
        tracking_number: trackingNumber
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

export const getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    const [orders] = await pool.execute(`
      SELECT o.*, d.tracking_number, d.status as delivery_status
      FROM orders o 
      LEFT JOIN deliveries d ON o.id = d.order_id 
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `, [userId]);

    res.json({ orders });

  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Ошибка при получении заказов' });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [orders] = await pool.execute(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    const [orderDetails] = await pool.execute(`
      SELECT o.*, d.tracking_number, d.address, d.status as delivery_status,
             d.estimated_delivery, d.delivery_date
      FROM orders o 
      LEFT JOIN deliveries d ON o.id = d.order_id 
      WHERE o.id = ?
    `, [id]);

    const [orderItems] = await pool.execute(`
      SELECT oi.*, i.name, i.image_url
      FROM order_items oi
      LEFT JOIN items i ON oi.item_id = i.id
      WHERE oi.order_id = ?
    `, [id]);

    res.json({
      order: orderDetails[0],
      items: orderItems
    });

  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Ошибка при получении заказа' });
  }
};