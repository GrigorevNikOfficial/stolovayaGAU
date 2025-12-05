import { ServiceListing } from '../models/ServiceListing.js';
import { ServiceRequest } from '../models/ServiceRequest.js';
import {
  emitMarketplaceListingCreated,
  emitMarketplaceListingDeleted,
  emitMarketplaceListingUpdated,
} from '../services/socketService.js';

const mapListingResponse = (listing) => ({
  id: listing._id,
  title: listing.title,
  description: listing.description,
  category: listing.category,
  price: listing.price,
  pricingType: listing.pricingType,
  tags: listing.tags,
  skills: listing.skills,
  location: listing.location,
  availability: listing.availability,
  rating: listing.rating,
  reviewsCount: listing.reviewsCount,
  views: listing.views,
  completedOrders: listing.completedOrders,
  isActive: listing.isActive,
  portfolio: listing.portfolio,
  attachments: listing.attachments,
  createdAt: listing.createdAt,
  updatedAt: listing.updatedAt,
  owner: listing.userId
    ? {
        id: listing.userId._id,
        firstName: listing.userId.first_name,
        lastName: listing.userId.last_name,
        role: listing.userId.role,
        avatar: listing.userId.avatar,
      }
    : undefined,
});

const parseNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const createServiceListing = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      price,
      pricingType = 'fixed',
      tags = [],
      skills = [],
      location = '',
      availability,
      portfolio = [],
      attachments = [],
    } = req.body;

    if (!title || !description || !category || price === undefined) {
      return res.status(400).json({ error: 'Не заполнены обязательные поля: title, description, category, price' });
    }

    const numericPrice = parseNumber(price, NaN);
    if (Number.isNaN(numericPrice) || numericPrice < 0) {
      return res.status(400).json({ error: 'Цена должна быть неотрицательным числом' });
    }

    const listing = await ServiceListing.create({
      userId: req.user._id,
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      price: numericPrice,
      pricingType,
      tags,
      skills,
      location,
      availability,
      portfolio,
      attachments,
    });

    const populatedListing = await listing.populate('userId', 'first_name last_name role avatar');
    const responsePayload = mapListingResponse(populatedListing);

    res.status(201).json(responsePayload);
    emitMarketplaceListingCreated(responsePayload);
  } catch (error) {
    console.error('Create service listing error:', error);
    res.status(500).json({ error: 'Не удалось создать услугу' });
  }
};

export const getServiceListings = async (req, res) => {
  try {
    const {
      category,
      search,
      minPrice,
      maxPrice,
      pricingType,
      sort = 'newest',
      page = 1,
      limit = 12,
      includeInactive,
      userId,
    } = req.query;

    const filter = {};

    if (category) filter.category = category;
    if (pricingType) filter.pricingType = pricingType;
    if (!includeInactive || includeInactive !== 'true') {
      filter.isActive = true;
    }

    if (userId) {
      filter.userId = userId;
    }

    const priceFilter = {};
    const numericMin = parseNumber(minPrice, undefined);
    const numericMax = parseNumber(maxPrice, undefined);
    if (numericMin !== undefined) priceFilter.$gte = numericMin;
    if (numericMax !== undefined) priceFilter.$lte = numericMax;
    if (Object.keys(priceFilter).length) filter.price = priceFilter;

    if (search) {
      filter.$text = { $search: search };
    }

    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      rating: { rating: -1, reviewsCount: -1 },
    }[sort] || { createdAt: -1 };

    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const limitNumber = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
    const skip = (pageNumber - 1) * limitNumber;

    const [items, total] = await Promise.all([
      ServiceListing.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNumber)
        .populate('userId', 'first_name last_name role avatar'),
      ServiceListing.countDocuments(filter),
    ]);

    res.json({
      data: items.map(mapListingResponse),
      pagination: {
        total,
        page: pageNumber,
        pages: Math.ceil(total / limitNumber) || 1,
        limit: limitNumber,
      },
    });
  } catch (error) {
    console.error('Get service listings error:', error);
    res.status(500).json({ error: 'Не удалось получить список услуг' });
  }
};

