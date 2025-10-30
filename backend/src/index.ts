/*backend/src/index.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './utils/db';

import authRoutes from './routes/authRoutes';
import chatRoutes from './routes/chatRoutes';
import feedbackRoutes from './routes/feedbackRoutes';
import busRoutes from './routes/busRoutes';

import { Request } from 'express';

declare module 'express-serve-static-core' {
  interface Request {
    userId?: number;
  }
}

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/bus', busRoutes);

app.get('/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nome, email FROM users');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erro ao buscar usuários' });
  }
});

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, '0.0.0.0', () =>
  console.log(`Servidor rodando na porta ${PORT}`)
);
*/