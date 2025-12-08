import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import connectDB from './src/config/database.js';
import { initSocketServer } from './src/services/socketService.js';

// Загружаем переменные окружения
dotenv.config();

// Подключаемся к БД
connectDB();

// Routes
import { router as categoryRoutes } from './src/routes/categories.js';
import { router as chatRoutes } from './src/routes/chats.js';
import { router as friendRoutes } from './src/routes/friends.js';
import { router as itemRoutes } from './src/routes/items.js';
import { router as orderRoutes } from './src/routes/orders.js';
import { router as settingsRoutes } from './src/routes/settings.js';
import { router as serviceRequestRoutes } from './src/routes/serviceRequests.js';
import { router as serviceRoutes } from './src/routes/services.js';
import { router as topUpRoutes } from './src/routes/topups.js';
import { router as userRoutes } from './src/routes/users.js';
import { router as paymentRoutes } from './src/routes/payments.js';
import { router as notificationRoutes } from './src/routes/notifications.js';
import { router as eventRoutes } from './src/routes/events.js';

const app = express();

// Middleware
app.use(cors({
  origin: '*', // Разрешить все домены (для тестирования)
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Подключаем роуты
app.use('/api/users', userRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/topups', topUpRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/service-requests', serviceRequestRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/events', eventRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

const server = http.createServer(app);

initSocketServer(server);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});