import { pool } from '../config/database.js';

// Получить все блюда
export const getItems = async (req, res) => {
  try {
    const { category, available } = req.query;

    let query = `
      SELECT id, uniq_nom, name, description, price, category, 
             cal, number_pribors, image_url, is_available
      FROM items 
      WHERE 1=1
    `;
    const params = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (available === 'true') {
      query += ' AND is_available = TRUE';
    }

    query += ' ORDER BY category, name';

    const [items] = await pool.execute(query, params);

    res.json({
      items,
      total: items.length
    });

  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({ error: 'Ошибка при получении блюд' });
  }
};

// Получить блюдо по ID
export const getItemById = async (req, res) => {
  try {
    const { id } = req.params;

    const [items] = await pool.execute(
        `SELECT id, uniq_nom, name, description, price, category, 
              cal, number_pribors, image_url, is_available
       FROM items WHERE id = ?`,
        [id]
    );

    if (items.length === 0) {
      return res.status(404).json({ error: 'Блюдо не найдено' });
    }

    res.json(items[0]);

  } catch (error) {
    console.error('Get item by id error:', error);
    res.status(500).json({ error: 'Ошибка при получении блюда' });
  }
};

// Получить блюда по категории
export const getItemsByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const [items] = await pool.execute(
        `SELECT id, uniq_nom, name, description, price, 
              cal, number_pribors, image_url
       FROM items 
       WHERE category = ? AND is_available = TRUE
       ORDER BY name`,
        [category]
    );

    res.json({
      category,
      items,
      total: items.length
    });

  } catch (error) {
    console.error('Get items by category error:', error);
    res.status(500).json({ error: 'Ошибка при получении блюд по категории' });
  }
};

// Создать новое блюдо (только админ)
export const createItem = async (req, res) => {
  try {
    const { uniq_nom, name, description, price, category, cal, number_pribors, image_url, is_available } = req.body;

    if (!uniq_nom || !name || !description || !price) {
      return res.status(400).json({ error: 'Необходимо указать: uniq_nom, name, description, price' });
    }

    const [result] = await pool.execute(
        `INSERT INTO items (uniq_nom, name, description, price, category, cal, number_pribors, image_url, is_available)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [uniq_nom, name, description, price, category || null, cal || null, number_pribors || null, image_url || null, is_available !== undefined ? is_available : true]
    );

    const [newItem] = await pool.execute(
        'SELECT * FROM items WHERE id = ?',
        [result.insertId]
    );

    res.status(201).json({
      message: 'Блюдо успешно создано',
      item: newItem[0]
    });

  } catch (error) {
    console.error('Create item error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Блюдо с таким uniq_nom уже существует' });
    }
    res.status(500).json({ error: 'Ошибка при создании блюда' });
  }
};

// Обновить блюдо (только админ)
export const updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { uniq_nom, name, description, price, category, cal, number_pribors, image_url, is_available } = req.body;

    // Проверяем существование блюда
    const [existing] = await pool.execute('SELECT id FROM items WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Блюдо не найдено' });
    }

    const updateFields = [];
    const updateValues = [];

    if (uniq_nom !== undefined) {
      updateFields.push('uniq_nom = ?');
      updateValues.push(uniq_nom);
    }
    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }
    if (price !== undefined) {
      updateFields.push('price = ?');
      updateValues.push(price);
    }
    if (category !== undefined) {
      updateFields.push('category = ?');
      updateValues.push(category);
    }
    if (cal !== undefined) {
      updateFields.push('cal = ?');
      updateValues.push(cal);
    }
    if (number_pribors !== undefined) {
      updateFields.push('number_pribors = ?');
      updateValues.push(number_pribors);
    }
    if (image_url !== undefined) {
      updateFields.push('image_url = ?');
      updateValues.push(image_url);
    }
    if (is_available !== undefined) {
      updateFields.push('is_available = ?');
      updateValues.push(is_available);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'Не указаны поля для обновления' });
    }

    updateValues.push(id);

    await pool.execute(
        `UPDATE items SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
    );

    const [updatedItem] = await pool.execute('SELECT * FROM items WHERE id = ?', [id]);

    res.json({
      message: 'Блюдо успешно обновлено',
      item: updatedItem[0]
    });

  } catch (error) {
    console.error('Update item error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Блюдо с таким uniq_nom уже существует' });
    }
    res.status(500).json({ error: 'Ошибка при обновлении блюда' });
  }
};

// Удалить блюдо (только админ)
export const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute('SELECT id FROM items WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Блюдо не найдено' });
    }

    await pool.execute('DELETE FROM items WHERE id = ?', [id]);

    res.json({
      message: 'Блюдо успешно удалено'
    });

  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ error: 'Ошибка при удалении блюда' });
  }
};