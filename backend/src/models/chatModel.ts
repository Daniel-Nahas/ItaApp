//backend/src/models/chatModel.ts
import { pool } from '../utils/db';

export interface ChatMessage {
  id?: number;
  user_id: number;
  route_id: number;
  mensagem: string;
  created_at?: Date;
}

export const getMessagesByRoute = async (routeId: number) => {
  const res = await pool.query(
    'SELECT * FROM chat_messages WHERE route_id = $1 ORDER BY created_at ASC',
    [routeId]
  );
  return res.rows;
};

export const createMessage = async (msg: ChatMessage) => {
  const res = await pool.query(
    'INSERT INTO chat_messages (user_id, route_id, mensagem) VALUES ($1, $2, $3) RETURNING *',
    [msg.user_id, msg.route_id, msg.mensagem]
  );
  return res.rows[0];
};
