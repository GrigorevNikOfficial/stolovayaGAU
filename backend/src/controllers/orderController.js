// controllers/orderController.js
import { Item } from "../models/Item.js";
import { Order } from "../models/Order.js";
import { Settings } from "../models/Settings.js";
import { User } from "../models/User.js";
import { Stock } from "../models/Stock.js";
import { Point } from "../models/Point.js";

const normalizeId = (value) => {
    if (!value) return undefined;
    if (typeof value === "string") return value;
    if (value instanceof Date) return value;
    if (value.toString) return value.toString();
    return value;
};

// Нормализация старых статусов к новым
const normalizeStatus = (status) => {
    const statusMap = {
        pending: "created",
        confirmed: "created",
        ready: "ready_for_pickup",
        delivering: "in_transit",
        delivered: "completed",
    };
    return statusMap[status] || status;
};

const mapOrderToResponse = (order) => {
    const plain =
        typeof order.toObject === "function"
            ? order.toObject({ getters: true })
            : order;

    // Нормализуем статус
    const normalizedStatus = normalizeStatus(plain.status);

    return {
        _id: normalizeId(plain._id),
        order_number: plain.order_number,
        user_id: normalizeId(plain.user_id?._id ?? plain.user_id),
        user_info: plain.user_info || null,
        point_id: normalizeId(plain.point_id?._id ?? plain.point_id),
        point_info: plain.point_info || null,
        items: (plain.items || []).map((item) => ({
            _id: normalizeId(item._id),
            stock_id: normalizeId(item.stock_id),
            item_id: normalizeId(item.item_id),
            uniq_nom: item.uniq_nom,
            name: item.name,
            quantity: item.quantity,
            price_at_time: item.price_at_time,
            price: item.price_at_time,
        })),
        items_total: plain.items_total,
        service_fee: plain.service_fee,
        service_fee_type: plain.service_fee_type,
        service_fee_value: plain.service_fee_value,
        total_amount: plain.total_amount,
        status: normalizedStatus,
        status_history: (plain.status_history || []).map((entry) => ({
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

const refundOrderAmount = async (order) => {
    const refundAmount = order.total_amount || 0;
    if (refundAmount <= 0) {
        return null;
    }

    const updatedUser = await User.findByIdAndUpdate(
        order.user_id,
        { $inc: { balance: refundAmount } },
        { new: true }
    ).select("-password");

    if (!updatedUser) {
        throw new Error("Пользователь для возврата средств не найден");
    }

    return updatedUser.balance ?? 0;
};

// Функция для освобождения резерва товаров
const releaseStockReservation = async (items) => {
    try {
        console.log('Releasing stock reservation for items:', items.length);
        for (const item of items) {
            const result = await Stock.findByIdAndUpdate(
                item.stock_id,
                { $inc: { reserved: -item.quantity } },
                { new: true }
            );
            console.log(`Released ${item.quantity} from stock ${item.stock_id}, new reserved: ${result.reserved}`);
        }
        console.log('Stock reservation released successfully');
    } catch (error) {
        console.error('Error releasing stock reservation:', error);
        throw error;
    }
};

// Функция для резервирования товаров при создании заказа
const reserveStockItems = async (items, pointId) => {
    try {
        console.log('Reserving stock items:', items.length);

        const reservedItems = [];

        for (const item of items) {
            console.log('Processing item for reservation:', item);

            // Находим stock запись
            const stock = await Stock.findOne({
                _id: item.stock_id,
                pointId: pointId
            }).populate('productId');

            if (!stock) {
                throw new Error(`Товар с ID ${item.stock_id} не найден на складе точки`);
            }

            if (!stock.productId) {
                throw new Error(`Информация о товаре для stock ${item.stock_id} не найдена`);
            }

            // Проверяем доступное количество
            const available = stock.quantity - stock.reserved;
            if (available < item.quantity) {
                throw new Error(`Недостаточно товара "${stock.productId.name}". Доступно: ${available}, запрошено: ${item.quantity}`);
            }

            // РЕЗЕРВИРУЕМ товар
            const updatedStock = await Stock.findByIdAndUpdate(
                item.stock_id,
                { $inc: { reserved: item.quantity } },
                { new: true }
            );

            console.log(`Reserved ${item.quantity} of ${stock.productId.name}, new reserved: ${updatedStock.reserved}`);

            reservedItems.push({
                stock_id: item.stock_id,
                item_id: stock.productId._id,
                uniq_nom: stock.productId.uniq_nom,
                name: stock.productId.name,
                quantity: item.quantity,
                price_at_time: stock.productId.price,
                product: stock.productId
            });
        }

        console.log('Stock reservation completed successfully');
        return reservedItems;
    } catch (error) {
        console.error('Error in reserveStockItems:', error);

        // Откатываем резервирование в случае ошибки
        if (reservedItems.length > 0) {
            try {
                await releaseStockReservation(reservedItems);
            } catch (rollbackError) {
                console.error('Error rolling back stock reservation:', rollbackError);
            }
        }

        throw error;
    }
};

// Функция для списания товаров (при завершении заказа)
const deductStockQuantity = async (order) => {
    try {
        console.log('Deducting stock for order:', order._id);

        for (const item of order.items) {
            const result = await Stock.findByIdAndUpdate(
                item.stock_id,
                {
                    $inc: {
                        quantity: -item.quantity,
                        reserved: -item.quantity
                    }
                },
                { new: true }
            );

            console.log(`Deducted ${item.quantity} from stock ${item.stock_id}, new quantity: ${result.quantity}, new reserved: ${result.reserved}`);
        }

        console.log('Stock deduction completed for order:', order._id);
    } catch (error) {
        console.error('Error deducting stock quantity:', error);
        throw error;
    }
};

export const createOrder = async (req, res) => {
    let reservedItems = [];

    try {
        console.log('=== CREATE ORDER STARTED ===');
        console.log('Request body:', JSON.stringify(req.body, null, 2));

        const {
            items,
            delivery_method = "pickup",
            table_number,
            delivery_address,
            point_id
        } = req.body;
        const userId = req.user._id;

        // Валидация
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: "Корзина пуста" });
        }

        if (!point_id) {
            return res.status(400).json({ error: "Не указана точка заказа" });
        }

        // Проверяем точку
        const point = await Point.findById(point_id);
        if (!point) {
            return res.status(400).json({ error: "Указанная точка не найдена" });
        }

        // РЕЗЕРВИРУЕМ ТОВАРЫ
        reservedItems = await reserveStockItems(items, point_id);

        let totalAmount = 0;
        const orderItems = reservedItems.map(item => {
            const itemTotal = item.price_at_time * item.quantity;
            totalAmount += itemTotal;

            return {
                stock_id: item.stock_id,
                item_id: item.item_id,
                uniq_nom: item.uniq_nom,
                name: item.name,
                quantity: item.quantity,
                price_at_time: item.price_at_time,
            };
        });

        console.log('Total amount:', totalAmount);

        // Получаем настройки
        let settings = await Settings.findOne({ name: 'main' });
        if (!settings) {
            settings = await Settings.create({ name: 'main' });
        }

        // Применяем сервисный сбор
        let serviceFee = 0;
        let serviceFeeType = 'none';
        let serviceFeeValue = 0;
        const configuredFeeValue = Number(settings.serviceFeeValue) || 0;
        if (configuredFeeValue > 0) {
            serviceFeeType = settings.serviceFeeType === 'fixed' ? 'fixed' : 'percent';
            serviceFeeValue = configuredFeeValue;
            if (serviceFeeType === 'percent') {
                serviceFee = (totalAmount * configuredFeeValue) / 100;
            } else {
                serviceFee = configuredFeeValue;
            }
            serviceFee = Math.round(serviceFee * 100) / 100;
        }

        const finalAmount = totalAmount + serviceFee;

        console.log('Final amount:', finalAmount);

        // Генерируем номер заказа
        const orderNumber = await Order.generateOrderNumber();
        console.log('Generated order number:', orderNumber);

        // Проверяем баланс пользователя
        const updatedUser = await User.findOneAndUpdate(
            { _id: userId, balance: { $gte: finalAmount } },
            { $inc: { balance: -finalAmount } },
            { new: true }
        ).select("-password");

        if (!updatedUser) {
            // Освобождаем резерв если недостаточно средств
            await releaseStockReservation(reservedItems);
            return res.status(400).json({ error: "Недостаточно средств на балансе" });
        }

        console.log('User balance after deduction:', updatedUser.balance);

        // Создаем заказ
        const order = new Order({
            order_number: orderNumber,
            user_id: userId,
            user_info: {
                first_name: updatedUser.first_name,
                last_name: updatedUser.last_name,
                phone: updatedUser.phone,
                email: updatedUser.email,
            },
            point_id: point_id,
            point_info: {
                name: point.name,
                type: point.type,
                location: point.location
            },
            items: orderItems,
            items_total: totalAmount,
            service_fee: serviceFee,
            service_fee_type: serviceFeeType,
            service_fee_value: serviceFeeValue,
            total_amount: finalAmount,
            status: "created",
            delivery_method: delivery_method,
            table_number: delivery_method === "dine_in" ? table_number : null,
            delivery_address: delivery_method === "delivery" ? delivery_address : null,
            status_history: [{
                status: "created",
                notes: "Заказ создан",
                changed_at: new Date()
            }]
        });

        console.log('Order object before save:', JSON.stringify(order, null, 2));

        await order.save();
        console.log('Order saved successfully');

        res.status(201).json({
            message: "Заказ успешно создан",
            order: mapOrderToResponse(order),
            order_number: orderNumber,
            balance: updatedUser.balance,
        });

    } catch (error) {
        console.error("Create order error:", error);

        // В случае ошибки отменяем резервирование
        if (reservedItems.length > 0) {
            try {
                await releaseStockReservation(reservedItems);
                console.log('Stock reservation rolled back due to error');
            } catch (rollbackError) {
                console.error('Error rolling back stock reservation:', rollbackError);
            }
        }

        res.status(500).json({ error: error.message || "Ошибка при создании заказа" });
    }
};

export const getMyOrders = async (req, res) => {
    try {
        const userId = req.user._id;
        const userRole = req.user.role;

        let filter = {};
        // admin, storeManager и canteenManager видят все заказы
        if (
            userRole !== "admin" &&
            userRole !== "storeManager" &&
            userRole !== "canteenManager" &&
            userRole !== "cateenManager"
        ) {
            filter.user_id = userId;
        }

        // storeManager видит ТОЛЬКО заказы начиная с этапа 4 (in_transit) и далее
        if (userRole === "storeManager") {
            filter.status = {
                $in: [
                    "in_transit",
                    "ready_for_pickup",
                    "completed",
                    "delivering",
                    "delivered",
                ],
            };
        }

        // canteenManager видит заказы с момента создания до момента отправки включительно
        if (userRole === "canteenManager" || userRole === "cateenManager") {
            filter.status = {
                $in: [
                    "created",
                    "cooking",
                    "waiting_delivery",
                    "in_transit",
                    "pending",
                    "confirmed",
                    "delivering",
                ],
            };
        }

        const orders = await Order.find(filter)
            .populate('point_id', 'name type location')
            .sort({ created_at: -1 });

        console.log(
            `getMyOrders: найдено ${orders.length} заказов для роли ${userRole}, фильтр:`,
            JSON.stringify(filter)
        );

        res.json({ orders: orders.map(mapOrderToResponse) });
    } catch (error) {
        console.error("Get orders error:", error);
        res.status(500).json({ error: "Ошибка при получении заказов" });
    }
};

export const getOrderHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const userRole = req.user.role;

        // Проверяем доступ к заказу
        let filter = { _id: id };
        if (userRole !== "admin" && userRole !== "storeManager") {
            filter.user_id = userId;
        }

        const order = await Order.findOne(filter);
        if (!order) {
            return res.status(404).json({ error: "Заказ не найден" });
        }

        res.json({ history: order.status_history });
    } catch (error) {
        console.error("Get order history error:", error);
        res.status(500).json({ error: "Ошибка при получении истории заказа" });
    }
};

