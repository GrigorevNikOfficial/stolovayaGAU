import { Item } from '../models/Item.js';
import { S3_FOLDERS } from '../config/storage.js';
import {
    buildPublicUrl,
    DEFAULT_ITEM_PICTURE_KEY,
    deleteObject,
    StorageServiceError,
    uploadImage
} from '../services/storageService.js';

const mapItemToResponse = (item) => {
    const imageKey = item?.image?.key || DEFAULT_ITEM_PICTURE_KEY;

    return {
        _id: item._id,
        uniq_nom: item.uniq_nom,
        name: item.name,
        description: item.description,
        price: item.price,
        category_slug: item.category_slug,
        calories: item.calories,
        number_pribors: item.number_pribors,
        is_available: item.is_available,
        ingredients: item.ingredients,
        allergens: item.allergens,
        preparation_time: item.preparation_time,
        nutrition: item.nutrition,
        sort_order: item.sort_order,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        image: {
            key: imageKey,
            url: buildPublicUrl(imageKey)
        }
    };
};

export const getItems = async (req, res) => {
    try {
        const { category_slug, available } = req.query;

        console.log('Query params:', { category_slug, available });

        const filter = {};
        if (category_slug) filter.category_slug = category_slug;
        if (available === 'true') filter.is_available = true;

        console.log('MongoDB filter:', filter);

        const items = await Item.find(filter).sort({ category_slug: 1, name: 1 });

        console.log('Items found in DB:', items.length);

        res.json({
            items: items.map(mapItemToResponse),
            total: items.length
        });

    } catch (error) {
        console.error('Get items error:', error);
        res.status(500).json({ error: 'Ошибка при получении блюд' });
    }
};

export const getItemById = async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);

        if (!item) {
            return res.status(404).json({ error: 'Блюдо не найдено' });
        }

    res.json(mapItemToResponse(item));

    } catch (error) {
        console.error('Get item by id error:', error);
        res.status(500).json({ error: 'Ошибка при получении блюда' });
    }
};

export const getItemsByCategory = async (req, res) => {
    try {
        const { category_slug } = req.params;

        const items = await Item.find({
            category_slug: category_slug,
            is_available: true
        }).sort({ name: 1 });

        res.json({
            category: category_slug,
            items: items.map(mapItemToResponse),
            total: items.length
        });

    } catch (error) {
        console.error('Get items by category error:', error);
        res.status(500).json({ error: 'Ошибка при получении блюд по категории' });
    }
};

export const createItem = async (req, res) => {
    try {
        const {
            uniq_nom,
            name,
            description,
            price,
            category_slug,
            calories,  // ← ИЗМЕНИТЕ cal на calories
            number_pribors,
            is_available,
            ingredients,
            allergens,
            preparation_time,
            nutrition,
            sort_order
        } = req.body;

        if (!uniq_nom || !name || !description || !price || !category_slug) {
            return res.status(400).json({ error: 'Необходимо указать: uniq_nom, name, description, price, category_slug' });
        }

        const item = new Item({
            uniq_nom,
            name,
            description,
            price,
            category_slug,
            calories: calories || null,  // ← ИЗМЕНИТЕ cal на calories
            number_pribors: number_pribors || null,
            is_available: is_available !== undefined ? is_available : true,
            ingredients: ingredients || [],
            allergens: allergens || [],
            preparation_time: preparation_time || 5,
            nutrition: nutrition || {},
            sort_order: sort_order || 0
        });

        await item.save();

        res.status(201).json({
            message: 'Блюдо успешно создано',
            item: mapItemToResponse(item)
        });

    } catch (error) {
        console.error('Create item error:', error);
        if (error.code === 11000) {
            return res.status(409).json({ error: 'Блюдо с таким uniq_nom уже существует' });
        }
        res.status(500).json({ error: 'Ошибка при создании блюда' });
    }
};

export const updateItem = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const item = await Item.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!item) {
            return res.status(404).json({ error: 'Блюдо не найдено' });
        }

        res.json({
            message: 'Блюдо успешно обновлено',
            item: mapItemToResponse(item)
        });

    } catch (error) {
        console.error('Update item error:', error);
        if (error.code === 11000) {
            return res.status(409).json({ error: 'Блюдо с таким uniq_nom уже существует' });
        }
        res.status(500).json({ error: 'Ошибка при обновлении блюда' });
    }
};

export const uploadItemImage = async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.file || !req.file.buffer) {
            return res.status(400).json({ error: 'Файл изображения не найден' });
        }

        const item = await Item.findById(id);

        if (!item) {
            return res.status(404).json({ error: 'Блюдо не найдено' });
        }

        const previousKey = item.image?.key;

        const uniqueFilename = `${item.uniq_nom || item._id}-${Date.now()}-${req.file.originalname || 'image'}`;

        const uploadResult = await uploadImage({
            buffer: req.file.buffer,
            folder: S3_FOLDERS.ITEM_PICTURES,
            filename: uniqueFilename,
            contentType: req.file.mimetype
        });

        item.image = { key: uploadResult.key };
        await item.save();

        if (
            previousKey &&
            previousKey !== DEFAULT_ITEM_PICTURE_KEY &&
            previousKey !== uploadResult.key
        ) {
            try {
                await deleteObject(previousKey);
            } catch (deleteError) {
                console.warn('Failed to delete previous item image from S3:', deleteError);
            }
        }

        res.json({
            message: 'Изображение блюда успешно обновлено',
            item: mapItemToResponse(item)
        });
    } catch (error) {
        console.error('Upload item image error:', error);

        if (error instanceof StorageServiceError) {
            return res.status(502).json({ error: 'Ошибка при загрузке изображения. Повторите попытку позже.' });
        }

        res.status(500).json({ error: 'Ошибка при обновлении изображения блюда' });
    }
};

export const deleteItem = async (req, res) => {
    try {
        const { id } = req.params;

        const item = await Item.findByIdAndDelete(id);
        if (!item) {
            return res.status(404).json({ error: 'Блюдо не найдено' });
        }

        res.json({
            message: 'Блюдо успешно удалено'
        });

    } catch (error) {
        console.error('Delete item error:', error);
        res.status(500).json({ error: 'Ошибка при удалении блюда' });
    }
};