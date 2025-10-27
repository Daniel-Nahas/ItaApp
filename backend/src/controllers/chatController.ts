//backend/src/controllers/chatController.ts
import { Request, Response } from 'express';
import { createMessage, getMessagesByRoute } from '../models/chatModel';
import { containsBadWords } from '../utils/profanityFilter';

export const sendMessage = async (req: Request, res: Response) => {
  const { mensagem, route_id } = req.body;
  if (!mensagem || !route_id) return res.status(400).json({ message: 'Mensagem e rota obrigatórias' });
  if (containsBadWords(mensagem)) return res.status(400).json({ message: 'Mensagem contém palavras inadequadas' });

  try {
    const msg = await createMessage({ user_id: req.userId!, route_id, mensagem });
    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao enviar mensagem' });
  }
};

export const getMessages = async (req: Request, res: Response) => {
  const routeId = Number(req.params.routeId);
  try {
    const messages = await getMessagesByRoute(routeId);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao obter mensagens' });
  }
};

