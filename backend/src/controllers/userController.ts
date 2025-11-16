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
  try {
    // usar o id autenticado para evitar spoof
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Usuário não autenticado' });

    const result = await pool.query(
      `SELECT br.id, br.nome, COUNT(*)::int as total
       FROM user_route_searches urs
       JOIN bus_routes br ON br.id = urs.route_id
       WHERE urs.user_id = $1
       GROUP BY br.id, br.nome
       ORDER BY total DESC
       LIMIT 5`,
      [userId]
    );

    // garantir que total seja number
    const rows = result.rows.map((r: any) => ({ id: r.id, nome: r.nome, total: Number(r.total) }));
    res.json(rows);
  } catch (err) {
    console.error('getFavoriteRoutes error:', err);
    res.status(500).json({ message: 'Erro ao buscar rotas favoritas' });
  }
};

export const deleteAccount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Usuário não autenticado' });

    await pool.query('DELETE FROM users WHERE id = $1', [userId]);

    res.status(200).json({ message: 'Conta excluída com sucesso' });
  } catch (err) {
    console.error('deleteAccount error:', err);
    res.status(500).json({ message: 'Erro ao excluir conta' });
  }
};
export const registerRouteSearch = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { routeId } = req.body;
    if (!userId) return res.status(401).json({ message: 'Usuário não autenticado' });
    if (!routeId) return res.status(400).json({ message: 'routeId é obrigatório' });

    await pool.query(
      'INSERT INTO user_route_searches (user_id, route_id) VALUES ($1, $2)',
      [userId, routeId]
    );

    res.status(201).json({ message: 'Busca registrada' });
  } catch (err) {
    console.error('registerRouteSearch error:', err);
    res.status(500).json({ message: 'Erro ao registrar busca' });
  }
};