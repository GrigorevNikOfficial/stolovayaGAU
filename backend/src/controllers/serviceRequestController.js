import mongoose from 'mongoose';
import { Chat } from '../models/Chat.js';
import { ServiceListing } from '../models/ServiceListing.js';
import { ServiceRequest } from '../models/ServiceRequest.js';
import { Transaction } from '../models/Transaction.js';
import { User } from '../models/User.js';
import {
  attachUsersToChatRoom,
  emitMarketplaceRequestCreated,
  emitMarketplaceRequestDeleted,
  emitMarketplaceRequestUpdated,
} from '../services/socketService.js';
import { adjustMarketplaceBalance, getMarketplaceCommissionPercent } from '../utils/commission.js';

const mapServiceRequestResponse = (request) => ({
  id: request._id,
  service: request.serviceId
    ? {
        id: request.serviceId._id || request.serviceId,
        title: request.serviceId.title,
        price: request.serviceId.price,
        category: request.serviceId.category,
      }
    : undefined,
  customer: request.customerId
    ? {
        id: request.customerId._id || request.customerId,
        firstName: request.customerId.first_name,
        lastName: request.customerId.last_name,
        role: request.customerId.role,
      }
    : undefined,
  provider: request.providerId
    ? {
        id: request.providerId._id || request.providerId,
        firstName: request.providerId.first_name,
        lastName: request.providerId.last_name,
        role: request.providerId.role,
      }
    : undefined,
  price: request.price,
  message: request.message,
  status: request.status,
  scheduledDate: request.scheduledDate,
  dueDate: request.dueDate,
  address: request.address,
  files: request.files,
  chatId: request.chatId,
  transactionId: request.transactionId,
  isPaid: request.isPaid,
  paidAt: request.paidAt,
  completedAt: request.completedAt,
  cancellationReason: request.cancellationReason,
  createdAt: request.createdAt,
  updatedAt: request.updatedAt,
});

const calculateCommission = (amount, percent) => {
  const commissionAmount = Number(((amount * percent) / 100).toFixed(2));
  const payoutAmount = Number((amount - commissionAmount).toFixed(2));
  return {
    commissionAmount: Math.max(0, commissionAmount),
    payoutAmount: Math.max(0, payoutAmount),
  };
};

const refundRequestPayment = async (request, reason) => {
  if (!request.isPaid || !request.transactionId) {
    return;
  }

  const transaction = await Transaction.findById(request.transactionId);
  if (!transaction || ['refunded', 'failed'].includes(transaction.status)) {
    return;
  }

  if (transaction.status === 'completed') {
    const error = new Error('PAYMENT_ALREADY_COMPLETED');
    error.code = 'PAYMENT_ALREADY_COMPLETED';
    throw error;
  }

  await User.findByIdAndUpdate(request.customerId, {
    $inc: { balance: transaction.amount },
  });

  await Transaction.updateOne(
    { _id: transaction._id },
    {
      $set: {
        status: 'refunded',
        processedAt: new Date(),
        notes: reason || 'Возврат средств по заявке',
      },
    }
  );

  await ServiceRequest.updateOne(
    { _id: request._id },
    {
      $set: {
        isPaid: false,
        paidAt: null,
        transactionId: null,
      },
    }
  );

  request.isPaid = false;
  request.paidAt = null;
  request.transactionId = null;

  const commissionToRevert = Number(transaction.commissionAmount || 0);
  if (commissionToRevert > 0) {
    try {
      await adjustMarketplaceBalance(-commissionToRevert);
    } catch (error) {
      console.error('Failed to rollback marketplace balance after refund:', error);
    }
  }
};

const payoutProviderForRequest = async (request) => {
  if (!request.transactionId) {
    return;
  }

  const transaction = await Transaction.findById(request.transactionId);
  if (!transaction) {
    return;
  }

  if (transaction.status === 'completed') {
    return;
  }

  if (transaction.status === 'refunded') {
    const error = new Error('TRANSACTION_REFUNDED');
    error.code = 'TRANSACTION_REFUNDED';
    throw error;
  }

  await User.findByIdAndUpdate(request.providerId, {
    $inc: { balance: transaction.payoutAmount },
  });

  await Transaction.updateOne(
    { _id: transaction._id },
    {
      $set: {
        status: 'completed',
        processedAt: new Date(),
      },
    }
  );
};

const ensureDirectChat = async (customerId, providerId) => {
  const directKey = Chat.buildDirectKey(customerId, providerId);
  let chat = await Chat.findOne({ directKey });

  if (chat) {
    return chat;
  }

  try {
    chat = await Chat.create({
      type: 'direct',
      createdBy: customerId,
      participants: [
        { user: customerId, role: 'member' },
        { user: providerId, role: 'member' },
      ],
      visibility: 'private',
      directKey,
    });

    attachUsersToChatRoom(chat._id.toString(), [customerId.toString(), providerId.toString()]);

    return chat;
  } catch (error) {
    if (error && error.code === 11000) {
      return Chat.findOne({ directKey });
    }
    throw error;
  }
};

