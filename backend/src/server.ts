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

// --------------------
// Conexão com DB
// --------------------
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

// --------------------
// Cache em memória das últimas posições
// Estrutura: Map<busId, { id: number, route_id: number, latitude, longitude, speed?, heading?, accuracy?, timestamp? }>
// --------------------
const lastPositions = new Map<number, any>();

// Helper: tentar persistir/atualizar posição no DB (opcional)
// Ajuste o SQL conforme sua tabela (bus_positions com chave bus_id)
async function upsertBusPositionToDb(pos: {
  id: number;
  route_id: number;
  latitude: number;
  longitude: number;
  speed?: number | null;
  heading?: number | null;
  accuracy?: number | null;
  timestamp?: number | null;
}) {
  try {
    await pool.query(
      `INSERT INTO bus_positions (bus_id, route_id, latitude, longitude, speed, heading, accuracy, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, to_timestamp($8/1000.0))
       ON CONFLICT (bus_id) DO UPDATE
         SET route_id = EXCLUDED.route_id,
             latitude = EXCLUDED.latitude,
             longitude = EXCLUDED.longitude,
             speed = EXCLUDED.speed,
             heading = EXCLUDED.heading,
             accuracy = EXCLUDED.accuracy,
             updated_at = EXCLUDED.updated_at`,
      [
        pos.id,
        pos.route_id,
        pos.latitude,
        pos.longitude,
        pos.speed ?? null,
        pos.heading ?? null,
        pos.accuracy ?? null,
        pos.timestamp ?? Date.now(),
      ]
    );
  } catch (err) {
    console.warn('Falha ao persistir posição no DB (não crítico):', err);
  }
}

