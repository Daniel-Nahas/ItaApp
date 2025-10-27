//backend/src/models/busModel.ts
import { pool } from '../utils/db';

export interface BusRoute {
  id?: number;
  nome: string;
  tipo: string;
  pontos: any; // JSONB
}

export const getAllRoutes = async () => {
  const res = await pool.query('SELECT * FROM bus_routes ORDER BY id');
  return res.rows;
};

export const createRoute = async (route: BusRoute) => {
  const res = await pool.query(
    'INSERT INTO bus_routes (nome, tipo, pontos) VALUES ($1, $2, $3) RETURNING *',
    [route.nome, route.tipo, route.pontos]
  );
  return res.rows[0];
};