export const createServiceRequest = async (req, res) => {
  try {
    const { serviceId, message } = req.body;

    if (!serviceId) {
      return res.status(400).json({ error: 'Не передан идентификатор услуги' });
    }

    const service = await ServiceListing.findById(serviceId);

    if (!service || !service.isActive) {
      return res.status(404).json({ error: 'Услуга недоступна' });
    }

    if (service.userId.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'Нельзя оставить запрос на собственную услугу' });
    }

    const finalPrice = Number(service.price);

    if (Number.isNaN(finalPrice) || finalPrice < 0) {
      return res.status(400).json({ error: 'Некорректная стоимость заявки' });
    }

    const commissionPercent = await getMarketplaceCommissionPercent();
    const { commissionAmount, payoutAmount } = calculateCommission(finalPrice, commissionPercent);
    const timestamp = new Date();
    const amount = finalPrice;
    const requestId = new mongoose.Types.ObjectId();
    const customerId = service.userId;
    const providerId = req.user._id;

    const updatedListing = await ServiceListing.findOneAndUpdate(
      { _id: service._id, paymentHold: { $gte: finalPrice } },
      { $inc: { paymentHold: -finalPrice } },
      { new: true }
    );

    if (!updatedListing) {
      return res
        .status(400)
        .json({ error: 'Недостаточно зарезервированных средств для оплаты заявки' });
    }

    let createdRequest;

    try {
      createdRequest = await ServiceRequest.create({
        _id: requestId,
        serviceId: service._id,
        customerId,
        providerId,
        price: finalPrice,
        message,
        scheduledDate: timestamp,
        status: 'pending',
        isPaid: true,
        paidAt: timestamp,
      });

      const transactionDoc = await Transaction.create({
        requestId,
        serviceId: service._id,
        customerId,
        providerId,
        amount,
        commissionPercent,
        commissionAmount,
        payoutAmount,
        status: 'processing',
        type: 'service_payment',
      });

      await ServiceRequest.updateOne(
        { _id: requestId },
        { $set: { transactionId: transactionDoc._id } }
      );

      createdRequest.transactionId = transactionDoc._id;

      await adjustMarketplaceBalance(commissionAmount);
    } catch (creationError) {
      await Promise.allSettled([
        ServiceListing.findByIdAndUpdate(service._id, { $inc: { paymentHold: finalPrice } }),
        ServiceRequest.deleteOne({ _id: requestId }),
        Transaction.deleteOne({ requestId }),
      ]);

      throw creationError;
    }

    try {
      const chat = await ensureDirectChat(customerId, providerId);
      if (
        chat &&
        (!createdRequest.chatId || createdRequest.chatId.toString() !== chat._id.toString())
      ) {
        await ServiceRequest.updateOne(
          { _id: createdRequest._id },
          { $set: { chatId: chat._id } }
        );
        createdRequest.chatId = chat._id;
      }
    } catch (chatError) {
      console.error('Create service request chat error:', chatError);
    }

    const populated = await ServiceRequest.findById(createdRequest._id).populate([
      { path: 'serviceId', select: 'title price category' },
      { path: 'customerId', select: 'first_name last_name role' },
      { path: 'providerId', select: 'first_name last_name role' },
    ]);
    const responsePayload = mapServiceRequestResponse(populated);

    res.status(201).json(responsePayload);
    emitMarketplaceRequestCreated(responsePayload);
  } catch (error) {
    console.error('Create service request error:', error);
    res.status(500).json({ error: 'Не удалось создать запрос на услугу' });
  }
};

export const getServiceRequests = async (req, res) => {
  try {
    const { scope = 'customer', status, serviceId } = req.query;
    const filter = {};

    if (scope === 'provider') {
      filter.providerId = req.user._id;
    } else {
      filter.customerId = req.user._id;
    }

    if (status) {
      filter.status = status;
    }

    if (serviceId) {
      filter.serviceId = serviceId;
    }

    const requests = await ServiceRequest.find(filter)
      .sort({ createdAt: -1 })
      .populate([
        { path: 'serviceId', select: 'title price category' },
        { path: 'customerId', select: 'first_name last_name role' },
        { path: 'providerId', select: 'first_name last_name role' },
      ]);

    res.json({ data: requests.map(mapServiceRequestResponse) });
  } catch (error) {
    console.error('Get service requests error:', error);
    res.status(500).json({ error: 'Не удалось получить список запросов' });
  }
};

