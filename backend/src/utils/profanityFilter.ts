//backend/src/utils/profanityFilter.ts
const Palavroes = [
  "merda", "bosta", "porra", "caralho", "puta", "otario", "otaria", "fdp",
  "vagabundo", "vagabunda", "arrombado", "vaca", "piranha", "fuck", "shit",
  "bitch", "asshole", "motherfucker", "mierda", "gilipollas"
];

export const containsBadWords = (msg: string) => {
  const texto = msg.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return Palavroes.some(word => texto.includes(word));
};
