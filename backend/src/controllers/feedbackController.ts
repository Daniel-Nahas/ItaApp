//backend/src/controllers/feedbackController.ts
import { Request, Response } from 'express';
import { createFeedback } from '../models/feedbackModel';
import { containsBadWords } from '../utils/profanityFilter';

export const addFeedback = async (req: Request, res: Response) => {
  const { estrelas, comentario } = req.body;
  if (!estrelas) return res.status(400).json({ message: 'Avaliação é obrigatória' });
  if (comentario && containsBadWords(comentario)) return res.status(400).json({ message: 'Comentário contém palavras inadequadas' });

  try {
    const feedback = await createFeedback({ user_id: req.userId!, estrelas, comentario });
    res.status(201).json(feedback);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao enviar feedback' });
  }
};
