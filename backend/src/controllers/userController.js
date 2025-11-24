// controllers/userController.js
import { S3_FOLDERS } from "../config/storage.js";
import { User } from "../models/User.js";
import { Point } from "../models/Point.js"; // НОВОЕ: импорт модели Point
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
  const pointObject =
    user.point_id && typeof user.point_id === "object" && user.point_id._id
      ? user.point_id
      : null;
  const pointIdValue = pointObject
    ? pointObject._id.toString()
    : user.point_id
    ? user.point_id.toString()
    : undefined;

  return {
    _id: user._id,
    first_name: user.first_name,
    last_name: user.last_name,
    phone: user.phone,
    mail: user.email,
    role: user.role,
    balance: user.balance ?? 0,
    point_id: pointIdValue,
    point_info: pointObject
      ? {
          _id: pointObject._id.toString(),
          name: pointObject.name,
          type: pointObject.type,
          location: pointObject.location,
        }
      : undefined,
    created_at: user.createdAt,
    avatar: {
      key: avatarKey,
      url: buildPublicUrl(avatarKey),
    },
  };
};

export const register = async (req, res) => {
  try {
    const { first_name, last_name, phone, mail, password, role, point_id } =
      req.body;

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
      return res.status(400).json({
        error: "Пользователь с таким телефоном или почтой уже существует",
      });
    }

    // Для менеджеров точек проверяем существование точки
    if ((role === "canteenManager" || role === "storeManager") && point_id) {
      const point = await Point.findById(point_id);
      if (!point) {
        return res.status(400).json({ error: "Указанная точка не найдена" });
      }

      // Проверяем соответствие типа точки и роли
      if (role === "canteenManager" && point.type !== "canteen") {
        return res
          .status(400)
          .json({
            error:
              "Администратор столовой может быть привязан только к столовой",
          });
      }
      if (role === "storeManager" && point.type !== "store") {
        return res
          .status(400)
          .json({
            error: "Администратор буфета может быть привязан только к буфету",
          });
      }
    }

    const user = new User({
      first_name,
      last_name,
      phone: formattedPhone,
      email: mail,
      password,
      role: role || "user",
      point_id:
        role === "canteenManager" || role === "storeManager"
          ? point_id
          : undefined,
    });

    await user.save();

    // Заполняем информацию о точке
    if (user.point_id) {
      await user.populate("point_id", "name type location");
    }

    const token = generateToken(user._id);

    res.status(201).json({
      message: "Пользователь успешно зарегистрирован",
      user: mapUserToResponse(user),
      token,
    });
  } catch (error) {
    console.error("Register error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
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

    const user = await User.findOne({ phone: formattedPhone }).populate(
      "point_id",
      "name type location"
    );
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
    const user = await User.findById(req.user._id).populate(
      "point_id",
      "name type location"
    );
    res.json({ user: mapUserToResponse(user) });
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
        return res.status(400).json({
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
    })
      .select("-password")
      .populate("point_id", "name type location");

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
      .populate("point_id", "name type location")
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
    )
      .select("-password")
      .populate("point_id", "name type location");

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
    const { role, point_id } = req.body;

    const validRoles = [
      "user",
      "admin",
      "canteenManager",
      "cateenManager",
      "storeManager",
    ];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({
        error:
          "Неверная роль. Допустимые роли: user, admin, canteenManager, cateenManager, storeManager",
      });
    }

    // Для менеджеров точек проверяем существование точки
    let pointData = {};
    if (role === "canteenManager" || role === "storeManager") {
      if (!point_id) {
        return res
          .status(400)
          .json({ error: "Для менеджера точки необходимо указать точку" });
      }

      const point = await Point.findById(point_id);
      if (!point) {
        return res.status(400).json({ error: "Указанная точка не найдена" });
      }

      // Проверяем соответствие типа точки и роли
      if (role === "canteenManager" && point.type !== "canteen") {
        return res
          .status(400)
          .json({
            error:
              "Администратор столовой может быть привязан только к столовой",
          });
      }
      if (role === "storeManager" && point.type !== "store") {
        return res
          .status(400)
          .json({
            error: "Администратор буфета может быть привязан только к буфету",
          });
      }

      pointData.point_id = point_id;
    } else {
      // Для других ролей сбрасываем точку
      pointData.point_id = null;
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role, ...pointData },
      { new: true, runValidators: true }
    )
      .select("-password")
      .populate("point_id", "name type location");

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

    // Заполняем информацию о точке
    await user.populate("point_id", "name type location");

    res.json({
      message: "Аватар успешно обновлен",
      user: mapUserToResponse(user),
    });
  } catch (error) {
    console.error("Update user avatar error:", error);

    if (error instanceof StorageServiceError) {
      return res.status(502).json({
        error: "Ошибка при загрузке изображения. Повторите попытку позже.",
      });
    }

    res.status(500).json({ error: "Ошибка при обновлении аватара" });
  }
};

