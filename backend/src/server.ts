// backend/src/server.ts
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import http from 'http';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import chatRoutes from './routes/chatRoutes';
import feedbackRoutes from './routes/feedbackRoutes';
import busRoutes from './routes/busRoutes';

import { pool } from './utils/db';
import { createMessage } from './models/chatModel';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

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
app.get('/', (_req, res) => {
  res.send('API BusApp rodando corretamente!');
});

// WebSocket (Chat em tempo real) com salas por route e persistência
io.on('connection', socket => {
  console.log('Cliente conectado:', socket.id);

  // tenta extrair token da query ou do Authorization header da handshake
  const rawToken =
    (socket.handshake.query && (socket.handshake.query as any).token) ||
    socket.handshake.headers?.authorization;
  let socketUserId: number | null = null;
  if (rawToken) {
    try {
      const tokenStr = (rawToken as string).startsWith('Bearer ')
        ? (rawToken as string).split(' ')[1]
        : (rawToken as string);
      const decoded = jwt.verify(tokenStr, JWT_SECRET) as any;
      socketUserId = decoded?.id ?? null;
    } catch (err) {
      console.warn('Token inválido no handshake do socket', socket.id);
      socketUserId = null;
    }
  }

  // Entrar em sala por rota
  socket.on('join_room', (routeId: number) => {
    if (!routeId) return;
    const room = `route_${routeId}`;
    socket.join(room);
    console.log(`Socket ${socket.id} entrou na sala ${room}`);
  });

  // Sair da sala
  socket.on('leave_room', (routeId: number) => {
    if (!routeId) return;
    const room = `route_${routeId}`;
    socket.leave(room);
    console.log(`Socket ${socket.id} saiu da sala ${room}`);
  });

  // Espera payload: { userId, user, text, foto_url, routeId, clientId? }
  socket.on('send_message', async (payload: any) => {
    try {
      const { userId, user, text, foto_url, routeId, clientId } = payload || {};
      if (!text || !routeId) return;

      // Use user id do token se disponível para evitar spoof
      const authorId = socketUserId || userId || null;

      // Persistir no DB (tolerante a falhas de persistência)
      try {
        await createMessage({
          user_id: authorId,
          route_id: routeId,
          mensagem: text
        } as any);
      } catch (err) {
        console.warn('Erro ao persistir mensagem:', err);
      }

      const messageToEmit = {
        userId: authorId,
        user: user || 'Anônimo',
        text,
        foto_url: foto_url || null,
        routeId,
        createdAt: new Date(),
        clientId: clientId || null // opcional para deduplicação cliente
      };

      // Emite para a sala EXCLUINDO o próprio socket (evita eco)
      const room = `route_${routeId}`;
      socket.to(room).emit('receive_message', messageToEmit);

      // Opcional: se quiser que o emissor receba confirmação/versão oficial do servidor,
      // podemos emitir um ack apenas para o socket:
      socket.emit('message_sent_ack', { ...messageToEmit, ok: true });
    } catch (err) {
      console.error('Erro processando send_message socket:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

const PORT = Number(process.env.PORT) || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});