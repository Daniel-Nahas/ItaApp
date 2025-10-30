// backend/src/server.ts
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import http from 'http';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import chatRoutes from './routes/chatRoutes';
import feedbackRoutes from './routes/feedbackRoutes';
import busRoutes from './routes/busRoutes';

import { pool } from './utils/db'; // garantir conexão ao banco

dotenv.config();

// Teste inicial da conexão
pool.connect()
  .then(() => console.log('Banco conectado com sucesso'))
  .catch(err => console.error('Erro ao conectar no banco:', err));

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

// Rotas principais
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/bus', busRoutes);

// Rota de teste
app.get('/', (req, res) => {
  res.send('API BusApp rodando corretamente!');
});

// WebSocket (Chat em tempo real)
io.on('connection', socket => {
  console.log('Cliente conectado:', socket.id);

  socket.on('send_message', data => {
    io.emit('receive_message', data);
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

const PORT = Number(process.env.PORT) || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