export const getServiceRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await ServiceRequest.findById(id).populate([
      { path: 'serviceId', select: 'title price category' },
      { path: 'customerId', select: 'first_name last_name role' },
      { path: 'providerId', select: 'first_name last_name role' },
    ]);

    if (!request) {
      return res.status(404).json({ error: 'Заявка не найдена' });
    }

    const isParticipant =
      request.customerId._id.toString() === req.user._id.toString() ||
      request.providerId._id.toString() === req.user._id.toString();

    if (!isParticipant && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Недостаточно прав для просмотра заявки' });
    }

    res.json(mapServiceRequestResponse(request));
  } catch (error) {
    console.error('Get service request error:', error);
    res.status(500).json({ error: 'Не удалось получить заявку' });
  }
};

export const updateServiceRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Не передан статус' });
    }

    const allowedStatuses = ['accepted', 'declined', 'cancelled', 'completed'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Недопустимый статус' });
    }

    const request = await ServiceRequest.findById(id);

    if (!request) {
      return res.status(404).json({ error: 'Заявка не найдена' });
    }

    const isCustomer = request.customerId.toString() === req.user._id.toString();
    const isProvider = request.providerId.toString() === req.user._id.toString();

    if (!isCustomer && !isProvider && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Недостаточно прав для изменения заявки' });
    }

    if (status === 'accepted') {
      if (!isCustomer) {
        return res.status(403).json({ error: 'Только автор объявления может принять заявку' });
      }
      if (request.status !== 'pending') {
        return res.status(400).json({ error: 'Можно принять только новую заявку' });
      }
      request.status = 'in_progress';
      request.dueDate = new Date();
    }

    if (status === 'declined') {
      if (!isCustomer) {
        return res.status(403).json({ error: 'Только автор объявления может отклонить заявку' });
      }
      if (request.status !== 'pending') {
        return res.status(400).json({ error: 'Можно отклонить только новую заявку' });
      }
      request.status = 'declined';
      request.cancellationReason = reason || 'Отклонено исполнителем';

      try {
        await refundRequestPayment(request, request.cancellationReason);
      } catch (paymentError) {
        if (paymentError?.code === 'PAYMENT_ALREADY_COMPLETED') {
          return res.status(400).json({ error: 'Нельзя вернуть оплату по уже завершённой заявке' });
        }
        throw paymentError;
      }
    }

    if (status === 'cancelled') {
      if (!['pending', 'accepted', 'in_progress'].includes(request.status)) {
        return res.status(400).json({ error: 'Нельзя отменить выполненную или отменённую заявку' });
      }
      request.status = 'cancelled';
      request.cancellationReason = reason || 'Отменено пользователем';

      try {
        await refundRequestPayment(request, request.cancellationReason);
      } catch (paymentError) {
        if (paymentError?.code === 'PAYMENT_ALREADY_COMPLETED') {
          return res.status(400).json({ error: 'Нельзя отменить уже завершённую заявку' });
        }
        throw paymentError;
      }

      const populatedCancellation = await request.populate([
        { path: 'serviceId', select: 'title price category' },
        { path: 'customerId', select: 'first_name last_name role' },
        { path: 'providerId', select: 'first_name last_name role' },
      ]);
      const responsePayload = mapServiceRequestResponse(populatedCancellation);
      await ServiceRequest.deleteOne({ _id: request._id });

      res.json(responsePayload);
      emitMarketplaceRequestDeleted(responsePayload);
      return;
    }

    if (status === 'completed') {
      if (!isCustomer) {
        return res.status(403).json({ error: 'Только автор объявления может завершить заявку' });
      }
      if (!['in_progress', 'accepted'].includes(request.status)) {
        return res.status(400).json({ error: 'Заявку можно завершить только после принятия' });
      }
      if (!request.isPaid) {
        return res.status(400).json({ error: 'Заявка должна быть оплачена' });
      }
      request.status = 'completed';
      request.completedAt = new Date();

      try {
        await payoutProviderForRequest(request);
      } catch (paymentError) {
        if (paymentError?.code === 'TRANSACTION_REFUNDED') {
          return res.status(400).json({ error: 'По этой заявке оформлен возврат, выплатить средства нельзя' });
        }
        throw paymentError;
      }

      await ServiceListing.findByIdAndUpdate(request.serviceId, { $inc: { completedOrders: 1 } });
    }

    await request.save();

    const populated = await request.populate([
      { path: 'serviceId', select: 'title price category' },
      { path: 'customerId', select: 'first_name last_name role' },
      { path: 'providerId', select: 'first_name last_name role' },
    ]);
    const responsePayload = mapServiceRequestResponse(populated);

    res.json(responsePayload);
    emitMarketplaceRequestUpdated(responsePayload);
  } catch (error) {
    console.error('Update service request status error:', error);
    res.status(500).json({ error: 'Не удалось обновить статус заявки' });
  }
};
