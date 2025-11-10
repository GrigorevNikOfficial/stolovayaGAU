import { User } from '../models/User.js';
import { generateToken } from './auth.js';

export const register = async (req, res) => {
  try {
    const { first_name, last_name, phone, mail, password } = req.body;

    // Проверяем обязательные поля
    if (!first_name || !last_name || !phone || !mail || !password) {
      return res.status(400).json({ error: 'Все поля обязательны для заполнения' });
    }

    // Проверяем существование пользователя
    const existingUser = await User.findOne({
      $or: [{ phone }, { email: mail }]
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Пользователь с таким телефоном или почтой уже существует' });
    }

    // Создаем пользователя
    const user = new User({
      first_name,
      last_name,
      phone,
      email: mail,
      password,
      role: 'user'
    });

    await user.save();

    // Генерируем токен
    const token = generateToken(user._id);

    // Формируем ответ
    const userResponse = {
      _id: user._id,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      mail: user.email,
      role: user.role,
      created_at: user.createdAt
    };

    res.status(201).json({
      message: 'Пользователь успешно зарегистрирован',
      user: userResponse,
      token
    });

  } catch (error) {
    console.error('Register error:', error);

    if (error.code === 11000) {
      return res.status(409).json({ error: 'Пользователь с таким телефоном или почтой уже существует' });
    }

    res.status(500).json({ error: 'Ошибка при регистрации' });
  }
};

export const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Проверяем обязательные поля
    if (!phone || !password) {
      return res.status(400).json({ error: 'Телефон и пароль обязательны' });
    }

    // Ищем пользователя
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(401).json({ error: 'Неверный телефон или пароль' });
    }

    // Проверяем пароль
    const isPasswordValid = await user.correctPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Неверный телефон или пароль' });
    }

    // Генерируем токен
    const token = generateToken(user._id);

    // Формируем ответ
    const userResponse = {
      _id: user._id,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      mail: user.email,
      role: user.role,
      created_at: user.createdAt
    };

    res.json({
      message: 'Успешный вход',
      user: userResponse,
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Ошибка при входе' });
  }
};

export const getMe = async (req, res) => {
  try {
    const userResponse = {
      _id: req.user._id,
      first_name: req.user.first_name,
      last_name: req.user.last_name,
      phone: req.user.phone,
      mail: req.user.email,
      role: req.user.role,
      created_at: req.user.createdAt
    };

    res.json({ user: userResponse });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Ошибка при получении профиля' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { first_name, last_name, phone, mail } = req.body;
    const userId = req.user._id;

    // Проверяем уникальность телефона и почты
    if (phone || mail) {
      const existingUser = await User.findOne({
        $and: [
          { _id: { $ne: userId } },
          { $or: [{ phone }, { email: mail }] }
        ]
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Пользователь с таким телефоном или почтой уже существует' });
      }
    }

    // Обновляем данные
    const updateData = {};
    if (first_name) updateData.first_name = first_name;
    if (last_name) updateData.last_name = last_name;
    if (phone) updateData.phone = phone;
    if (mail) updateData.email = mail;

    const updatedUser = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
    ).select('-password');

    const userResponse = {
      _id: updatedUser._id,
      first_name: updatedUser.first_name,
      last_name: updatedUser.last_name,
      phone: updatedUser.phone,
      mail: updatedUser.email,
      role: updatedUser.role,
      created_at: updatedUser.createdAt
    };

    res.json({
      message: 'Профиль успешно обновлен',
      user: userResponse
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Ошибка при обновлении профиля' });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });

    res.json({ users });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Ошибка при получении пользователей' });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Неверная роль' });
    }

    const user = await User.findByIdAndUpdate(
        id,
        { role },
        { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const userResponse = {
      _id: user._id,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      mail: user.email,
      role: user.role,
      created_at: user.createdAt
    };

    res.json({
      message: 'Роль пользователя успешно обновлена',
      user: userResponse
    });

  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Ошибка при обновлении роли пользователя' });
  }
};