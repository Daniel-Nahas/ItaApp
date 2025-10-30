//backend/src/controllers/userController.ts
import { Response } from 'express';
import { AuthRequest } from '../utils/middleware';
import { getUserById, updateUser, updatePhoto, updatePassword } from '../models/userModel';
import bcrypt from 'bcrypt';
import { pool } from '../utils/db';

export const fetchUser = async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  if (req.userId !== id) {
  return res.status(403).json({ message: 'Acesso negado: usuário não autorizado' });
}
  try {
    const user = await getUserById(id);
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });
    res.json(user);
  } catch {
    res.status(500).json({ message: 'Erro ao buscar usuário' });
  }
};

export const updateUserProfile = async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  if (req.userId !== id) {
  return res.status(403).json({ message: 'Acesso negado: usuário não autorizado' });
}
  const { nome, email, cpf } = req.body;
  try {
    const updated = await updateUser(id, { nome, email, cpf });
    res.json(updated);
  } catch {
    res.status(500).json({ message: 'Erro ao atualizar perfil' });
  }
};

export const updateUserPhoto = async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  if (req.userId !== id) {
  return res.status(403).json({ message: 'Acesso negado: usuário não autorizado' });
}
  const { foto_url } = req.body;
  try {
    const updated = await updatePhoto(id, foto_url);
    res.json(updated);
  } catch {
    res.status(500).json({ message: 'Erro ao atualizar foto' });
  }
};

export const updateUserPassword = async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  if (req.userId !== id) {
  return res.status(403).json({ message: 'Acesso negado: usuário não autorizado' });
}
  const { senha } = req.body;
  try {
    const hash = await bcrypt.hash(senha, 10);
    const updated = await updatePassword(id, hash);
    res.json(updated);
  } catch {
    res.status(500).json({ message: 'Erro ao atualizar senha' });
  }
};

export const getFavoriteRoutes = async (req: AuthRequest, res: Response) => {
  const { id } = req.params; // id do usuário
  try {
    const result = await pool.query(
      `SELECT br.id, br.nome, COUNT(*) as total
       FROM user_route_searches urs
       JOIN bus_routes br ON br.id = urs.route_id
       WHERE urs.user_id = $1
       GROUP BY br.id, br.nome
       ORDER BY total DESC
       LIMIT 5`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao buscar rotas favoritas' });
  }
};