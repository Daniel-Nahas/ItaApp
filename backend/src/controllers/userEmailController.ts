// backend/src/controllers/userEmailController.ts
import { Request, Response } from 'express';
import { pool } from '../utils/db';
import crypto from 'crypto';
import { sendEmail } from '../utils/mailer';
import { AuthRequest } from '../utils/middleware';

const TOKEN_EXPIRATION_MINUTES = 60; // válido por 60 minutos

export const requestEmailChange = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Usuário não autenticado' });

    const { newEmail } = req.body;
    if (!newEmail || typeof newEmail !== 'string') return res.status(400).json({ message: 'E-mail inválido' });

    // opcional: checar se email já pertence a outro usuário
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [newEmail]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'E-mail já está em uso' });
    }

    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRATION_MINUTES * 60 * 1000);

    await pool.query(
      'INSERT INTO email_change_tokens (user_id, new_email, token, expires_at) VALUES ($1, $2, $3, $4)',
      [userId, newEmail, token, expiresAt]
    );

    // montar link de verificação (pode apontar para frontend que chama /api/users/email/confirm)
    const frontendUrl = process.env.FRONTEND_URL || process.env.APP_URL || '';
    const verificationLink = frontendUrl ? `${frontendUrl}/confirm-email?token=${token}` : `${process.env.APP_URL || ''}/api/users/email/confirm?token=${token}`;

    // enviar email usando sendEmail (mailer já existe)
    const subject = 'Confirme seu novo e‑mail';
    const html = `<p>Olá,</p>
      <p>Você solicitou a alteração do seu e‑mail para <strong>${newEmail}</strong>.</p>
      <p>Clique no link abaixo para confirmar a alteração (válido por ${TOKEN_EXPIRATION_MINUTES} minutos):</p>
      <p><a href="${verificationLink}">${verificationLink}</a></p>
      <p>Se você não solicitou essa alteração, ignore este e‑mail.</p>`;
    const text = `Confirme seu novo e‑mail visitando: ${verificationLink}`;

    try {
      await sendEmail(newEmail, subject, html, text);
    } catch (mailErr) {
      console.warn('Falha ao enviar e-mail de verificação:', mailErr);
      // não falhar a operação do token; apenas avisar que envio falhou
      return res.status(200).json({ message: 'Token gerado, porém falha ao enviar e-mail. Contate o suporte.' });
    }

    res.status(200).json({ message: 'E-mail de verificação enviado' });
  } catch (err) {
    console.error('requestEmailChange error:', err);
    res.status(500).json({ message: 'Erro ao processar solicitação' });
  }
};

export const confirmEmailChange = async (req: Request, res: Response) => {
  try {
    // aceitar token no body ou na query (para suportar link direto)
    const token = (req.body && req.body.token) || (req.query && String(req.query.token));
    if (!token) return res.status(400).json({ message: 'Token é obrigatório' });

    const result = await pool.query('SELECT * FROM email_change_tokens WHERE token = $1', [token]);
    const row = result.rows[0];
    if (!row) return res.status(400).json({ message: 'Token inválido' });
    if (row.used) return res.status(400).json({ message: 'Token já utilizado' });
    if (new Date(row.expires_at) < new Date()) return res.status(400).json({ message: 'Token expirado' });

    // atualizar email do usuário, checando se não existe outro usuário com esse e‑mail
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [row.new_email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'E-mail já em uso por outro usuário' });
    }

    await pool.query('UPDATE users SET email = $1 WHERE id = $2', [row.new_email, row.user_id]);
    await pool.query('UPDATE email_change_tokens SET used = true WHERE id = $1', [row.id]);

    res.status(200).json({ message: 'E-mail atualizado com sucesso' });
  } catch (err) {
    console.error('confirmEmailChange error:', err);
    res.status(500).json({ message: 'Erro ao confirmar alteração de e-mail' });
  }
};