export const getServiceListingById = async (req, res) => {
  try {
    const { id } = req.params;

    const listing = await ServiceListing.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate('userId', 'first_name last_name role avatar');

    if (!listing) {
      return res.status(404).json({ error: 'Услуга не найдена' });
    }

    res.json(mapListingResponse(listing));
  } catch (error) {
    console.error('Get service listing error:', error);
    res.status(500).json({ error: 'Не удалось получить данные услуги' });
  }
};

export const getMyServiceListings = async (req, res) => {
  try {
    const listings = await ServiceListing.find({ userId: req.user._id })
      .sort({ updatedAt: -1 })
      .populate('userId', 'first_name last_name role avatar');

    res.json(listings.map(mapListingResponse));
  } catch (error) {
    console.error('Get my service listings error:', error);
    res.status(500).json({ error: 'Не удалось получить услуги пользователя' });
  }
};

export const updateServiceListing = async (req, res) => {
  try {
    const { id } = req.params;
    const listing = await ServiceListing.findById(id);

    if (!listing) {
      return res.status(404).json({ error: 'Услуга не найдена' });
    }

    const isOwner = listing.userId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Недостаточно прав для изменения услуги' });
    }

    const allowedFields = [
      'title',
      'description',
      'category',
      'price',
      'pricingType',
      'tags',
      'skills',
      'location',
      'availability',
      'portfolio',
      'attachments',
    ];

    allowedFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        listing[field] = req.body[field];
      }
    });

    if (Object.prototype.hasOwnProperty.call(req.body, 'price')) {
      const numericPrice = parseNumber(req.body.price, NaN);
      if (Number.isNaN(numericPrice) || numericPrice < 0) {
        return res.status(400).json({ error: 'Цена должна быть неотрицательным числом' });
      }
      listing.price = numericPrice;
    }

    await listing.save();

    const populated = await listing.populate('userId', 'first_name last_name role avatar');
    const responsePayload = mapListingResponse(populated);

    res.json(responsePayload);
    emitMarketplaceListingUpdated(responsePayload);
  } catch (error) {
    console.error('Update service listing error:', error);
    res.status(500).json({ error: 'Не удалось обновить услугу' });
  }
};

export const toggleServiceListingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'Поле isActive должно быть булевым значением' });
    }

    const listing = await ServiceListing.findById(id);

    if (!listing) {
      return res.status(404).json({ error: 'Услуга не найдена' });
    }

    const isOwner = listing.userId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Недостаточно прав для изменения статуса' });
    }

    listing.isActive = isActive;
    await listing.save();

    const populated = await listing.populate('userId', 'first_name last_name role avatar');
    const responsePayload = mapListingResponse(populated);

    res.json(responsePayload);
    emitMarketplaceListingUpdated(responsePayload);
  } catch (error) {
    console.error('Toggle service listing status error:', error);
    res.status(500).json({ error: 'Не удалось изменить статус услуги' });
  }
};

export const deleteServiceListing = async (req, res) => {
  try {
    const { id } = req.params;

    const listing = await ServiceListing.findById(id);

    if (!listing) {
      return res.status(404).json({ error: 'Услуга не найдена' });
    }

    const isOwner = listing.userId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Недостаточно прав для удаления услуги' });
    }

    const blockingStatuses = ['pending', 'accepted', 'in_progress', 'completed'];
    const hasActiveRequests = await ServiceRequest.exists({
      serviceId: listing._id,
      status: { $in: blockingStatuses },
    });

    if (hasActiveRequests) {
      return res
        .status(400)
        .json({ error: 'Нельзя удалить услугу: по ней есть активные заявки' });
    }

    const listingId = listing._id.toString();
    const ownerId = listing.userId.toString();

    await ServiceListing.deleteOne({ _id: listing._id });

    res.json({ success: true });
    emitMarketplaceListingDeleted({ id: listingId, ownerId });
  } catch (error) {
    console.error('Delete service listing error:', error);
    res.status(500).json({ error: 'Не удалось удалить услугу' });
  }
};
