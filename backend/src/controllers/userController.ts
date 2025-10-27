//backend/src/controllers/userController.ts
import { Request, Response } from 'express';
import { getUserById, updateUser, updatePhoto, updatePassword } from '../models/userModel';
import bcrypt from 'bcrypt';

export const fetchUser = async (req: Request, res: Response) => {
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

export const updateUserProfile = async (req: Request, res: Response) => {
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

export const updateUserPhoto = async (req: Request, res: Response) => {
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

export const updateUserPassword = async (req: Request, res: Response) => {
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
