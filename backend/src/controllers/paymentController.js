import mongoose from 'mongoose';
import { ServiceRequest } from '../models/ServiceRequest.js';
import { Transaction } from '../models/Transaction.js';
import { User } from '../models/User.js';
import { adjustMarketplaceBalance, getMarketplaceCommissionPercent } from '../utils/commission.js';

const mapTransactionResponse = (transaction) => ({
  id: transaction._id,
  requestId: transaction.requestId?._id || transaction.requestId,
  serviceId: transaction.serviceId?._id || transaction.serviceId,
  customerId: transaction.customerId,
  providerId: transaction.providerId,
  amount: transaction.amount,
  commissionPercent: transaction.commissionPercent,
  commissionAmount: transaction.commissionAmount,
  payoutAmount: transaction.payoutAmount,
  status: transaction.status,
  type: transaction.type,
  processedAt: transaction.processedAt,
  createdAt: transaction.createdAt,
  updatedAt: transaction.updatedAt,
  service:
    transaction.serviceId && typeof transaction.serviceId === 'object'
      ? {
          id: transaction.serviceId._id,
          title: transaction.serviceId.title,
          category: transaction.serviceId.category,
        }
      : undefined,
  request:
    transaction.requestId && typeof transaction.requestId === 'object'
      ? {
          id: transaction.requestId._id,
          status: transaction.requestId.status,
        }
      : undefined,
});

export const processServicePayment = async (req, res) => {
  try {
    const { requestId } = req.body;

    if (!requestId) {
      return res.status(400).json({ error: 'Не передан идентификатор заявки' });
    }

    const request = await ServiceRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({ error: 'Заявка не найдена' });
    }

    if (request.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Можно оплатить только свои заявки' });
    }

    if (request.status !== 'accepted') {
      return res.status(400).json({ error: 'Заявка должна быть принята исполнителем' });
    }

    if (request.isPaid) {
      return res.status(400).json({ error: 'Заявка уже оплачена' });
    }

    const [customer, provider] = await Promise.all([
      User.findById(req.user._id),
      User.findById(request.providerId),
    ]);

    if (!customer || !provider) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const amount = request.price;
    const commissionPercent = await getMarketplaceCommissionPercent();
    const commissionAmount = Number(((amount * commissionPercent) / 100).toFixed(2));
    const payoutAmount = Number((amount - commissionAmount).toFixed(2));

    const session = await mongoose.startSession();

    let transactionDoc;

    try {
      await session.withTransaction(async () => {
        const updatedCustomer = await User.findOneAndUpdate(
          { _id: customer._id, balance: { $gte: amount } },
          { $inc: { balance: -amount } },
          { new: true, session }
        );

        if (!updatedCustomer) {
          const insufficientError = new Error('INSUFFICIENT_FUNDS');
          insufficientError.code = 'INSUFFICIENT_FUNDS';
          throw insufficientError;
        }

        await User.findByIdAndUpdate(
          provider._id,
          { $inc: { balance: payoutAmount } },
          { session }
        );

        const [createdTransaction] = await Transaction.create(
          [
            {
              requestId: request._id,
              serviceId: request.serviceId,
              customerId: customer._id,
              providerId: provider._id,
              amount,
              commissionPercent,
              commissionAmount,
              payoutAmount,
              status: 'completed',
              type: 'service_payment',
              processedAt: new Date(),
            },
          ],
          { session }
        );

        transactionDoc = createdTransaction;

        await ServiceRequest.updateOne(
          { _id: request._id },
          {
            $set: {
              isPaid: true,
              paidAt: new Date(),
              status: 'in_progress',
              transactionId: createdTransaction._id,
            },
          },
          { session }
        );
      });
    } catch (error) {
      if (error.code === 'INSUFFICIENT_FUNDS') {
        await session.endSession();
        return res.status(400).json({ error: 'Недостаточно средств на балансе' });
      }

      await session.endSession();
      console.error('Process service payment transaction error:', error);
      return res.status(500).json({ error: 'Ошибка при проведении оплаты' });
    }

    await session.endSession();

    try {
      await adjustMarketplaceBalance(commissionAmount);
    } catch (error) {
      console.error('Failed to update marketplace balance after payment:', error);
    }

    const populatedTransaction = await Transaction.findById(transactionDoc._id)
      .populate({ path: 'serviceId', select: 'title category price' })
      .populate({ path: 'requestId', select: 'status' });

    res.json({ transaction: mapTransactionResponse(populatedTransaction) });
  } catch (error) {
    console.error('Process service payment error:', error);
    res.status(500).json({ error: 'Не удалось провести оплату' });
  }
};

export const getTransactions = async (req, res) => {
  try {
    const { scope = 'customer', limit = 50 } = req.query;
    const filter = scope === 'provider' ? { providerId: req.user._id } : { customerId: req.user._id };

    const limitNumber = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));

    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .limit(limitNumber)
      .populate({ path: 'serviceId', select: 'title category price' })
      .populate({ path: 'requestId', select: 'status' });

    res.json({ data: transactions.map(mapTransactionResponse) });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Не удалось получить транзакции' });
  }
};