// --------------------
// Socket.IO
// --------------------
io.on('connection', socket => {
  console.log('Cliente conectado:', socket.id);

  // tenta extrair token da query ou do Authorization header da handshake
  const rawToken =
    (socket.handshake.query && (socket.handshake.query as any).token) ||
    socket.handshake.headers?.authorization;
  let socketUserId: number | null = null;
  let socketUserRole: string | null = null; // opcional: se seu token tem role (ex.: 'driver')
  if (rawToken) {
    try {
      const tokenStr = (rawToken as string).startsWith('Bearer ')
        ? (rawToken as string).split(' ')[1]
        : (rawToken as string);
      const decoded = jwt.verify(tokenStr, JWT_SECRET) as any;
      socketUserId = decoded?.id ?? null;
      socketUserRole = decoded?.role ?? null;
    } catch (err) {
      console.warn('Token inválido no handshake do socket', socket.id);
      socketUserId = null;
    }
  }

  // --- Join / Leave rooms (por rota) ---
  socket.on('join_room', (routeId: number) => {
    if (!routeId) return;
    const room = `route_${routeId}`;
    socket.join(room);
    console.log(`Socket ${socket.id} entrou na sala ${room}`);

    // Ao entrar, emite snapshot das últimas posições daquele routeId (se houver)
    const snapshot = Array.from(lastPositions.values()).filter((p: any) => Number(p.route_id) === Number(routeId));
    if (snapshot.length > 0) {
      socket.emit('bus_positions_snapshot', snapshot);
    } else {
      // fallback: carregar do DB se o cache estiver vazio
      (async () => {
        try {
          const res = await pool.query(
            `SELECT bus_id AS id, route_id, latitude, longitude, speed, heading, accuracy, extract(epoch from updated_at)*1000 AS timestamp
             FROM bus_positions WHERE route_id = $1`,
            [routeId]
          );
          if (res && res.rows && res.rows.length) {
            const rows = res.rows.map((r: any) => ({
              id: r.id,
              route_id: r.route_id,
              latitude: Number(r.latitude),
              longitude: Number(r.longitude),
              speed: r.speed,
              heading: r.heading,
              accuracy: r.accuracy,
              timestamp: Number(r.timestamp),
            }));
            if (rows.length) socket.emit('bus_positions_snapshot', rows);
          }
        } catch (err) {
          // não bloqueia o join
        }
      })();
    }
  });

  socket.on('leave_room', (routeId: number) => {
    if (!routeId) return;
    const room = `route_${routeId}`;
    socket.leave(room);
    console.log(`Socket ${socket.id} saiu da sala ${room}`);
  });

  // --------------------
  // Chat (mantive seu handler)
  // --------------------
  socket.on('send_message', async (payload: any) => {
    try {
      const { userId, user, text, foto_url, routeId, clientId } = payload || {};
      if (!text || !routeId) return;

      const authorId = socketUserId || userId || null;

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
        clientId: clientId || null
      };

      const room = `route_${routeId}`;
      socket.to(room).emit('receive_message', messageToEmit);
      socket.emit('message_sent_ack', { ...messageToEmit, ok: true });
    } catch (err) {
      console.error('Erro processando send_message socket:', err);
    }
  });

  // --------------------
  // Novo: motorista envia atualização de posição
  // payload esperado: { routeId, busId, latitude, longitude, speed?, heading?, accuracy?, timestamp? }
  // --------------------
  socket.on('driver_position_update', async (payload: any) => {
    try {
      if (!payload) return;
      const {
        routeId,
        busId,
        latitude,
        longitude,
        speed = null,
        heading = null,
        accuracy = null,
        timestamp = Date.now(),
      } = payload as any;

      if (!routeId || !busId || typeof latitude === 'undefined' || typeof longitude === 'undefined') {
        return; // inválido
      }

      // OPTIONAL: validação de autorização
      // Se quiser garantir que apenas o motorista autorizado envie posições para um determinado busId/routeId,
      // verifique socketUserId e permissões aqui (ex.: isDriverOfBus(socketUserId, busId))
      // Example (uncomment and adapt if you have buses table):
      // if (socketUserId) {
      //   const r = await pool.query('SELECT driver_id FROM buses WHERE id = $1', [busId]);
      //   if (r.rowCount === 0 || r.rows[0].driver_id !== socketUserId) return;
      // }

      const posRecord = {
        id: Number(busId),
        route_id: Number(routeId),
        latitude: Number(latitude),
        longitude: Number(longitude),
        speed: speed != null ? Number(speed) : null,
        heading: heading != null ? Number(heading) : null,
        accuracy: accuracy != null ? Number(accuracy) : null,
        timestamp: Number(timestamp),
      };

      // Atualiza cache em memória
      lastPositions.set(posRecord.id, posRecord);

      // Persistência opcional (não bloqueante)
      upsertBusPositionToDb(posRecord).catch(() => { /* erros já tratados internamente */ });

      // Emite para todos na sala da rota
      const room = `route_${routeId}`;
      io.to(room).emit('bus_position_update', posRecord);
    } catch (err) {
      console.error('Erro driver_position_update:', err);
    }
  });

  // Opcional: cliente pode solicitar snapshot sob demanda
  socket.on('bus_request_latest', async (payload: any) => {
    try {
      const routeId = payload?.routeId ?? payload;
      if (!routeId) return;
      const snapshot = Array.from(lastPositions.values()).filter((p: any) => Number(p.route_id) === Number(routeId));
      if (snapshot.length > 0) {
        socket.emit('bus_positions_snapshot', snapshot);
        return;
      }
      // fallback: buscar do DB
      const res = await pool.query(
        `SELECT bus_id AS id, route_id, latitude, longitude, speed, heading, accuracy, extract(epoch from updated_at)*1000 AS timestamp
         FROM bus_positions WHERE route_id = $1`,
        [routeId]
      );
      if (res && res.rows) {
        const rows = res.rows.map((r: any) => ({
          id: r.id,
          route_id: r.route_id,
          latitude: Number(r.latitude),
          longitude: Number(r.longitude),
          speed: r.speed,
          heading: r.heading,
          accuracy: r.accuracy,
          timestamp: Number(r.timestamp),
        }));
        if (rows.length) socket.emit('bus_positions_snapshot', rows);
      }
    } catch (err) {
      console.warn('Erro bus_request_latest:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
    // opcional: limpar posições associadas ao socket (se você mantiver mapping socket->busId)
  });
});

const PORT = Number(process.env.PORT) || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});