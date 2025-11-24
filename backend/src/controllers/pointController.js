// controllers/pointController.js
import { Point } from "../models/Point.js";

const mapPointToResponse = (point) => {
  return {
    _id: point._id,
    name: point.name,
    type: point.type,
    location: point.location,
    phone: point.phone,
    isActive: point.isActive,
    created_at: point.createdAt,
    updated_at: point.updatedAt,
  };
};

export const getPoints = async (req, res) => {
  try {
    const { type, active } = req.query;

    const filter = {};
    if (type) filter.type = type;
    if (active === "true") filter.isActive = true;

    const points = await Point.find(filter).sort({ name: 1 });

    res.json({
      points: points.map(mapPointToResponse),
      total: points.length,
    });
  } catch (error) {
    console.error("Get points error:", error);
    res.status(500).json({ error: "Ошибка при получении точек" });
  }
};

export const getPointById = async (req, res) => {
  try {
    const point = await Point.findById(req.params.id);

    if (!point) {
      return res.status(404).json({ error: "Точка не найдена" });
    }

    res.json(mapPointToResponse(point));
  } catch (error) {
    console.error("Get point by id error:", error);
    res.status(500).json({ error: "Ошибка при получении точки" });
  }
};

export const createPoint = async (req, res) => {
  try {
    const { name, type, location, phone, isActive } = req.body;

    if (!name || !type || !location || !phone) {
      return res.status(400).json({
        error: "Необходимо указать: name, type, location, phone",
      });
    }

    const point = new Point({
      name,
      type,
      location,
      phone,
      isActive: isActive !== undefined ? isActive : true,
    });

    await point.save();

    res.status(201).json({
      message: "Точка успешно создана",
      point: mapPointToResponse(point),
    });
  } catch (error) {
    console.error("Create point error:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ error: "Некорректные данные точки" });
    }
    res.status(500).json({ error: "Ошибка при создании точки" });
  }
};

export const updatePoint = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const point = await Point.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!point) {
      return res.status(404).json({ error: "Точка не найдена" });
    }

    res.json({
      message: "Точка успешно обновлена",
      point: mapPointToResponse(point),
    });
  } catch (error) {
    console.error("Update point error:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ error: "Некорректные данные точки" });
    }
    res.status(500).json({ error: "Ошибка при обновлении точки" });
  }
};

export const deletePoint = async (req, res) => {
  try {
    const { id } = req.params;

    // НОВОЕ: проверяем, есть ли связанные записи в stock
    const { Stock } = await import("../models/Stock.js");
    const stockCount = await Stock.countDocuments({ pointId: id });

    if (stockCount > 0) {
      return res.status(400).json({
        error: "Невозможно удалить точку: есть связанные товары на складе",
      });
    }

    const point = await Point.findByIdAndDelete(id);
    if (!point) {
      return res.status(404).json({ error: "Точка не найдена" });
    }

    res.json({
      message: "Точка успешно удалена",
    });
  } catch (error) {
    console.error("Delete point error:", error);
    res.status(500).json({ error: "Ошибка при удалении точки" });
  }
};
