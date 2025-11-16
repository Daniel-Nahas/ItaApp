// backend/src/utils/profanityFilter.ts
const Palavroes = [
  "merda", "bosta", "porra", "caralho", "puta", "filhodaputa", "otario", "otaria", "fdp",
  "vagabundo", "vagabunda", "arrombado", "vaca", "piranha", "fuck", "shit",
  "bitch", "asshole", "motherfucker", "mierda", "gilipollas"
];

const LEET_MAP: Record<string, string> = {
  '4': 'a', '@': 'a',
  '3': 'e',
  '1': 'i', '!' : 'i', '|' : 'i',
  '0': 'o',
  '5': 's', '$': 's',
  '7': 't',
  '2': 'r',
  '9': 'g',
  '8': 'b',
  '6': 'g'
};

const normalizeText = (msg: string) => {
  if (!msg) return '';
  let s = msg.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  s = s.split('').map(ch => LEET_MAP[ch] || ch).join('');
  s = s.replace(/[^a-z0-9\s]/g, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
};

/**
 * Gera "iniciais" apenas quando bad contém pelo menos 2 tokens separados por não alfanuméricos
 * e garante que initials tenha pelo menos 2 caracteres (evita matches por 1 letra somente).
 */
const getInitialsIfMultiToken = (bad: string) => {
  const parts = bad.split(/[^a-z0-9]+/).filter(Boolean);
  if (parts.length < 2) return '';
  const initials = parts.map(w => w[0]).join('');
  return initials.length >= 2 ? initials : '';
};

export const containsBadWords = (msg: string) => {
  const clean = normalizeText(msg);
  if (!clean) return false;

  // tokens da mensagem
  const words = clean.split(' ').filter(Boolean);

  // 1) checagem por token exato rápido (mais seguro)
  for (const w of words) {
    if (Palavroes.includes(w)) return true;
  }

  // 2) checagem de siglas explícitas (lista controlada)
  const SIGLAS = ['fdp','pqp','vcf','vag'];
  for (const token of words) {
    if (SIGLAS.includes(token)) return true;
  }

  // 3) checagem por substring em casos legítimos (covers tentativas como "b0sta" -> "bosta")
  // mas mantenha isso depois das checagens por token para reduzir falsos positivos
  for (const bad of Palavroes) {
    if (clean.includes(bad)) return true;
  }

  // 4) checagem de acrônimos apenas para palavras ruins compostas (ex.: "filho da puta" -> fdp)
  for (const bad of Palavroes) {
    const initials = getInitialsIfMultiToken(bad);
    if (initials && clean.includes(initials)) return true;
  }

  return false;
};