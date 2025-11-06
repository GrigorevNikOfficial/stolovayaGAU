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