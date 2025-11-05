// backend/src/utils/profanityFilter.ts
const Palavroes = [
  "merda", "bosta", "porra", "caralho", "puta", "filhodaputa", "otario", "otaria", "fdp",
  "vagabundo", "vagabunda", "arrombado", "vaca", "piranha", "fuck", "shit",
  "bitch", "asshole", "motherfucker", "mierda", "gilipollas"
];

// Map de substituição leet -> letra
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
  // normaliza acentos e minuscula
  let s = msg.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  // substituir caracteres leet por letras
  s = s.split('').map(ch => LEET_MAP[ch] || ch).join('');
  // remover caracteres que não são letras ou dígitos (mantém espaços)
  s = s.replace(/[^a-z0-9\s]/g, ' ');
  // colapsar múltiplos espaços
  s = s.replace(/\s+/g, ' ').trim();
  return s;
};

const isAcronymMatch = (clean: string, bad: string) => {
  /* ex: "fdp" deve corresponder a "filhodaputa"
  gerar acrônimo de palavra ruim ( primeiras letras de cada sílaba/pedaço ) não é trivial
  fazemos verificação simples: se bad tiver >=6 caracteres e clean contém as iniciais
  também consideramos siglas diretas (fdp no array) */
  if (bad.length <= 4) return false;
  // extrair primeiras letras das palavras dentro de bad: ex filhodaputa -> fdp
  const initials = bad.split(/[^a-z0-9]+/).map(w => w[0]).join('');
  return initials && clean.includes(initials);
};

export const containsBadWords = (msg: string) => {
  const clean = normalizeText(msg);

  if (!clean) return false;

  // checar palavra por palavra
  const words = clean.split(' ').filter(Boolean);

  // checagem direta: cada palavrão aparece em qualquer posição (substring)
  for (const bad of Palavroes) {
    if (clean.includes(bad)) return true;
  }

  // checa palavras exatas (evita falsos positivos)
  for (const w of words) {
    for (const bad of Palavroes) {
      if (w === bad) return true;
    }
  }

  // checa siglas/abreviações: se a mensagem contém um token curto que corresponde a abreviação comum
  // lista de siglas explícitas
  const SIGLAS = ['fdp', 'vcf', 'vag', 'pqp']; // outras siglas bloqueáveis podem ser acrescentadas
  for (const token of words) {
    if (SIGLAS.includes(token)) return true;
    // detectar tokens muito similares (ex: f1d4 -> depois da normalização vira fida -> cobrimos em includes)
  }

  // checagem de "iniciais" para casos como "filhodaputa" -> "fdp"
  for (const bad of Palavroes) {
    if (isAcronymMatch(clean, bad)) return true;
  }

  return false;
};
