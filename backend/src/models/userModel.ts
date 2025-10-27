//backend/src/models/userModel.ts
import { pool } from '../utils/db';

export const getUserById = async (id: number) => {
  const res = await pool.query(
    'SELECT id, nome, email, cpf, foto_url FROM users WHERE id = $1',
    [id]
  );
  return res.rows[0];
};

export const updateUser = async (
  id: number,
  data: { nome?: string; email?: string; cpf?: string }
) => {
  const res = await pool.query(
    'UPDATE users SET nome = $1, email = $2, cpf = $3 WHERE id = $4 RETURNING id, nome, email, cpf, foto_url',
    [data.nome, data.email, data.cpf, id]
  );
  return res.rows[0];
};

export const updatePhoto = async (id: number, foto_url: string) => {
  const res = await pool.query(
    'UPDATE users SET foto_url = $1 WHERE id = $2 RETURNING id, nome, email, cpf, foto_url',
    [foto_url, id]
  );
  return res.rows[0];
};

export const updatePassword = async (id: number, senha_hash: string) => {
  const res = await pool.query(
    'UPDATE users SET senha_hash = $1 WHERE id = $2 RETURNING id',
    [senha_hash, id]
  );
  return res.rows[0];
};
