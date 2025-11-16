// backend/src/controllers/busController.ts
import { Request, Response } from 'express';
import { createRoute, getAllRoutes } from '../models/busModel';
import { pool } from '../utils/db';

// Listar rotas
export const listRoutes = async (_req: Request, res: Response) => {
  try {
    const routes = await getAllRoutes();
    res.json(routes);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao listar rotas' });
  }
};

// Adicionar nova rota manualmente via API
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

// Rota banco de dados
export const getBusPositions = async (_req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT id, latitude, longitude FROM bus_positions');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar posições dos ônibus' });
  }
};