export const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const userRole = req.user.role;

        // admin и storeManager могут видеть все заказы
        let filter = { _id: id };
        if (userRole !== "admin" && userRole !== "storeManager") {
            filter.user_id = userId;
        }

        const order = await Order.findOne(filter)
            .populate('point_id', 'name type location phone');

        if (!order) {
            return res.status(404).json({ error: "Заказ не найден" });
        }

        const mappedOrder = mapOrderToResponse(order);

        res.json({
            order: mappedOrder,
            items: mappedOrder.items,
            history: mappedOrder.status_history,
        });
    } catch (error) {
        console.error("Get order error:", error);
        res.status(500).json({ error: "Ошибка при получении заказа" });
    }
};

export const updateOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const userRole = req.user.role;

        // Только admin и storeManager могут редактировать заказы
        if (userRole !== "admin" && userRole !== "storeManager") {
            return res
                .status(403)
                .json({ error: "Недостаточно прав для редактирования заказа" });
        }

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ error: "Заказ не найден" });
        }

        const originalStatus = order.status;

        // Обновляем поля заказа
        if (updateData.status !== undefined) {
            const validStatuses = [
                "created",
                "cooking",
                "waiting_delivery",
                "in_transit",
                "ready_for_pickup",
                "completed",
                "cancelled",
            ];
            if (!validStatuses.includes(updateData.status)) {
                return res.status(400).json({ error: "Неверный статус заказа" });
            }

            // Для storeManager можно только переходить к ready_for_pickup или completed
            if (userRole === "storeManager") {
                if (!["ready_for_pickup", "completed"].includes(updateData.status)) {
                    return res.status(403).json({
                        error: 'Можно изменить только на "Готов к получению" или "Завершён"',
                    });
                }
                if (
                    updateData.status === "ready_for_pickup" &&
                    order.status !== "in_transit"
                ) {
                    return res.status(400).json({
                        error: 'Можно установить "Готов к получению" только для заказов в статусе "В пути"',
                    });
                }
                if (
                    updateData.status === "completed" &&
                    order.status !== "ready_for_pickup"
                ) {
                    return res.status(400).json({
                        error: 'Можно завершить только заказы в статусе "Готов к получению"',
                    });
                }
            }

            const statusNotes = {
                created: "Заказ создан",
                cooking: "Столовая приняла заказ и приступила к нему",
                waiting_delivery: "Столовая приготовила и ждёт доставщика",
                in_transit: "Передан в доставку",
                ready_for_pickup: "Готов к получению в буфете",
                completed: "Пользователь забрал заказ",
                cancelled: "Заказ отменен",
            };

            if (updateData.status === "cancelled" && originalStatus === "completed") {
                return res
                    .status(400)
                    .json({ error: "Нельзя отменить уже выполненный заказ" });
            }

            order.status = updateData.status;
            order.status_history.push({
                status: updateData.status,
                notes: statusNotes[updateData.status] || `Статус изменен на ${updateData.status}`,
                changed_at: new Date(),
            });

            // При завершении заказа списываем товары
            if (updateData.status === "completed" && originalStatus !== "completed") {
                await deductStockQuantity(order);
            }

            // При отмене освобождаем резерв
            if (updateData.status === "cancelled" && originalStatus !== "cancelled") {
                await releaseStockReservation(order.items);
            }
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

        if (updateData.point_id !== undefined) {
            const point = await Point.findById(updateData.point_id);
            if (point) {
                order.point_id = point._id;
                order.point_info = {
                    name: point.name,
                    type: point.type,
                    location: point.location
                };
            }
        }

        await order.save();

        let refundedBalance = null;
        if (updateData.status === "cancelled" && originalStatus !== "cancelled") {
            refundedBalance = await refundOrderAmount(order);
        }

        res.json({
            message: "Заказ успешно обновлен",
            order: mapOrderToResponse(order),
            balance: refundedBalance,
        });
    } catch (error) {
        console.error("Update order error:", error);
        res.status(500).json({ error: "Ошибка при обновлении заказа" });
    }
};

