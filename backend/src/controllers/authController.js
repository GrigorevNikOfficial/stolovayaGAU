import bcrypt from 'bcryptjs';
import { pool } from '../config/database.js';
import { generateToken } from '../middleware/auth.js';

export const register = async (req, res) => {
  try {
    const { first_name, last_name, phone, mail, password } = req.body;

    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE phone = ? OR mail = ?',
      [phone, mail]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Пользователь с таким телефоном или почтой уже существует' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const [result] = await pool.execute(
      'INSERT INTO users (first_name, last_name, phone, mail, password) VALUES (?, ?, ?, ?, ?)',
      [first_name, last_name, phone, mail, hashedPassword]
    );

    const token = generateToken(result.insertId);

    const [users] = await pool.execute(
      'SELECT id, first_name, last_name, phone, mail, created_at FROM users WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      message: 'Пользователь успешно зарегистрирован',
      user: users[0],
      token
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Ошибка при регистрации' });
  }
};

export const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    const [users] = await pool.execute(
      'SELECT * FROM users WHERE phone = ?',
      [phone]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Неверный телефон или пароль' });
    }

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Неверный телефон или пароль' });
    }

    const token = generateToken(user.id);
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Успешный вход',
      user: userWithoutPassword,
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Ошибка при входе' });
  }
};

export const getMe = async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Ошибка при получении профиля' });
  }
};