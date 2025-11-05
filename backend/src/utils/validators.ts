// backend/src/utils/validators.ts
export const isValidCPF = (cpf: string) => {
  if (!cpf) return false;
  const s = cpf.replace(/\D/g, '');
  if (s.length !== 11) return false;
  if (/^(\d)\1+$/.test(s)) return false; // todos iguais

  const calc = (t: number) => {
    let sum = 0;
    for (let i = 0; i < t; i++) sum += parseInt(s.charAt(i)) * (t + 1 - i);
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };

  const d1 = calc(9);
  const d2 = calc(10);
  return d1 === parseInt(s.charAt(9)) && d2 === parseInt(s.charAt(10));
};