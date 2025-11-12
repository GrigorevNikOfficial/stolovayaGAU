import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './src/config/database.js';

// Загружаем переменные окружения
dotenv.config();

// Подключаемся к БД
connectDB();

// Routes
import { router as userRoutes } from './src/routes/users.js';
import { router as itemRoutes } from './src/routes/items.js';
import { router as orderRoutes } from './src/routes/orders.js';
import { router as categoryRoutes } from './src/routes/categories.js';

const app = express();

// Middleware
app.use(cors({
  origin: '*', // Разрешить все домены (для тестирования)
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Подключаем роуты
app.use('/api/users', userRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});