export const updateOrderStatus = async (req, res) => {
    try {
        if (!req.user) {
            console.log("updateOrderStatus: пользователь не аутентифицирован");
            return res.status(401).json({ error: "Требуется аутентификация" });
        }

        const { id } = req.params;
        const { status } = req.body;
        const userRole = req.user.role;

        console.log(
            `updateOrderStatus: запрос от пользователя с ролью "${userRole}", userId: ${req.user._id}, orderId: ${id}, newStatus: ${status}`
        );

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ error: "Заказ не найден" });
        }

        const originalStatus = order.status;

        // Определяем доступные статусы в зависимости от роли
        let allowedStatuses = [];
        let canChangeStatus = false;

        if (userRole === "admin") {
            allowedStatuses = [
                "created",
                "cooking",
                "waiting_delivery",
                "in_transit",
                "ready_for_pickup",
                "completed",
                "cancelled",
            ];
            canChangeStatus = true;
        } else if (userRole === "user") {
            allowedStatuses = ["cancelled"];
            canChangeStatus = order.status === "created";
        } else if (userRole === "canteenManager" || userRole === "cateenManager") {
            allowedStatuses = ["cooking", "waiting_delivery", "in_transit"];
            canChangeStatus =
                order.status === "created" ||
                order.status === "cooking" ||
                order.status === "waiting_delivery" ||
                order.status === "in_transit";
        } else if (userRole === "storeManager") {
            allowedStatuses = ["ready_for_pickup", "completed"];
            canChangeStatus =
                order.status === "in_transit" || order.status === "ready_for_pickup";
        }

        if (!canChangeStatus) {
            return res
                .status(403)
                .json({ error: "Недостаточно прав для изменения статуса заказа" });
        }

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                error: `Неверный статус заказа. Доступные статусы: ${allowedStatuses.join(", ")}`,
            });
        }

        // Проверка последовательности статусов только для canteenManager
        if (userRole === "canteenManager" || userRole === "cateenManager") {
            const statusOrder = {
                created: 1,
                cooking: 2,
                waiting_delivery: 3,
                in_transit: 4,
                ready_for_pickup: 5,
                completed: 6,
                cancelled: 0,
            };

            const currentStatusOrder = statusOrder[order.status] || 0;
            const newStatusOrder = statusOrder[status] || 0;

            if (newStatusOrder <= currentStatusOrder) {
                return res
                    .status(400)
                    .json({ error: "Можно переходить только к следующему статусу" });
            }
        }

        const statusNotes = {
            created: "Заказ создан",
            cooking: "Столовая приняла заказ и приступила к нему",
            waiting_delivery: "Столовая приготовила и ждёт доставщика",
            in_transit: "Передан в доставку",
            ready_for_pickup: "Готов к получению в буфете",
            completed: "Пользователь забрал заказ",
            cancelled: "Заказ отменен",
        };

        if (status === "cancelled" && originalStatus === "completed") {
            return res
                .status(400)
                .json({ error: "Нельзя отменить уже выполненный заказ" });
        }

        order.status = status;
        order.status_history.push({
            status: status,
            notes: statusNotes[status] || `Статус изменен на ${status}`,
            changed_at: new Date(),
        });

        // При завершении заказа списываем товары
        if (status === "completed" && originalStatus !== "completed") {
            await deductStockQuantity(order);
        }

        // При отмене освобождаем резерв
        if (status === "cancelled" && originalStatus !== "cancelled") {
            await releaseStockReservation(order.items);
        }

        await order.save();

        let refundedBalance = null;
        if (status === "cancelled" && originalStatus !== "cancelled") {
            refundedBalance = await refundOrderAmount(order);
        }

        res.json({
            order: mapOrderToResponse(order),
            balance: refundedBalance,
        });
    } catch (error) {
        console.error("Update order status error:", error);
        res.status(500).json({ error: "Ошибка при обновлении статуса заказа" });
    }
};