// Создать сотрудника (только для админа)
export const createEmployee = async (req, res) => {
  try {
    const { first_name, last_name, phone, mail, password, role, point_id } =
      req.body;

    // Проверка обязательных полей
    if (!first_name || !last_name || !phone || !mail || !password || !role) {
      return res
        .status(400)
        .json({ error: "Все поля обязательны для заполнения" });
    }

    // Проверка допустимых ролей
    const allowedRoles = [
      "user",
      "admin",
      "canteenManager",
      "cateenManager",
      "storeManager",
    ];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ error: "Недопустимая роль" });
    }

    // Для менеджеров точек проверяем наличие точки
    if ((role === "canteenManager" || role === "storeManager") && !point_id) {
      return res
        .status(400)
        .json({ error: "Для менеджера точки необходимо указать точку" });
    }

    // Форматируем телефон
    const formattedPhone = formatPhone(phone);

    // Проверка на существующего пользователя
    const existingUser = await User.findOne({
      $or: [{ phone: formattedPhone }, { email: mail }],
    });

    if (existingUser) {
      return res.status(400).json({
        error: "Пользователь с таким телефоном или почтой уже существует",
      });
    }

    // Для менеджеров точек проверяем существование точки
    if ((role === "canteenManager" || role === "storeManager") && point_id) {
      const point = await Point.findById(point_id);
      if (!point) {
        return res.status(400).json({ error: "Указанная точка не найдена" });
      }

      // Проверяем соответствие типа точки и роли
      if (role === "canteenManager" && point.type !== "canteen") {
        return res
          .status(400)
          .json({
            error:
              "Администратор столовой может быть привязан только к столовой",
          });
      }
      if (role === "storeManager" && point.type !== "store") {
        return res
          .status(400)
          .json({
            error: "Администратор буфета может быть привязан только к буфету",
          });
      }
    }

    // Создаем пользователя с выбранной ролью
    const user = new User({
      first_name,
      last_name,
      phone: formattedPhone,
      email: mail,
      password,
      role: role,
      balance: 0,
      point_id:
        role === "canteenManager" || role === "storeManager"
          ? point_id
          : undefined,
    });

    await user.save();

    // Заполняем информацию о точке
    if (user.point_id) {
      await user.populate("point_id", "name type location");
    }

    res.status(201).json({
      message: "Сотрудник успешно создан",
      user: mapUserToResponse(user),
    });
  } catch (error) {
    console.error("Create employee error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        error: "Пользователь с такими данными уже существует",
      });
    }

    res.status(500).json({ error: "Ошибка при создании сотрудника" });
  }
};

// Удалить пользователя (только для админа)
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Нельзя удалить самого себя
    if (id === req.user._id.toString()) {
      return res.status(400).json({ error: "Нельзя удалить свой аккаунт" });
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }

    res.json({ message: "Пользователь успешно удален" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: "Ошибка при удалении пользователя" });
  }
};

// Обновить данные сотрудника (только для админа)
export const updateEmployeeData = async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, phone, mail, role, point_id } = req.body;

    const user = await User.findById(id).select("-password");
    if (!user) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }

    const updateData = {};

    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;

    if (phone !== undefined) {
      const formattedPhone = formatPhone(phone);
      const existingPhoneUser = await User.findOne({
        _id: { $ne: id },
        phone: formattedPhone,
      });
      if (existingPhoneUser) {
        return res
          .status(400)
          .json({ error: "Пользователь с таким телефоном уже существует" });
      }
      updateData.phone = formattedPhone;
    }

    if (mail !== undefined) {
      const existingMailUser = await User.findOne({
        _id: { $ne: id },
        email: mail,
      });
      if (existingMailUser) {
        return res
          .status(400)
          .json({ error: "Пользователь с такой почтой уже существует" });
      }
      updateData.email = mail;
    }

    const allowedRoles = [
      "user",
      "admin",
      "canteenManager",
      "cateenManager",
      "storeManager",
    ];
    const nextRole = role ?? user.role;
    if (!allowedRoles.includes(nextRole)) {
      return res.status(400).json({ error: "Недопустимая роль" });
    }
    if (role !== undefined) {
      updateData.role = role;
    }

    const requiresPoint =
      nextRole === "canteenManager" || nextRole === "storeManager";
    let nextPointId = point_id;
    if (nextPointId === "") {
      nextPointId = null;
    }

    // Если точка не передана, используем существующую (для проверки обязательности)
    if (nextPointId === undefined) {
      nextPointId = user.point_id ? user.point_id.toString() : null;
    }

    if (requiresPoint && !nextPointId) {
      return res
        .status(400)
        .json({ error: "Для этой роли необходимо выбрать точку" });
    }

    if (nextPointId) {
      const point = await Point.findById(nextPointId);
      if (!point) {
        return res.status(400).json({ error: "Указанная точка не найдена" });
      }

      if (
        (nextRole === "canteenManager" && point.type !== "canteen") ||
        (nextRole === "storeManager" && point.type !== "store")
      ) {
        return res.status(400).json({
          error:
            nextRole === "canteenManager"
              ? "Администратор столовой может быть привязан только к столовой"
              : "Администратор буфета может быть привязан только к буфету",
        });
      }

      updateData.point_id = nextPointId;
    } else if (!requiresPoint) {
      updateData.point_id = null;
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .select("-password")
      .populate("point_id", "name type location");

    res.json({
      message: "Данные сотрудника обновлены",
      user: mapUserToResponse(updatedUser),
    });
  } catch (error) {
    console.error("Update employee error:", error);
    res.status(500).json({ error: "Ошибка при обновлении сотрудника" });
  }
};
