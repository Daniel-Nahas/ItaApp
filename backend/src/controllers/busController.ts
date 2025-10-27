//backend/src/controllers/busController.ts
import { Request, Response } from 'express';
import { createRoute, getAllRoutes } from '../models/busModel';

export const listRoutes = async (_req: Request, res: Response) => {
  try {
    const routes = await getAllRoutes();
    res.json(routes);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao listar rotas' });
  }
};

export const addRoute = async (req: Request, res: Response) => {
  const { nome, tipo, pontos } = req.body;
  if (!nome || !tipo || !pontos) return res.status(400).json({ message: 'Campos obrigatórios' });

  try {
    const route = await createRoute({ nome, tipo, pontos });
    res.status(201).json(route);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao criar rota' });
  }
};
