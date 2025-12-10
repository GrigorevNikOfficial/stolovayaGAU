import { Order } from '../models/Order.js';
import { ServiceListing } from '../models/ServiceListing.js';
import { ServiceRequest } from '../models/ServiceRequest.js';
import { TopUpRequest } from '../models/TopUpRequest.js';

const DEFAULT_DAY_WINDOW = 7;
const ALLOWED_RANGES = [7, 30];
const MODULE_META = {
  services: { label: 'Услуги', color: 'bg-emerald-500' },
  cafeteria: { label: 'Еда', color: 'bg-brand-indigo' },
  finance: { label: 'Финансы', color: 'bg-amber-500' },
};
const MODULE_IDS = Object.keys(MODULE_META);
const ACTIVE_ORDER_STATUSES = ['created', 'cooking', 'waiting_delivery', 'in_transit', 'ready_for_pickup'];

const startOfDay = (date) => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

const shiftDate = (date, days) => {
  const clone = new Date(date);
  clone.setDate(clone.getDate() + days);
  return clone;
};

const formatDateKey = (date) => date.toISOString().slice(0, 10);

const buildDateKeys = (startDate, days) => {
  const keys = [];
  for (let i = 0; i < days; i += 1) {
    const current = shiftDate(startDate, i);
    keys.push(formatDateKey(current));
  }
  return keys;
};

const mapAggregateToSeries = (aggregateResults, dateKeys) => {
  const map = new Map();
  aggregateResults.forEach((entry) => {
    if (entry?._id) {
      map.set(entry._id, entry.count || 0);
    }
  });
  return dateKeys.map((key) => map.get(key) || 0);
};

const formatDiff = (current, previous, periodLabel = 'к прошлой неделе') => {
  if (previous === 0) {
    if (current === 0) {
      return `0% ${periodLabel}`;
    }
    return `+100% ${periodLabel}`;
  }

  const diff = ((current - previous) / previous) * 100;
  const rounded = Math.round(diff);
  const sign = rounded > 0 ? '+' : '';
  return `${sign}${rounded}% ${periodLabel}`;
};

const aggregateTimeline = async ({ model, dateField, dateStart, baseMatch = {} }) => {
  const dateQuery = baseMatch[dateField] || {};
  const matchStage = {
    ...baseMatch,
    [dateField]: {
      ...dateQuery,
      $gte: dateStart,
    },
  };
  return model.aggregate([
    {
      $match: matchStage,
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: `$${dateField}`,
            timezone: 'UTC',
          },
        },
        count: { $sum: 1 },
      },
    },
  ]);
};

