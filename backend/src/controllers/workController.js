import { Work } from '../models/Work.js';
import { User } from '../models/User.js';

export const listWork = async (req, res) => {
  const role = req.user.role;
  const userId = req.user._id.toString();
  const view = req.query.view;

  let filter = {};

  if (role === 'admin') {
    if (view === 'mine') {
      filter.createdBy = userId;
    }
  } else if (role === 'workAdmin') {
    filter.createdBy = userId;
    if (view === 'all') {
      filter = {};
    }
  } else {
    filter.status = 'open';
  }

  const rawItems = await Work.find(filter)
    .sort({ createdAt: -1 })
    .populate('createdBy', 'first_name last_name')
    .populate('applications.user', 'first_name last_name')
    .lean();

  const items = rawItems.map(item => {
    const isOwner = item.createdBy?.toString?.() === userId || (item.createdBy?._id && item.createdBy._id.toString() === userId);
    if (!isOwner && role !== 'admin') {
      return { ...item, applications: [] };
    }
    return item;
  });

  res.json({ items });
};

export const createWork = async (req, res) => {
  const { title, description, location, salaryText } = req.body;
  const userId = req.user.id;

  if (!title || !description) {
    return res.status(400).json({ message: 'Требуются название и описание' });
  }

  const item = await Work.create({
    title,
    description,
    location: location || '',
    salaryText: salaryText || '',
    createdBy: userId,
  });

  res.status(201).json({ item });
};

export const applyWork = async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;
  const userId = req.user.id;

   if (['admin', 'workAdmin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Администратор не может откликаться' });
  }

  const item = await Work.findById(id);
  if (!item) {
    return res.status(404).json({ message: 'Вакансия не найдена' });
  }
  if (item.status !== 'open') {
    return res.status(400).json({ message: 'Вакансия закрыта' });
  }
  const already = item.applications.find(app => app.user.toString() === userId);
  if (already) {
    return res.status(400).json({ message: 'Вы уже откликались' });
  }
  item.applications.push({ user: userId, message: message || '' });
  await item.save();
  res.json({ item });
};

export const respondWork = async (req, res) => {
  const { id, userId } = req.params;
  const { action } = req.body; // accept | decline
  const requesterId = req.user.id;

  const item = await Work.findById(id);
  if (!item) {
    return res.status(404).json({ message: 'Вакансия не найдена' });
  }
  if (item.createdBy.toString() !== requesterId && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Нет прав' });
  }
  const app = item.applications.find(a => a.user.toString() === userId);
  if (!app) {
    return res.status(404).json({ message: 'Отклик не найден' });
  }
  if (!['accept', 'decline'].includes(action)) {
    return res.status(400).json({ message: 'Некорректное действие' });
  }
  app.status = action === 'accept' ? 'accepted' : 'declined';
  await item.save();
  res.json({ item });
};

export const myWorkApplications = async (req, res) => {
  const userId = req.user.id;
  const items = await Work.find({ 'applications.user': userId })
    .populate('createdBy', 'first_name last_name')
    .lean();
  res.json({ items });
};

export const workDetail = async (req, res) => {
  const { id } = req.params;
  const item = await Work.findById(id)
    .populate('createdBy', 'first_name last_name')
    .populate('applications.user', 'first_name last_name');
  if (!item) {
    return res.status(404).json({ message: 'Вакансия не найдена' });
  }

  const requesterId = req.user._id.toString();
  const isOwner = item.createdBy?.toString?.() === requesterId || (item.createdBy?._id && item.createdBy._id.toString() === requesterId);
  if (!isOwner && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Нет прав' });
  }
  res.json({ item });
};