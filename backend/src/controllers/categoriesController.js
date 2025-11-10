import { Category } from '../models/Category.js';

export const getCategories = async (req, res) => {
    try {
        const { include_inactive } = req.query;

        const filter = {};
        if (include_inactive !== 'true') {
            filter.is_active = true;
        }

        const categories = await Category.find(filter)
            .sort({ sort_order: 1, name: 1 });

        console.log('Found categories:', categories.length); // Добавьте для отладки
        res.json(categories);
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Ошибка при получении категорий' });
    }
};

export const createCategory = async (req, res) => {
    try {
        const { name, slug, description, sort_order, is_active } = req.body;

        if (!name || !slug) {
            return res.status(400).json({ error: 'Необходимо указать name и slug' });
        }

        const category = new Category({
            name,
            slug,
            description: description || '',
            sort_order: sort_order || 0,
            is_active: is_active !== undefined ? is_active : true
        });

        await category.save();

        res.status(201).json({
            message: 'Категория успешно создана',
            category
        });

    } catch (error) {
        console.error('Create category error:', error);
        if (error.code === 11000) {
            return res.status(409).json({ error: 'Категория с таким slug уже существует' });
        }
        res.status(500).json({ error: 'Ошибка при создании категории' });
    }
};

export const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const category = await Category.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!category) {
            return res.status(404).json({ error: 'Категория не найдена' });
        }

        res.json({
            message: 'Категория успешно обновлена',
            category
        });

    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({ error: 'Ошибка при обновлении категории' });
    }
};