// backend/src/controllers/busController.ts
import { Request, Response } from 'express';
import { createRoute, getAllRoutes } from '../models/busModel';
import { pool } from '../utils/db';

// Definição das rotas
{/*const rota1Ida = [
  { lat: -24.1961, lng: -46.7750 },
  { lat: -24.1970, lng: -46.7745 },
  { lat: -24.1980, lng: -46.7740 },
  { lat: -24.1990, lng: -46.7735 },
  { lat: -24.2000, lng: -46.7730 },
  { lat: -24.2010, lng: -46.7725 },
  { lat: -24.2020, lng: -46.7720 },
  { lat: -24.2030, lng: -46.7715 },
  { lat: -24.2040, lng: -46.7710 },
  { lat: -24.2050, lng: -46.7705 }
];
const rota1Volta = [...rota1Ida].reverse();

const rota2Ida = [
  { lat: -24.1900, lng: -46.7755 },
  { lat: -24.1910, lng: -46.7750 },
  { lat: -24.1920, lng: -46.7745 },
  { lat: -24.1930, lng: -46.7740 },
  { lat: -24.1940, lng: -46.7735 },
  { lat: -24.1950, lng: -46.7730 },
  { lat: -24.1960, lng: -46.7725 },
  { lat: -24.1970, lng: -46.7720 },
  { lat: -24.1980, lng: -46.7715 },
  { lat: -24.1990, lng: -46.7710 }
];
const rota2Volta = [...rota2Ida].reverse();

const rota3Ida = [
  { lat: -24.1850, lng: -46.7800 },
  { lat: -24.1860, lng: -46.7795 },
  { lat: -24.1870, lng: -46.7790 },
  { lat: -24.1880, lng: -46.7785 },
  { lat: -24.1890, lng: -46.7780 },
  { lat: -24.1900, lng: -46.7775 },
  { lat: -24.1910, lng: -46.7770 },
  { lat: -24.1920, lng: -46.7765 },
  { lat: -24.1930, lng: -46.7760 },
  { lat: -24.1940, lng: -46.7755 }
];
const rota3Volta = [...rota3Ida].reverse();
// Função para garantir que as rotas existam
export const ensureRoutes = async () => {
  const routes = await getAllRoutes();
  if (routes.length === 0) {
    await createRoute({ nome: 'Guapura - Rodoviária', tipo: 'ida', pontos: rota1Ida });
    await createRoute({ nome: 'Rodoviária - Guapura', tipo: 'volta', pontos: rota1Volta });

    await createRoute({ nome: 'Gaivotas - Centro', tipo: 'ida', pontos: rota2Ida });
    await createRoute({ nome: 'Centro - Gaivotas', tipo: 'volta', pontos: rota2Volta });

    await createRoute({ nome: 'Loty - Centro', tipo: 'ida', pontos: rota3Ida });
    await createRoute({ nome: 'Centro - Loty', tipo: 'volta', pontos: rota3Volta });

    console.log('Rotas padrão inseridas no banco.');
  }
};
*/}

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

