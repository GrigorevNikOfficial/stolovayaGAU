import { TopUpRequest } from "../models/TopUpRequest.js";
import { User } from "../models/User.js";
import {
  emitTopUpRequestCreated,
  emitTopUpRequestUpdated,
} from "../services/socketService.js";

const normalizeId = (value) => {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (value instanceof Date) return value;
  if (value.toString) return value.toString();
  return value;
};

const mapUserInfo = (user) => {
  if (!user || typeof user !== "object") {
    return null;
  }

  return {
    _id: normalizeId(user._id),
    first_name: user.first_name,
    last_name: user.last_name,
    phone: user.phone,
    email: user.email,
    role: user.role,
    balance: user.balance,
  };
};

const mapTopUpRequestToResponse = (doc) => {
  const plain =
    typeof doc.toObject === "function"
      ? doc.toObject({ getters: true })
      : doc;

  return {
    _id: normalizeId(plain._id),
    user_id: normalizeId(plain.user_id?._id ?? plain.user_id),
    admin_id: normalizeId(plain.admin_id?._id ?? plain.admin_id),
    amount_requested: plain.amount_requested,
    amount_approved:
      typeof plain.amount_approved === "number" ? plain.amount_approved : null,
    status: plain.status,
    note: plain.note || null,
    created_at: plain.created_at,
    updated_at: plain.updated_at,
    processed_at: plain.processed_at || null,
    user_info: mapUserInfo(plain.user_id),
    admin_info: mapUserInfo(plain.admin_id),
  };
};

const populateRequestQuery = (query) =>
  query
    .populate("user_id", "first_name last_name phone email role balance")
    .populate("admin_id", "first_name last_name email role");

const populateRequestDoc = async (doc) => {
  await doc.populate("user_id", "first_name last_name phone email role balance");
  await doc.populate("admin_id", "first_name last_name email role");
  return doc;
};

export const createTopUpRequest = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Требуется аутентификация" });
    }

    if (req.user.role !== "user") {
      return res
        .status(403)
        .json({ error: "Оставлять заявки на пополнение может только пользователь" });
    }

    const { amount, note } = req.body;
    const parsedAmount = Number(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res
        .status(400)
        .json({ error: "Сумма пополнения должна быть положительным числом" });
    }

    const request = new TopUpRequest({
      user_id: req.user._id,
      amount_requested: parsedAmount,
      note: note?.toString?.().trim() || undefined,
    });

    await request.save();
    await populateRequestDoc(request);

    const responsePayload = mapTopUpRequestToResponse(request);
    emitTopUpRequestCreated(responsePayload);

    res.status(201).json({
      message: "Заявка на пополнение создана",
      request: responsePayload,
    });
  } catch (error) {
    console.error("createTopUpRequest error:", error);
    res.status(500).json({ error: "Не удалось создать заявку на пополнение" });
  }
};

export const getMyTopUpRequests = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Требуется аутентификация" });
    }

    const requests = await populateRequestQuery(
      TopUpRequest.find({ user_id: req.user._id }).sort({ created_at: -1 })
    );

    const results = await requests;

    res.json({ requests: results.map(mapTopUpRequestToResponse) });
  } catch (error) {
    console.error("getMyTopUpRequests error:", error);
    res.status(500).json({ error: "Ошибка при получении заявок" });
  }
};

export const getAllTopUpRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};

    if (status) {
      const allowedStatuses = ["pending", "approved", "rejected"];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ error: "Неверный статус фильтра" });
      }
      filter.status = status;
    }

    const requestsQuery = TopUpRequest.find(filter).sort({ created_at: -1 });
    const requests = await populateRequestQuery(requestsQuery);

    res.json({ requests: requests.map(mapTopUpRequestToResponse) });
  } catch (error) {
    console.error("getAllTopUpRequests error:", error);
    res.status(500).json({ error: "Ошибка при получении заявок" });
  }
};

export const processTopUpRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, amount, note } = req.body;

    if (!status || !["approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Необходимо указать статус approved или rejected" });
    }

    const request = await TopUpRequest.findById(id);
    if (!request) {
      return res.status(404).json({ error: "Заявка не найдена" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ error: "Можно обработать только новую заявку" });
    }

    let updatedBalance = null;

    request.admin_id = req.user?._id;
    request.processed_at = new Date();
    request.note = note?.toString?.().trim() || request.note;

    if (status === "approved") {
      const approvedAmount = amount !== undefined ? Number(amount) : request.amount_requested;

      if (!Number.isFinite(approvedAmount) || approvedAmount <= 0) {
        return res.status(400).json({ error: "Сумма подтверждения должна быть положительным числом" });
      }

      const updatedUser = await User.findByIdAndUpdate(
        request.user_id,
        { $inc: { balance: approvedAmount } },
        { new: true, runValidators: true }
      ).select("balance");

      if (!updatedUser) {
        return res.status(404).json({ error: "Пользователь заявки не найден" });
      }

      updatedBalance = updatedUser.balance ?? 0;
      request.amount_approved = approvedAmount;
      request.status = "approved";
    } else {
      request.amount_approved = 0;
      request.status = "rejected";
    }

    await request.save();
    await populateRequestDoc(request);

    const responsePayload = mapTopUpRequestToResponse(request);
    emitTopUpRequestUpdated(responsePayload);

    res.json({
      message: status === "approved" ? "Заявка одобрена" : "Заявка отклонена",
      request: responsePayload,
      user_balance: updatedBalance,
    });
  } catch (error) {
    console.error("processTopUpRequest error:", error);
    res.status(500).json({ error: "Ошибка при обработке заявки" });
  }
};
