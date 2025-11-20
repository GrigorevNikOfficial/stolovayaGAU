import { S3_FOLDERS } from "../config/storage.js";
import { User } from "../models/User.js";
import {
  buildPublicUrl,
  DEFAULT_PROFILE_PICTURE_KEY,
  deleteObject,
  StorageServiceError,
  uploadImage,
} from "../services/storageService.js";
import { generateToken } from "./auth.js";

// Функция для форматирования телефона с +7
const formatPhone = (phone) => {
  if (!phone) return phone;

  // Убираем все нецифровые символы
  let cleaned = phone.replace(/\D/g, "");

  // Если номер начинается с 8, заменяем на 7
  if (cleaned.startsWith("8")) {
    cleaned = "7" + cleaned.substring(1);
  }

  // Если номер не начинается с 7, добавляем 7
  if (!cleaned.startsWith("7")) {
    cleaned = "7" + cleaned;
  }

  // Форматируем в формат +7XXXXXXXXXX
  return "+" + cleaned;
};

const mapUserToResponse = (user) => {
  const avatarKey = user?.avatar?.key || DEFAULT_PROFILE_PICTURE_KEY;

  return {
    _id: user._id,
    first_name: user.first_name,
    last_name: user.last_name,
    phone: user.phone,
    mail: user.email,
    role: user.role,
    balance: user.balance ?? 0,
    created_at: user.createdAt,
    avatar: {
      key: avatarKey,
      url: buildPublicUrl(avatarKey),
    },
  };
};

export const register = async (req, res) => {
  try {
    const { first_name, last_name, phone, mail, password } = req.body;

    if (!first_name || !last_name || !phone || !mail || !password) {
      return res
        .status(400)
        .json({ error: "Все поля обязательны для заполнения" });
    }

    // Форматируем телефон с +7
    const formattedPhone = formatPhone(phone);

    const existingUser = await User.findOne({
      $or: [{ phone: formattedPhone }, { email: mail }],
    });

    if (existingUser) {
      return res
        .status(400)
        .json({
          error: "Пользователь с таким телефоном или почтой уже существует",
        });
    }

    const user = new User({
      first_name,
      last_name,
      phone: formattedPhone,
      email: mail,
      password,
      role: "user",
    });

    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      message: "Пользователь успешно зарегистрирован",
      user: mapUserToResponse(user),
      token,
    });
  } catch (error) {
    console.error("Register error:", error);

    if (error.code === 11000) {
      return res
        .status(409)
        .json({
          error: "Пользователь с таким телефоном или почтой уже существует",
        });
    }

    res.status(500).json({ error: "Ошибка при регистрации" });
  }
};

export const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ error: "Телефон и пароль обязательны" });
    }

    // Форматируем телефон с +7
    const formattedPhone = formatPhone(phone);

    const user = await User.findOne({ phone: formattedPhone });
    if (!user) {
      return res.status(401).json({ error: "Неверный телефон или пароль" });
    }

    const isPasswordValid = await user.correctPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Неверный телефон или пароль" });
    }

    const token = generateToken(user._id);

    res.json({
      message: "Успешный вход",
      user: mapUserToResponse(user),
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Ошибка при входе" });
  }
};

export const getMe = async (req, res) => {
  try {
    res.json({ user: mapUserToResponse(req.user) });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({ error: "Ошибка при получении профиля" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { first_name, last_name, phone, mail } = req.body;
    const userId = req.user._id;

    if (phone || mail) {
      // Форматируем телефон с +7 если он передан
      const formattedPhone = phone ? formatPhone(phone) : null;

      const existingUser = await User.findOne({
        $and: [
          { _id: { $ne: userId } },
          { $or: [{ phone: formattedPhone }, { email: mail }] },
        ],
      });

      if (existingUser) {
        return res
          .status(400)
          .json({
            error: "Пользователь с таким телефоном или почтой уже существует",
          });
      }
    }

    const updateData = {};
    if (first_name) updateData.first_name = first_name;
    if (last_name) updateData.last_name = last_name;
    if (phone) updateData.phone = formatPhone(phone);
    if (mail) updateData.email = mail;

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.json({
      message: "Профиль успешно обновлен",
      user: mapUserToResponse(updatedUser),
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Ошибка при обновлении профиля" });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({ users: users.map(mapUserToResponse) });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ error: "Ошибка при получении пользователей" });
  }
};

export const topUpUserBalance = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    const parsedAmount = Number(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res
        .status(400)
        .json({ error: "Сумма пополнения должна быть положительным числом" });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { $inc: { balance: parsedAmount } },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }

    res.json({
      message: `Баланс пополнен на ${parsedAmount} ₽`,
      user: mapUserToResponse(user),
    });
  } catch (error) {
    console.error("Top up balance error:", error);
    res
      .status(500)
      .json({ error: "Ошибка при пополнении баланса пользователя" });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = [
      "user",
      "admin",
      "canteenManager",
      "cateenManager",
      "storeManager",
    ];
    if (!role || !validRoles.includes(role)) {
      return res
        .status(400)
        .json({
          error:
            "Неверная роль. Допустимые роли: user, admin, canteenManager, cateenManager, storeManager",
        });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }

    res.json({
      message: "Роль пользователя успешно обновлена",
      user: mapUserToResponse(user),
    });
  } catch (error) {
    console.error("Update user role error:", error);
    res.status(500).json({ error: "Ошибка при обновлении роли пользователя" });
  }
};

export const updateUserAvatar = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.user) {
      return res.status(401).json({ error: "Требуется аутентификация" });
    }

    const isSelf = req.user._id.toString() === id;
    const isAdmin = req.user.role === "admin";

    if (!isSelf && !isAdmin) {
      return res
        .status(403)
        .json({ error: "Недостаточно прав для изменения аватара" });
    }

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: "Файл изображения не найден" });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }

    const previousKey = user.avatar?.key;

    const uploadResult = await uploadImage({
      buffer: req.file.buffer,
      folder: S3_FOLDERS.PROFILE_PICTURES,
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    user.avatar = { key: uploadResult.key };
    await user.save();

    if (
      previousKey &&
      previousKey !== DEFAULT_PROFILE_PICTURE_KEY &&
      previousKey !== uploadResult.key
    ) {
      try {
        await deleteObject(previousKey);
      } catch (deleteError) {
        console.warn("Failed to delete previous avatar from S3:", deleteError);
      }
    }

    res.json({
      message: "Аватар успешно обновлен",
      user: mapUserToResponse(user),
    });
  } catch (error) {
    console.error("Update user avatar error:", error);

    if (error instanceof StorageServiceError) {
      return res
        .status(502)
        .json({
          error: "Ошибка при загрузке изображения. Повторите попытку позже.",
        });
    }

    res.status(500).json({ error: "Ошибка при обновлении аватара" });
  }
};
