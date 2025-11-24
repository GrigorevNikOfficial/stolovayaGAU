// controllers/pointController.js
import { Point } from '../models/Point.js';
import { User } from '../models/User.js'; // НОВОЕ: импорт модели User

const mapPointToResponse = (point) => {
    return {
        _id: point._id,
        name: point.name,
        type: point.type,
        location: point.location,
        phone: point.phone,
        managerId: point.managerId,
        manager_info: point.managerId ? { // НОВОЕ: информация о менеджере
            _id: point.managerId._id,
            first_name: point.managerId.first_name,
            last_name: point.managerId.last_name,
            phone: point.managerId.phone,
            email: point.managerId.email
        } : null,
        isActive: point.isActive,
        created_at: point.createdAt,
        updated_at: point.updatedAt
    };
};

export const getPoints = async (req, res) => {
    try {
        const { type, active } = req.query;

        const filter = {};
        if (type) filter.type = type;
        if (active === 'true') filter.isActive = true;

        const points = await Point.find(filter)
            .populate('managerId', 'first_name last_name phone email') // НОВОЕ: заполняем информацию о менеджере
            .sort({ name: 1 });

        res.json({
            points: points.map(mapPointToResponse),
            total: points.length
        });

    } catch (error) {
        console.error('Get points error:', error);
        res.status(500).json({ error: 'Ошибка при получении точек' });
    }
};

export const getPointById = async (req, res) => {
    try {
        const point = await Point.findById(req.params.id)
            .populate('managerId', 'first_name last_name phone email'); // НОВОЕ: заполняем информацию о менеджере

        if (!point) {
            return res.status(404).json({ error: 'Точка не найдена' });
        }

        res.json(mapPointToResponse(point));

    } catch (error) {
        console.error('Get point by id error:', error);
        res.status(500).json({ error: 'Ошибка при получении точки' });
    }
};

export const getPointsByManager = async (req, res) => {
    try {
        const { managerId } = req.params;

        // НОВОЕ: проверяем существование пользователя
        const user = await User.findById(managerId);
        if (!user) {
            return res.status(404).json({ error: 'Менеджер не найден' });
        }

        const points = await Point.find({
            managerId: managerId,
            isActive: true
        })
            .populate('managerId', 'first_name last_name phone email')
            .sort({ name: 1 });

        res.json({
            points: points.map(mapPointToResponse),
            total: points.length
        });

    } catch (error) {
        console.error('Get points by manager error:', error);
        res.status(500).json({ error: 'Ошибка при получении точек менеджера' });
    }
};

export const createPoint = async (req, res) => {
    try {
        const {
            name,
            type,
            location,
            phone,
            managerId,
            isActive
        } = req.body;

        if (!name || !type || !location || !phone) {
            return res.status(400).json({
                error: 'Необходимо указать: name, type, location, phone'
            });
        }

        // НОВОЕ: если указан managerId, проверяем существование пользователя и его роль
        if (managerId) {
            const manager = await User.findById(managerId);
            if (!manager) {
                return res.status(400).json({ error: 'Указанный менеджер не найден' });
            }

            // Проверяем, что пользователь имеет соответствующую роль
            const allowedRoles = type === 'canteen'
                ? ['canteenManager', 'cateenManager', 'admin']
                : ['storeManager', 'admin'];

            if (!allowedRoles.includes(manager.role)) {
                return res.status(400).json({
                    error: `Указанный пользователь не может управлять ${type === 'canteen' ? 'столовой' : 'буфетом'}`
                });
            }
        }

        const point = new Point({
            name,
            type,
            location,
            phone,
            managerId: managerId || null, // НОВОЕ: может быть null
            isActive: isActive !== undefined ? isActive : true
        });

        await point.save();

        // НОВОЕ: заполняем информацию о менеджере
        await point.populate('managerId', 'first_name last_name phone email');

        res.status(201).json({
            message: 'Точка успешно создана',
            point: mapPointToResponse(point)
        });

    } catch (error) {
        console.error('Create point error:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: 'Некорректные данные точки' });
        }
        res.status(500).json({ error: 'Ошибка при создании точки' });
    }
};

export const updatePoint = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // НОВОЕ: если обновляется managerId, проверяем пользователя
        if (updateData.managerId) {
            const manager = await User.findById(updateData.managerId);
            if (!manager) {
                return res.status(400).json({ error: 'Указанный менеджер не найден' });
            }

            // Определяем тип точки для проверки роли
            let pointType = updateData.type;
            if (!pointType) {
                const existingPoint = await Point.findById(id);
                pointType = existingPoint.type;
            }

            const allowedRoles = pointType === 'canteen'
                ? ['canteenManager', 'cateenManager', 'admin']
                : ['storeManager', 'admin'];

            if (!allowedRoles.includes(manager.role)) {
                return res.status(400).json({
                    error: `Указанный пользователь не может управлять ${pointType === 'canteen' ? 'столовой' : 'буфетом'}`
                });
            }
        }

        const point = await Point.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('managerId', 'first_name last_name phone email'); // НОВОЕ: заполняем информацию о менеджере

        if (!point) {
            return res.status(404).json({ error: 'Точка не найдена' });
        }

        res.json({
            message: 'Точка успешно обновлена',
            point: mapPointToResponse(point)
        });

    } catch (error) {
        console.error('Update point error:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: 'Некорректные данные точки' });
        }
        res.status(500).json({ error: 'Ошибка при обновлении точки' });
    }
};

export const deletePoint = async (req, res) => {
    try {
        const { id } = req.params;

        // НОВОЕ: проверяем, есть ли связанные записи в stock
        const { Stock } = await import('../models/Stock.js');
        const stockCount = await Stock.countDocuments({ pointId: id });

        if (stockCount > 0) {
            return res.status(400).json({
                error: 'Невозможно удалить точку: есть связанные товары на складе'
            });
        }

        const point = await Point.findByIdAndDelete(id);
        if (!point) {
            return res.status(404).json({ error: 'Точка не найдена' });
        }

        res.json({
            message: 'Точка успешно удалена'
        });

    } catch (error) {
        console.error('Delete point error:', error);
        res.status(500).json({ error: 'Ошибка при удалении точки' });
    }
};

// НОВЫЙ МЕТОД: Получить точки без менеджера
export const getPointsWithoutManager = async (req, res) => {
    try {
        const { type } = req.query;

        const filter = {
            managerId: { $exists: false },
            isActive: true
        };

        if (type) filter.type = type;

        const points = await Point.find(filter).sort({ name: 1 });

        res.json({
            points: points.map(mapPointToResponse),
            total: points.length
        });

    } catch (error) {
        console.error('Get points without manager error:', error);
        res.status(500).json({ error: 'Ошибка при получении точек без менеджера' });
    }
};