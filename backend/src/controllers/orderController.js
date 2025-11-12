import { Order } from '../models/Order.js';
import { Item } from '../models/Item.js';

const normalizeId = value => {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value;
  if (value.toString) return value.toString();
  return value;
};

// Нормализация старых статусов к новым
const normalizeStatus = (status) => {
  const statusMap = {
    'pending': 'created',
    'confirmed': 'created',
    'ready': 'ready_for_pickup',
    'delivering': 'in_transit',
    'delivered': 'completed',
  };
  return statusMap[status] || status;
};

const mapOrderToResponse = order => {
  const plain =
    typeof order.toObject === 'function'
      ? order.toObject({ getters: true })
      : order;

  // Нормализуем статус
  const normalizedStatus = normalizeStatus(plain.status);

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
    status: normalizedStatus,
    status_history: (plain.status_history || []).map(entry => ({
      _id: normalizeId(entry._id),
      status: normalizeStatus(entry.status),
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
      status: 'created',
      delivery_method: delivery_method,
      table_number: delivery_method === 'dine_in' ? table_number : null,
      delivery_address: delivery_method === 'delivery' ? delivery_address : null
    });

    await order.save();

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
    // admin, storeManager и canteenManager видят все заказы
    if (userRole !== 'admin' && userRole !== 'storeManager' && userRole !== 'canteenManager' && userRole !== 'cateenManager') {
      filter.user_id = userId;
    }

    // storeManager видит ТОЛЬКО заказы начиная с этапа 4 (in_transit) и далее
    // Буфет должен видеть только: in_transit, ready_for_pickup, completed (и старые: delivering, delivered)
    // НЕ видит: created, cooking, waiting_delivery, pending, confirmed
    if (userRole === 'storeManager') {
      filter.status = { $in: ['in_transit', 'ready_for_pickup', 'completed', 'delivering', 'delivered'] };
    }

    // canteenManager видит заказы с момента создания до момента отправки включительно (created, cooking, waiting_delivery, in_transit)
    // На этапе 5 (ready_for_pickup) столовая перестаёт видеть
    // НЕ видит: ready_for_pickup, completed, delivered
    if (userRole === 'canteenManager' || userRole === 'cateenManager') {
      filter.status = { $in: ['created', 'cooking', 'waiting_delivery', 'in_transit', 'pending', 'confirmed', 'delivering'] };
    }

  const orders = await Order.find(filter)
    .sort({ created_at: -1 });

  console.log(`getMyOrders: найдено ${orders.length} заказов для роли ${userRole}, фильтр:`, JSON.stringify(filter));

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
    // admin и storeManager могут видеть все заказы
    let filter = { _id: id };
    if (userRole !== 'admin' && userRole !== 'storeManager') {
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

    // admin и storeManager могут видеть все заказы
    let filter = { _id: id };
    if (userRole !== 'admin' && userRole !== 'storeManager') {
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

export const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userRole = req.user.role;

    // Только admin и storeManager могут редактировать заказы
    if (userRole !== 'admin' && userRole !== 'storeManager') {
      return res.status(403).json({ error: 'Недостаточно прав для редактирования заказа' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    // Обновляем поля заказа
    if (updateData.status !== undefined) {
      const validStatuses = ['created', 'cooking', 'waiting_delivery', 'in_transit', 'ready_for_pickup', 'completed', 'cancelled'];
      if (!validStatuses.includes(updateData.status)) {
        return res.status(400).json({ error: 'Неверный статус заказа' });
      }

      // Для storeManager можно только переходить к ready_for_pickup или completed
      if (userRole === 'storeManager') {
        if (!['ready_for_pickup', 'completed'].includes(updateData.status)) {
          return res.status(403).json({ error: 'Можно изменить только на "Готов к получению" или "Завершён"' });
        }
        if (updateData.status === 'ready_for_pickup' && order.status !== 'in_transit') {
          return res.status(400).json({ error: 'Можно установить "Готов к получению" только для заказов в статусе "В пути"' });
        }
        if (updateData.status === 'completed' && order.status !== 'ready_for_pickup') {
          return res.status(400).json({ error: 'Можно завершить только заказы в статусе "Готов к получению"' });
        }
      }

      const statusNotes = {
        created: 'Заказ создан',
        cooking: 'Столовая приняла заказ и приступила к нему',
        waiting_delivery: 'Столовая приготовила и ждёт доставщика',
        in_transit: 'Передан в доставку',
        ready_for_pickup: 'Готов к получению в буфете',
        completed: 'Пользователь забрал заказ',
        cancelled: 'Заказ отменен'
      };

      order.status = updateData.status;
      order.status_history.push({
        status: updateData.status,
        notes: statusNotes[updateData.status] || `Статус изменен на ${updateData.status}`,
        changed_at: new Date()
      });
    }

    if (updateData.delivery_method !== undefined) {
      order.delivery_method = updateData.delivery_method;
    }

    if (updateData.table_number !== undefined) {
      order.table_number = updateData.table_number;
    }

    if (updateData.delivery_address !== undefined) {
      order.delivery_address = updateData.delivery_address;
    }

    await order.save();

    res.json({
      message: 'Заказ успешно обновлен',
      order: mapOrderToResponse(order)
    });

  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ error: 'Ошибка при обновлении заказа' });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    // Проверяем, что пользователь аутентифицирован
    if (!req.user) {
      console.log('updateOrderStatus: пользователь не аутентифицирован');
      return res.status(401).json({ error: 'Требуется аутентификация' });
    }

    const { id } = req.params;
    const { status } = req.body;
    const userRole = req.user.role;

    console.log(`updateOrderStatus: запрос от пользователя с ролью "${userRole}", userId: ${req.user._id}, orderId: ${id}, newStatus: ${status}`);

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    // Определяем доступные статусы в зависимости от роли
    let allowedStatuses = [];
    let canChangeStatus = false;

    if (userRole === 'admin') {
      // Админ может менять на любой статус, включая отмену
      allowedStatuses = ['created', 'cooking', 'waiting_delivery', 'in_transit', 'ready_for_pickup', 'completed', 'cancelled'];
      canChangeStatus = true;
    } else if (userRole === 'user') {
      // Обычный пользователь может только отменить заказ в статусе created
      allowedStatuses = ['cancelled'];
      canChangeStatus = order.status === 'created';
    } else if (userRole === 'canteenManager' || userRole === 'cateenManager') {
      // Администратор столовой может менять статусы от cooking до in_transit (2-4)
      // Может переходить: created -> cooking -> waiting_delivery -> in_transit
      allowedStatuses = ['cooking', 'waiting_delivery', 'in_transit'];
      canChangeStatus = order.status === 'created' || 
                        order.status === 'cooking' || 
                        order.status === 'waiting_delivery' || 
                        order.status === 'in_transit';
    } else if (userRole === 'storeManager') {
      // Администратор буфета может менять статусы ready_for_pickup и completed (5-6)
      allowedStatuses = ['ready_for_pickup', 'completed'];
      canChangeStatus = order.status === 'in_transit' || order.status === 'ready_for_pickup';
    }

    if (!canChangeStatus) {
      return res.status(403).json({ error: 'Недостаточно прав для изменения статуса заказа' });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ 
        error: `Неверный статус заказа. Доступные статусы: ${allowedStatuses.join(', ')}` 
      });
    }

    // Проверка последовательности статусов только для canteenManager
    if (userRole === 'canteenManager' || userRole === 'cateenManager') {
      const statusOrder = {
        'created': 1,
        'cooking': 2,
        'waiting_delivery': 3,
        'in_transit': 4,
        'ready_for_pickup': 5,
        'completed': 6,
        'cancelled': 0
      };

      const currentStatusOrder = statusOrder[order.status] || 0;
      const newStatusOrder = statusOrder[status] || 0;

      // Для canteenManager можно только переходить вперед по порядку (2->3->4)
      if (newStatusOrder <= currentStatusOrder) {
        return res.status(400).json({ error: 'Можно переходить только к следующему статусу' });
      }
    }

    const statusNotes = {
      created: 'Заказ создан',
      cooking: 'Столовая приняла заказ и приступила к нему',
      waiting_delivery: 'Столовая приготовила и ждёт доставщика',
      in_transit: 'Передан в доставку',
      ready_for_pickup: 'Готов к получению в буфете',
      completed: 'Пользователь забрал заказ',
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
  console.log('=== getAllOrders ВЫЗВАН ===');
  console.log('req.method:', req.method);
  console.log('req.path:', req.path);
  console.log('req.user:', req.user ? { _id: req.user._id, role: req.user.role } : 'null');
  
  try {
    // Проверяем, что пользователь аутентифицирован
    if (!req.user) {
      console.log('getAllOrders: пользователь не аутентифицирован');
      return res.status(401).json({ error: 'Требуется аутентификация' });
    }

    const { status, delivery_method, page = 1, limit = 100 } = req.query;
    const userRole = req.user.role;

    console.log(`getAllOrders: запрос от пользователя с ролью "${userRole}", userId: ${req.user._id}`);
    console.log(`getAllOrders: проверка роли - admin: ${userRole === 'admin'}, storeManager: ${userRole === 'storeManager'}, canteenManager: ${userRole === 'canteenManager'}, cateenManager: ${userRole === 'cateenManager'}`);

    // admin, storeManager и canteenManager могут видеть заказы
    if (userRole !== 'admin' && userRole !== 'storeManager' && userRole !== 'canteenManager' && userRole !== 'cateenManager') {
      console.log(`getAllOrders: доступ запрещен для роли "${userRole}"`);
      return res.status(403).json({ error: 'Недостаточно прав' });
    }

    const filter = {};
    if (status) filter.status = status;
    if (delivery_method) filter.delivery_method = delivery_method;

    // storeManager видит ТОЛЬКО заказы начиная с этапа 4 (in_transit) и далее
    // Буфет должен видеть только: in_transit, ready_for_pickup, completed (и старые: delivering, delivered)
    // НЕ видит: created, cooking, waiting_delivery, pending, confirmed
    if (userRole === 'storeManager') {
      filter.status = { $in: ['in_transit', 'ready_for_pickup', 'completed', 'delivering', 'delivered'] };
    }

    // canteenManager видит заказы с момента создания до момента отправки включительно (created, cooking, waiting_delivery, in_transit)
    // На этапе 5 (ready_for_pickup) столовая перестаёт видеть
    // НЕ видит: ready_for_pickup, completed, delivered
    if (userRole === 'canteenManager' || userRole === 'cateenManager') {
      filter.status = { $in: ['created', 'cooking', 'waiting_delivery', 'in_transit', 'pending', 'confirmed', 'delivering'] };
    }

  const orders = await Order.find(filter)
    .sort({ created_at: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

    const total = await Order.countDocuments(filter);

    console.log(`getAllOrders: найдено ${orders.length} заказов для роли ${userRole}, всего в БД: ${total}`);

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