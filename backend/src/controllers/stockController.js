import { Stock } from '../models/Stock.js';
import { Item } from '../models/Item.js';
import { Point } from '../models/Point.js';

const mapStockToResponse = (stock) => {
    return {
        _id: stock._id,
        pointId: stock.pointId,
        productId: stock.productId,
        quantity: stock.quantity,
        reserved: stock.reserved,
        available: stock.available,
        lastUpdated: stock.updatedAt
    };
};

const mapStockWithDetails = (stock) => {
    return {
        _id: stock._id,
        pointId: stock.pointId,
        productId: stock.productId,
        quantity: stock.quantity,
        reserved: stock.reserved,
        available: stock.available,
        lastUpdated: stock.updatedAt,
        product: stock.productId ? {
            _id: stock.productId._id,
            name: stock.productId.name,
            price: stock.productId.price,
            image: stock.productId.image
        } : undefined,
        point: stock.pointId ? {
            _id: stock.pointId._id,
            name: stock.pointId.name,
            type: stock.pointId.type
        } : undefined
    };
};

export const getStock = async (req, res) => {
    try {
        const { pointId } = req.query;

        const filter = {};
        if (pointId) filter.pointId = pointId;

        const stock = await Stock.find(filter).sort({ updatedAt: -1 });

        res.json({
            stock: stock.map(mapStockToResponse),
            total: stock.length
        });

    } catch (error) {
        console.error('Get stock error:', error);
        res.status(500).json({ error: 'Ошибка при получении склада' });
    }
};

export const getStockWithDetails = async (req, res) => {
    try {
        const { pointId } = req.query;

        const filter = {};
        if (pointId) filter.pointId = pointId;

        const stock = await Stock.find(filter)
            .populate('productId', 'name price image')
            .populate('pointId', 'name type')
            .sort({ updatedAt: -1 });

        res.json({
            stock: stock.map(mapStockWithDetails),
            total: stock.length
        });

    } catch (error) {
        console.error('Get stock with details error:', error);
        res.status(500).json({ error: 'Ошибка при получении склада с деталями' });
    }
};

export const getStockByPoint = async (req, res) => {
    try {
        const { pointId } = req.params;

        const stock = await Stock.find({ pointId })
            .populate('productId', 'name price image category_slug is_available')
            .sort({ 'productId.name': 1 });

        res.json({
            stock: stock.map(mapStockWithDetails),
            total: stock.length
        });

    } catch (error) {
        console.error('Get stock by point error:', error);
        res.status(500).json({ error: 'Ошибка при получении склада точки' });
    }
};

export const getStockByProduct = async (req, res) => {
    try {
        const { productId } = req.params;

        const stock = await Stock.find({ productId })
            .populate('pointId', 'name type location')
            .sort({ 'pointId.name': 1 });

        res.json({
            stock: stock.map(mapStockWithDetails),
            total: stock.length
        });

    } catch (error) {
        console.error('Get stock by product error:', error);
        res.status(500).json({ error: 'Ошибка при получении склада товара' });
    }
};

export const getStockItem = async (req, res) => {
    try {
        const stock = await Stock.findById(req.params.id);

        if (!stock) {
            return res.status(404).json({ error: 'Запись склада не найдена' });
        }

        res.json(mapStockToResponse(stock));

    } catch (error) {
        console.error('Get stock item error:', error);
        res.status(500).json({ error: 'Ошибка при получении записи склада' });
    }
};

export const getStockByPointAndProduct = async (req, res) => {
    try {
        const { pointId, productId } = req.params;

        const stock = await Stock.findOne({ pointId, productId });

        if (!stock) {
            return res.status(404).json({ error: 'Запись склада не найдена' });
        }

        res.json(mapStockToResponse(stock));

    } catch (error) {
        console.error('Get stock by point and product error:', error);
        res.status(500).json({ error: 'Ошибка при получении записи склада' });
    }
};

