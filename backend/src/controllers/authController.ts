// backend/src/controllers/authController.ts
import { Request, Response } from 'express';
import { pool } from '../utils/db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendEmail } from '../utils/mailer';
import dotenv from 'dotenv';
import { AuthRequest } from '../utils/middleware';

dotenv.config();

const TOKEN_EXPIRATION_HOURS = 2; // token válido por 2 horas
const FRONTEND_URL = process.env.FRONTEND_URL || '';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export const register = async (req: AuthRequest, res: Response) => {
  const { nome, email, senha, cpf } = req.body;

  if (!nome || !email || !senha || !cpf) {
    return res.status(400).json({ success: false, message: 'Todos os campos são obrigatórios' });
  }

  const emailRegex = /\S+@\S+\.\S+/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: 'Email inválido' });
  }

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing?.rowCount && existing.rowCount > 0) {
    return res.status(409).json({ success: false, message: 'Email já cadastrado' });
  }

  try {
    const hashed = await bcrypt.hash(senha, 10);
    const result = await pool.query(
      'INSERT INTO users (nome, email, senha_hash, cpf) VALUES ($1, $2, $3, $4) RETURNING id, nome, email',
      [nome, email, hashed, cpf]
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ success: true, token, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erro ao registrar usuário' });
  }
};

export const login = async (req: AuthRequest, res: Response) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ success: false, message: 'Email e senha são obrigatórios' });
  }

  try {
    const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userRes.rowCount === 0) {
      return res.status(400).json({ success: false, message: 'Usuário não encontrado' });
    }

    const user = userRes.rows[0];
    const match = await bcrypt.compare(senha, user.senha_hash);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Senha inválida' });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      success: true,
      token,
      user: { id: user.id, nome: user.nome, email: user.email }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erro ao autenticar' });
  }
};

export const profile = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.userId;
    if (!id) return res.status(401).json({ message: 'Usuário não autenticado' });

    const result = await pool.query(
      'SELECT id, nome, email, cpf, foto_url FROM users WHERE id = $1',
      [id]
    );

    if (result.rowCount === 0) return res.status(404).json({ message: 'Usuário não encontrado' });

    const user = result.rows[0];
    return res.json(user);
  } catch (err) {
    console.error('Erro em profile:', err);
    return res.status(500).json({ message: 'Erro ao buscar perfil' });
  }
};

export const forgotPassword = async (req: AuthRequest, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email é obrigatório' });

  try {
    const userRes = await pool.query('SELECT id, nome FROM users WHERE email = $1', [email]);
    if (userRes.rowCount === 0) {
      // para não vazar se o email existe, respondemos 200 mesmo quando não existir
      return res.json({ message: 'Se o email estiver cadastrado, você receberá instruções para redefinir a senha.' });
    }

    const user = userRes.rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRATION_HOURS * 60 * 60 * 1000);

    await pool.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, token, expiresAt]
    );

    // montar link — em app mobile normalmente envia token + instrução para abrir app;
    // aqui enviamos token e instruções (o usuário pode colar no app em "Redefinir senha")
    const resetLink = FRONTEND_URL ? `${FRONTEND_URL}/reset-password?token=${token}` : `Token: ${token}`;

    const html = `
      <p>Olá ${user.nome},</p>
      <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
      <p>Use o token abaixo no aplicativo para redefinir sua senha (válido por ${TOKEN_EXPIRATION_HOURS} horas):</p>
      <pre style="background:#f4f4f4;padding:10px;border-radius:4px;">${token}</pre>
      <p>Se o seu app aceitar links, você poderá usar este link: <a href="${resetLink}">${resetLink}</a></p>
      <p>Se não pediu essa alteração, ignore este email.</p>
    `;

    await sendEmail(email, 'Redefinição de senha - BusApp', html, `Token: ${token}`);

    return res.json({ message: 'Se o email estiver cadastrado, você receberá instruções para redefinir a senha.' });
  } catch (err) {
    console.error('Erro forgotPassword:', err);
    return res.status(500).json({ message: 'Erro ao processar solicitação' });
  }
};

export const resetPassword = async (req: AuthRequest, res: Response) => {
  const { token, senha } = req.body;
  if (!token || !senha) return res.status(400).json({ message: 'Token e nova senha são obrigatórios' });

  try {
    const tokenRes = await pool.query(
      'SELECT id, user_id, expires_at, used FROM password_reset_tokens WHERE token = $1',
      [token]
    );

    if (tokenRes.rowCount === 0) return res.status(400).json({ message: 'Token inválido' });

    const row = tokenRes.rows[0];
    if (row.used) return res.status(400).json({ message: 'Token já foi usado' });
    if (new Date(row.expires_at) < new Date()) return res.status(400).json({ message: 'Token expirado' });

    // validação da senha (mínimos) - manter coerência com frontend
    if (senha.length < 8) return res.status(400).json({ message: 'Senha deve ter pelo menos 8 caracteres' });

    const hash = await bcrypt.hash(senha, 10);
    await pool.query('UPDATE users SET senha_hash = $1 WHERE id = $2', [hash, row.user_id]);
    await pool.query('UPDATE password_reset_tokens SET used = TRUE WHERE id = $1', [row.id]);

    return res.json({ message: 'Senha redefinida com sucesso' });
  } catch (err) {
    console.error('Erro resetPassword:', err);
    return res.status(500).json({ message: 'Erro ao redefinir senha' });
  }
};

