import { Order } from '../models/Order.js';
import { Item } from '../models/Item.js';

const normalizeId = value => {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value;
  if (value.toString) return value.toString();
  return value;
};

const mapOrderToResponse = order => {
  const plain =
    typeof order.toObject === 'function'
      ? order.toObject({ getters: true })
      : order;

  return {
    _id: normalizeId(plain._id),
    order_number: plain.order_number,
    user_id: normalizeId(plain.user_id?._id ?? plain.user_id),
    user_info: plain.user_info || null,
    items: (plain.items || []).map(item => ({
      _id: normalizeId(item._id),
      item_id: normalizeId(item.item_id),
      uniq_nom: item.uniq_nom,
      name: item.name,
      quantity: item.quantity,
      price_at_time: item.price_at_time,
      price: item.price_at_time,
    })),
    total_amount: plain.total_amount,
    status: plain.status,
    status_history: (plain.status_history || []).map(entry => ({
      _id: normalizeId(entry._id),
      status: entry.status,
      notes: entry.notes,
      changed_at: entry.changed_at,
    })),
    delivery_method: plain.delivery_method,
    table_number: plain.table_number,
    delivery_address: plain.delivery_address,
    created_at: plain.created_at,
    updated_at: plain.updated_at,
  };
};

export const createOrder = async (req, res) => {
  try {
    const { items, delivery_method = 'pickup', table_number, delivery_address } = req.body;
    const userId = req.user._id;

    // Валидация входных данных
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Корзина пуста' });
    }

    // Временно отключаем доставку
    if (delivery_method === 'delivery') {
      return res.status(400).json({
        error: 'Доставка временно недоступна. Пожалуйста, выберите самовывоз или поесть на месте.'
      });
    }

    // Валидация для dine_in
    if (delivery_method === 'dine_in' && !table_number) {
      return res.status(400).json({
        error: 'Для заказа на месте необходимо указать номер стола'
      });
    }

    let totalAmount = 0;
    const orderItems = [];

    // Проверяем товары и рассчитываем итог
    for (const item of items) {
      const product = await Item.findById(item.id);

      if (!product) {
        return res.status(400).json({
          error: `Блюдо с ID ${item.id} не найдено`
        });
      }

      if (!product.is_available) {
        return res.status(400).json({
          error: `Блюдо "${product.name}" временно недоступно`
        });
      }

      if (!item.quantity || item.quantity < 1) {
        return res.status(400).json({
          error: `Некорректное количество для блюда "${product.name}"`
        });
      }

      orderItems.push({
        item_id: product._id,
        uniq_nom: product.uniq_nom,
        name: product.name,
        quantity: item.quantity,
        price_at_time: product.price
      });

      totalAmount += product.price * item.quantity;
    }

    // Генерируем номер заказа
    const orderNumber = await Order.generateOrderNumber();

    // Создаем заказ
    const order = new Order({
      order_number: orderNumber,
      user_id: userId,
      user_info: {
        first_name: req.user.first_name,
        last_name: req.user.last_name,
        phone: req.user.phone,
        email: req.user.email
      },
      items: orderItems,
      total_amount: totalAmount,
      status: 'pending',
      delivery_method: delivery_method,
      table_number: delivery_method === 'dine_in' ? table_number : null,
      delivery_address: delivery_method === 'delivery' ? delivery_address : null
    });

    await order.save();

    // Автоматически подтверждаем заказ через 5 секунд
    setTimeout(async () => {
      try {
        const updatedOrder = await Order.findByIdAndUpdate(
            order._id,
            {
              status: 'confirmed',
              $push: {
                status_history: {
                  status: 'confirmed',
                  notes: 'Заказ автоматически подтвержден',
                  changed_at: new Date()
                }
              }
            },
            { new: true }
        );
        console.log(`Order ${orderNumber} auto-confirmed`);
      } catch (err) {
        console.error('Error auto-confirming order:', err);
      }
    }, 5000);

    res.status(201).json({
      message: 'Заказ успешно создан',
      order: mapOrderToResponse(order),
      order_number: orderNumber
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: error.message || 'Ошибка при создании заказа' });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    let filter = {};
    if (userRole !== 'admin') {
      filter.user_id = userId;
    }

  const orders = await Order.find(filter)
    .sort({ created_at: -1 });

  res.json({ orders: orders.map(mapOrderToResponse) });

  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Ошибка при получении заказов' });
  }
};

export const getOrderHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    // Проверяем доступ к заказу
    let filter = { _id: id };
    if (userRole !== 'admin') {
      filter.user_id = userId;
    }

    const order = await Order.findOne(filter);
    if (!order) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    res.json({ history: order.status_history });

  } catch (error) {
    console.error('Get order history error:', error);
    res.status(500).json({ error: 'Ошибка при получении истории заказа' });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    let filter = { _id: id };
    if (userRole !== 'admin') {
      filter.user_id = userId;
    }

  const order = await Order.findOne(filter);

    if (!order) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    const mappedOrder = mapOrderToResponse(order);

    res.json({
      order: mappedOrder,
      items: mappedOrder.items,
      history: mappedOrder.status_history
    });

  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Ошибка при получении заказа' });
  }
};

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

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }

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

    // Обновляем статус и добавляем в историю
    order.status = status;
    order.status_history.push({
      status: status,
      notes: statusNotes[status] || `Статус изменен на ${status}`,
      changed_at: new Date()
    });

    await order.save();

  res.json(mapOrderToResponse(order));

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Ошибка при обновлении статуса заказа' });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const { status, delivery_method, page = 1, limit = 20 } = req.query;
    const userRole = req.user.role;

    // Только админы могут видеть все заказы
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }

    const filter = {};
    if (status) filter.status = status;
    if (delivery_method) filter.delivery_method = delivery_method;

  const orders = await Order.find(filter)
    .sort({ created_at: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

    const total = await Order.countDocuments(filter);

    res.json({
      orders: orders.map(mapOrderToResponse),
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ error: 'Ошибка при получении заказов' });
  }
};