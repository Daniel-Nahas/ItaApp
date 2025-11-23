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
    // retorna última posição por veículo (bus_id) incluindo route_id e meta
    const result = await pool.query(
      `SELECT bus_id AS id, route_id, latitude, longitude, speed, heading, accuracy,
              extract(epoch from updated_at)*1000 AS timestamp
       FROM bus_positions`
    );
    const rows = result.rows.map((r: any) => ({
      id: r.id,
      route_id: r.route_id,
      latitude: Number(r.latitude),
      longitude: Number(r.longitude),
      speed: r.speed,
      heading: r.heading,
      accuracy: r.accuracy,
      timestamp: Number(r.timestamp),
    }));
    res.json(rows);
  } catch (err) {
    console.error('Erro ao buscar posições dos ônibus', err);
    res.status(500).json({ message: 'Erro ao buscar posições dos ônibus' });
  }
};