// Alterar senha autenticado (usuário logado) - já existe em userController updateUserPassword, mas caso queira repetir aqui:
export const changePasswordAuthenticated = async (req: AuthRequest, res: Response) => {
  const id = req.userId;
  const { currentPassword, newPassword } = req.body;
  if (!id) return res.status(401).json({ message: 'Usuário não autenticado' });
  if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Campos obrigatórios' });

  try {
    const userRes = await pool.query('SELECT senha_hash FROM users WHERE id = $1', [id]);
    if (userRes.rowCount === 0) return res.status(404).json({ message: 'Usuário não encontrado' });

    const match = await bcrypt.compare(currentPassword, userRes.rows[0].senha_hash);
    if (!match) return res.status(401).json({ message: 'Senha atual incorreta' });

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET senha_hash = $1 WHERE id = $2', [hash, id]);

    return res.json({ message: 'Senha alterada com sucesso' });
  } catch (err) {
    console.error('Erro changePasswordAuthenticated:', err);
    return res.status(500).json({ message: 'Erro ao alterar senha' });
  }
};

// ------------------------- NOVAS FUNÇÕES: fluxo seguro de Alterar Senha com confirmação por email -------------------------

// POST /auth/request-change-password
// Requer autenticação. Body: { currentPassword }
// Verifica senha atual, gera token, salva em password_reset_tokens e envia token por email.
export const requestChangePassword = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  const { currentPassword } = req.body;

  if (!userId) return res.status(401).json({ message: 'Usuário não autenticado' });
  if (!currentPassword) return res.status(400).json({ message: 'Senha atual é obrigatória' });

  try {
    const userRes = await pool.query('SELECT id, nome, email, senha_hash FROM users WHERE id = $1', [userId]);
    if (userRes.rowCount === 0) return res.status(404).json({ message: 'Usuário não encontrado' });

    const user = userRes.rows[0];
    const match = await bcrypt.compare(currentPassword, user.senha_hash);
    if (!match) return res.status(401).json({ message: 'Senha atual incorreta' });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRATION_HOURS * 60 * 60 * 1000);

    await pool.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [userId, token, expiresAt]
    );

    const resetLink = FRONTEND_URL ? `${FRONTEND_URL}/reset-password?token=${token}` : `Token: ${token}`;
    const html = `
      <p>Olá ${user.nome},</p>
      <p>Você solicitou alteração de senha no aplicativo. Use o token abaixo para confirmar a alteração (válido por ${TOKEN_EXPIRATION_HOURS} horas):</p>
      <pre style="background:#f4f4f4;padding:10px;border-radius:4px;">${token}</pre>
      <p>Se o seu app aceitar links, use: <a href="${resetLink}">${resetLink}</a></p>
      <p>Se você não solicitou, ignore esta mensagem.</p>
    `;

    await sendEmail(user.email, 'Confirmar alteração de senha - BusApp', html, `Token: ${token}`);

    return res.json({ message: 'Token de confirmação enviado por email.' });
  } catch (err) {
    console.error('Erro requestChangePassword:', err);
    return res.status(500).json({ message: 'Erro ao processar solicitação' });
  }
};

// POST /auth/confirm-change-password
// Requer autenticação. Body: { token, newPassword }
// Valida token, confere que pertence ao usuário autenticado, aplica nova senha e marca token como usado.
export const confirmChangePassword = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  const { token, newPassword } = req.body;

  if (!userId) return res.status(401).json({ message: 'Usuário não autenticado' });
  if (!token || !newPassword) return res.status(400).json({ message: 'Token e nova senha são obrigatórios' });

  try {
    const tokenRes = await pool.query(
      'SELECT id, user_id, expires_at, used FROM password_reset_tokens WHERE token = $1',
      [token]
    );
    if (tokenRes.rowCount === 0) return res.status(400).json({ message: 'Token inválido' });

    const row = tokenRes.rows[0];
    if (row.used) return res.status(400).json({ message: 'Token já usado' });
    if (row.user_id !== userId) return res.status(403).json({ message: 'Token não pertence ao usuário autenticado' });
    if (new Date(row.expires_at) < new Date()) return res.status(400).json({ message: 'Token expirado' });

    if (newPassword.length < 8) return res.status(400).json({ message: 'Senha deve ter pelo menos 8 caracteres' });

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET senha_hash = $1 WHERE id = $2', [hash, userId]);
    await pool.query('UPDATE password_reset_tokens SET used = TRUE WHERE id = $1', [row.id]);

    return res.json({ message: 'Senha alterada com sucesso' });
  } catch (err) {
    console.error('Erro confirmChangePassword:', err);
    return res.status(500).json({ message: 'Erro ao confirmar alteração de senha' });
  }
};
