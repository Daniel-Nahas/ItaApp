//backend/src/models/feedbackModel.ts
import { pool } from '../utils/db';

export interface FeedbackType {
  id?: number;
  user_id: number;
  estrelas: number;
  comentario?: string;
  created_at?: Date;
}

export const createFeedback = async (feedback: FeedbackType) => {
  const res = await pool.query(
    'INSERT INTO feedbacks (user_id, estrelas, comentario) VALUES ($1, $2, $3) RETURNING *',
    [feedback.user_id, feedback.estrelas, feedback.comentario]
  );
  return res.rows[0];
};

export const getAllFeedback = async () => {
  const res = await pool.query('SELECT * FROM feedbacks ORDER BY created_at DESC');
  return res.rows;
};