export const createStock = async (req, res) => {
    try {
        const {
            pointId,
            productId,
            quantity,
            reserved
        } = req.body;

        if (!pointId || !productId || quantity === undefined) {
            return res.status(400).json({
                error: 'Необходимо указать: pointId, productId, quantity'
            });
        }

        // Проверяем существование точки и товара
        const [point, product] = await Promise.all([
            Point.findById(pointId),
            Item.findById(productId)
        ]);

        if (!point) {
            return res.status(404).json({ error: 'Точка не найдена' });
        }
        if (!product) {
            return res.status(404).json({ error: 'Товар не найден' });
        }

        const stock = new Stock({
            pointId,
            productId,
            quantity: quantity || 0,
            reserved: reserved || 0
        });

        await stock.save();

        res.status(201).json({
            message: 'Товар успешно добавлен на склад',
            stock: mapStockToResponse(stock)
        });

    } catch (error) {
        console.error('Create stock error:', error);
        if (error.code === 11000) {
            return res.status(409).json({
                error: 'Товар уже существует на складе этой точки'
            });
        }
        res.status(500).json({ error: 'Ошибка при добавлении товара на склад' });
    }
};

export const updateStock = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const stock = await Stock.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!stock) {
            return res.status(404).json({ error: 'Запись склада не найдена' });
        }

        res.json({
            message: 'Склад успешно обновлен',
            stock: mapStockToResponse(stock)
        });

    } catch (error) {
        console.error('Update stock error:', error);
        res.status(500).json({ error: 'Ошибка при обновлении склада' });
    }
};

export const deleteStock = async (req, res) => {
    try {
        const { id } = req.params;

        const stock = await Stock.findByIdAndDelete(id);
        if (!stock) {
            return res.status(404).json({ error: 'Запись склада не найдена' });
        }

        res.json({
            message: 'Товар успешно удален со склада'
        });

    } catch (error) {
        console.error('Delete stock error:', error);
        res.status(500).json({ error: 'Ошибка при удалении товара со склада' });
    }
};

export const reserveStock = async (req, res) => {
    try {
        const { pointId, productId, quantity } = req.body;

        if (!pointId || !productId || !quantity || quantity <= 0) {
            return res.status(400).json({
                error: 'Необходимо указать: pointId, productId, quantity (положительное число)'
            });
        }

        const stock = await Stock.findOne({ pointId, productId });

        if (!stock) {
            return res.status(404).json({ error: 'Товар не найден на складе' });
        }

        if (stock.available < quantity) {
            return res.status(400).json({
                error: 'Недостаточно товара на складе'
            });
        }

        stock.reserved += quantity;
        await stock.save();

        res.json({
            message: 'Товар успешно зарезервирован',
            stock: mapStockToResponse(stock)
        });

    } catch (error) {
        console.error('Reserve stock error:', error);
        res.status(500).json({ error: 'Ошибка при резервировании товара' });
    }
};

export const releaseStock = async (req, res) => {
    try {
        const { pointId, productId, quantity } = req.body;

        if (!pointId || !productId || !quantity || quantity <= 0) {
            return res.status(400).json({
                error: 'Необходимо указать: pointId, productId, quantity (положительное число)'
            });
        }

        const stock = await Stock.findOne({ pointId, productId });

        if (!stock) {
            return res.status(404).json({ error: 'Товар не найден на складе' });
        }

        if (stock.reserved < quantity) {
            return res.status(400).json({
                error: 'Нельзя освободить больше чем зарезервировано'
            });
        }

        stock.reserved -= quantity;
        await stock.save();

        res.json({
            message: 'Резерв товара успешно снят',
            stock: mapStockToResponse(stock)
        });

    } catch (error) {
        console.error('Release stock error:', error);
        res.status(500).json({ error: 'Ошибка при снятии резерва товара' });
    }
};

export const updateStockQuantity = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;

        if (quantity === undefined || quantity < 0) {
            return res.status(400).json({
                error: 'Необходимо указать quantity (неотрицательное число)'
            });
        }

        const stock = await Stock.findByIdAndUpdate(
            id,
            { quantity },
            { new: true, runValidators: true }
        );

        if (!stock) {
            return res.status(404).json({ error: 'Запись склада не найдена' });
        }

        res.json({
            message: 'Количество товара успешно обновлено',
            stock: mapStockToResponse(stock)
        });

    } catch (error) {
        console.error('Update stock quantity error:', error);
        res.status(500).json({ error: 'Ошибка при обновлении количества товара' });
    }
};