export const getAdminAnalytics = async (req, res) => {
  try {
    const moduleParam = typeof req.query.module === 'string' ? req.query.module.toLowerCase() : '';
    const normalizedModule = MODULE_IDS.includes(moduleParam) ? moduleParam : 'services';
    const requestedRange = Number(req.query.range);
    const dayWindow = ALLOWED_RANGES.includes(requestedRange) ? requestedRange : DEFAULT_DAY_WINDOW;

    const today = startOfDay(new Date());
    const periodStart = shiftDate(today, -(dayWindow - 1));
    const periodEnd = shiftDate(periodStart, dayWindow - 1);
    const previousPeriodStart = shiftDate(periodStart, -dayWindow);
    const previousPeriodEnd = shiftDate(periodStart, -1);
    const diffLabel = dayWindow === 30 ? 'к прошлому месяцу' : 'к прошлой неделе';

    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      newServicesCurrent,
      newServicesPrevious,
      foodOrdersCurrent,
      foodOrdersPrevious,
      topUpsApprovedCurrent,
      topUpsApprovedPrevious,
      pendingTopUps,
      serviceRequestsTimelineRaw,
      cafeteriaOrdersTimelineRaw,
      financeTimelineRaw,
      delayedFoodOrders,
      unansweredServiceRequests,
    ] = await Promise.all([
      ServiceListing.countDocuments({ createdAt: { $gte: periodStart } }),
      ServiceListing.countDocuments({ createdAt: { $gte: previousPeriodStart, $lte: previousPeriodEnd } }),
      Order.countDocuments({ created_at: { $gte: periodStart } }),
      Order.countDocuments({ created_at: { $gte: previousPeriodStart, $lte: previousPeriodEnd } }),
      TopUpRequest.countDocuments({ status: 'approved', processed_at: { $gte: periodStart } }),
      TopUpRequest.countDocuments({ status: 'approved', processed_at: { $gte: previousPeriodStart, $lte: previousPeriodEnd } }),
      TopUpRequest.countDocuments({ status: 'pending' }),
      aggregateTimeline({ model: ServiceRequest, dateField: 'createdAt', dateStart: periodStart }),
      aggregateTimeline({ model: Order, dateField: 'created_at', dateStart: periodStart }),
      aggregateTimeline({
        model: TopUpRequest,
        dateField: 'processed_at',
        dateStart: periodStart,
        baseMatch: { status: 'approved', processed_at: { $ne: null } },
      }),
      Order.countDocuments({
        status: { $in: ACTIVE_ORDER_STATUSES },
        created_at: { $lt: hourAgo },
      }),
      ServiceRequest.countDocuments({ status: 'pending', createdAt: { $lt: dayAgo } }),
    ]);

    const dateKeys = buildDateKeys(periodStart, dayWindow);
    const serviceRequestsTimeline = mapAggregateToSeries(serviceRequestsTimelineRaw, dateKeys);
    const cafeteriaTimeline = mapAggregateToSeries(cafeteriaOrdersTimelineRaw, dateKeys);
    const financeTimeline = mapAggregateToSeries(financeTimelineRaw, dateKeys);
    const serviceRequestsTotal = serviceRequestsTimeline.reduce((sum, value) => sum + value, 0);
    const cafeteriaTotal = cafeteriaTimeline.reduce((sum, value) => sum + value, 0);
    const financeTotal = financeTimeline.reduce((sum, value) => sum + value, 0);

    const totalActivity = serviceRequestsTotal + cafeteriaTotal + financeTotal;
    let servicesShare = 0;
    let foodShare = 0;
    let financeShare = 0;

    if (totalActivity > 0) {
      servicesShare = Number(((serviceRequestsTotal / totalActivity) * 100).toFixed(1));
      foodShare = Number(((cafeteriaTotal / totalActivity) * 100).toFixed(1));
      financeShare = Math.max(0, Number((100 - servicesShare - foodShare).toFixed(1)));
    }

    const summaryCards = [
      {
        id: 'services',
        title: 'Новые услуги',
        value: newServicesCurrent,
        diff: formatDiff(newServicesCurrent, newServicesPrevious, diffLabel),
      },
      {
        id: 'cafeteria',
        title: 'Заказы в еде',
        value: foodOrdersCurrent,
        diff: formatDiff(foodOrdersCurrent, foodOrdersPrevious, diffLabel),
      },
      {
        id: 'topups',
        title: 'Пополнения',
        value: topUpsApprovedCurrent,
        diff: formatDiff(topUpsApprovedCurrent, topUpsApprovedPrevious, diffLabel),
      },
    ];

    const moduleShare = [
      { id: 'services', label: MODULE_META.services.label, value: servicesShare, color: MODULE_META.services.color },
      { id: 'cafeteria', label: MODULE_META.cafeteria.label, value: foodShare, color: MODULE_META.cafeteria.color },
      { id: 'finance', label: MODULE_META.finance.label, value: financeShare, color: MODULE_META.finance.color },
    ];

    const moduleTimelineMap = {
      services: serviceRequestsTimeline,
      cafeteria: cafeteriaTimeline,
      finance: financeTimeline,
    };

    const selectedTimeline = moduleTimelineMap[normalizedModule] || serviceRequestsTimeline;
    const moduleTotal = selectedTimeline.reduce((sum, value) => sum + value, 0);
    const moduleAverage = selectedTimeline.length ? Number((moduleTotal / selectedTimeline.length).toFixed(1)) : 0;
    const moduleLastValue = selectedTimeline[selectedTimeline.length - 1] || 0;

    const selectedModule = {
      id: normalizedModule,
      label: MODULE_META[normalizedModule].label,
      timeline: selectedTimeline,
      labels: dateKeys,
      total: moduleTotal,
      averagePerDay: moduleAverage,
      lastValue: moduleLastValue,
    };

    const period = {
      days: dayWindow,
      range: dayWindow === 30 ? 'month' : 'week',
      start: periodStart.toISOString(),
      end: periodEnd.toISOString(),
    };

    const checklist = [
      {
        title: 'Пополнения в очереди',
        value: pendingTopUps,
        description: pendingTopUps > 0 ? 'Ожидают подтверждения' : 'Очередь пуста',
      },
      {
        title: 'Заказы еда > 60 мин',
        value: delayedFoodOrders,
        description: delayedFoodOrders > 0 ? 'Проверьте кухню и доставку' : 'Просроченных заказов нет',
      },
      {
        title: 'Услуги без ответов',
        value: unansweredServiceRequests,
        description: unansweredServiceRequests > 0 ? 'Есть заявки в статусе pending' : 'Все заявки обработаны',
      },
    ];

    res.json({
      summaryCards,
      timeline: {
        labels: dateKeys,
        services: serviceRequestsTimeline,
        cafeteria: cafeteriaTimeline,
        finance: financeTimeline,
      },
      moduleShare,
      checklist,
      selectedModule,
      period,
    });
  } catch (error) {
    console.error('Admin analytics error:', error);
    res.status(500).json({ error: 'Не удалось собрать аналитику' });
  }
};
