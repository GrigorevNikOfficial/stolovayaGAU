const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Конфигурация базы данных
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'qwerty',
    database: 'stolovayaGAU'
};

// Создание пула соединений
const pool = mysql.createPool(dbConfig);

// Инициализация базы данных
async function initializeDatabase() {
    try {
        const connection = await mysql.createConnection({
            host: dbConfig.host,
            user: dbConfig.user,
            password: dbConfig.password
        });

        await connection.execute('CREATE DATABASE IF NOT EXISTS primer');
        await connection.end();

        // Создание таблицы
        const createTableQuery = `
      CREATE TABLE IF NOT EXISTS items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        count INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;

        await pool.execute(createTableQuery);
        console.log('База данных и таблица созданы');
    } catch (error) {
        console.error('Ошибка инициализации БД:', error);
    }
}

// API Routes

// GET - получить все записи
app.get('/api/items', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM items ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        console.error('Ошибка при получении данных:', error);
        res.status(500).json({ error: 'Ошибка при получении данных' });
    }
});

// GET - получить одну запись по ID
app.get('/api/items/:id', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM items WHERE id = ?', [req.params.id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Запись не найдена' });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error('Ошибка при получении данных:', error);
        res.status(500).json({ error: 'Ошибка при получении данных' });
    }
});

// POST - создать новую запись
app.post('/api/items', async (req, res) => {
    try {
        const { name, count } = req.body;

        if (!name || count === undefined) {
            return res.status(400).json({ error: 'Поля name и count обязательны' });
        }

        const [result] = await pool.execute(
            'INSERT INTO items (name, count) VALUES (?, ?)',
            [name, parseInt(count)]
        );

        const [newItem] = await pool.execute('SELECT * FROM items WHERE id = ?', [result.insertId]);
        res.status(201).json(newItem[0]);
    } catch (error) {
        console.error('Ошибка при создании записи:', error);
        res.status(500).json({ error: 'Ошибка при создании записи' });
    }
});

// PUT - обновить запись
app.put('/api/items/:id', async (req, res) => {
    try {
        const { name, count } = req.body;

        const [result] = await pool.execute(
            'UPDATE items SET name = ?, count = ? WHERE id = ?',
            [name, parseInt(count), req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Запись не найдена' });
        }

        const [updatedItem] = await pool.execute('SELECT * FROM items WHERE id = ?', [req.params.id]);
        res.json(updatedItem[0]);
    } catch (error) {
        console.error('Ошибка при обновлении записи:', error);
        res.status(500).json({ error: 'Ошибка при обновлении записи' });
    }
});

// DELETE - удалить запись
app.delete('/api/items/:id', async (req, res) => {
    try {
        const [result] = await pool.execute('DELETE FROM items WHERE id = ?', [req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Запись не найдена' });
        }

        res.json({ message: 'Запись удалена', id: req.params.id });
    } catch (error) {
        console.error('Ошибка при удалении записи:', error);
        res.status(500).json({ error: 'Ошибка при удалении записи' });
    }
});

// Запуск сервера
app.listen(PORT, async () => {
    await initializeDatabase();
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});