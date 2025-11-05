// backend/src/utils/mailer.ts
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT) || 587;
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const from = process.env.SMTP_FROM || user;

if (!host || !user || !pass) {
  console.warn('Aviso: variáveis SMTP não configuradas - emails não serão enviados.');
}

export const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465, // true p/ 465, false p/ 587
  auth: {
    user,
    pass,
  },
});

export const sendEmail = async (to: string, subject: string, html: string, text?: string) => {
  if (!host || !user || !pass) {
    console.warn('SMTP não configurado. Email não enviado. Destinatário:', to);
    return;
  }
  await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });
};