import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { testConnection } from './src/config/database.js';
import authRoutes from './src/routes/authRoutes.js';
import itemRoutes from './src/routes/itemRoutes.js';
import orderRoutes from './src/routes/orderRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/orders', orderRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Stolovaya GAU API is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler (detailed and friendly)
app.use((err, req, res, next) => {
  console.error('Error handler:', err);
  // Try to infer HTTP status
  const status = err.status || err.statusCode || 500;

  // Known MySQL duplicate key
  if (err.code === 'ER_DUP_ENTRY' || err.errno === 1062) {
    return res.status(409).json({ error: 'Пользователь с таким телефоном или почтой уже существует' });
  }

  // JWT errors etc. can bubble up with message
  const message = err.message || 'Внутренняя ошибка сервера';
  res.status(status).json({ error: message });
});

app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  await testConnection();
});