export const getAllOrders = async (req, res) => {
    console.log("=== getAllOrders ВЫЗВАН ===");
    console.log("req.method:", req.method);
    console.log("req.path:", req.path);
    console.log(
        "req.user:",
        req.user ? { _id: req.user._id, role: req.user.role } : "null"
    );

    try {
        if (!req.user) {
            console.log("getAllOrders: пользователь не аутентифицирован");
            return res.status(401).json({ error: "Требуется аутентификация" });
        }

        const { status, delivery_method, page = 1, limit = 100 } = req.query;
        const userRole = req.user.role;

        console.log(
            `getAllOrders: запрос от пользователя с ролью "${userRole}", userId: ${req.user._id}`
        );

        // admin, storeManager и canteenManager могут видеть заказы
        if (
            userRole !== "admin" &&
            userRole !== "storeManager" &&
            userRole !== "canteenManager" &&
            userRole !== "cateenManager"
        ) {
            console.log(`getAllOrders: доступ запрещен для роли "${userRole}"`);
            return res.status(403).json({ error: "Недостаточно прав" });
        }

        const filter = {};
        if (status) filter.status = status;
        if (delivery_method) filter.delivery_method = delivery_method;

        // storeManager видит ТОЛЬКО заказы начиная с этапа 4 (in_transit) и далее
        if (userRole === "storeManager") {
            filter.status = {
                $in: [
                    "in_transit",
                    "ready_for_pickup",
                    "completed",
                    "delivering",
                    "delivered",
                ],
            };
        }

        // canteenManager видит заказы с момента создания до момента отправки включительно
        if (userRole === "canteenManager" || userRole === "cateenManager") {
            filter.status = {
                $in: [
                    "created",
                    "cooking",
                    "waiting_delivery",
                    "in_transit",
                    "pending",
                    "confirmed",
                    "delivering",
                ],
            };
        }

        const orders = await Order.find(filter)
            .populate('point_id', 'name type location')
            .sort({ created_at: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Order.countDocuments(filter);

        console.log(
            `getAllOrders: найдено ${orders.length} заказов для роли ${userRole}, всего в БД: ${total}`
        );

        res.json({
            orders: orders.map(mapOrderToResponse),
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total,
        });
    } catch (error) {
        console.error("Get all orders error:", error);
        res.status(500).json({ error: "Ошибка при получении заказов" });
    }
};