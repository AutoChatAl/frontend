// Utilitários de telefone (DDI + DDD + número), focados no formato brasileiro.
// O estado do componente deve ser sempre os dígitos puros — a formatação é só
// apresentação.

// Remove tudo que não for dígito, limitando a 13 (DDI + DDD + número de 9).
export const extractPhoneDigits = (raw: string): string => raw.replace(/\D/g, '').slice(0, 13);

// Formata para exibição: +55 (11) 99999-9999. Nunca deixa um caractere de
// formatação como último char, para o backspace sempre remover um dígito.
export const formatPhoneNumber = (raw: string): string => {
  const d = extractPhoneDigits(raw);
  if (d.length <= 2)
    return d ? `+${d}` : '';
  if (d.length <= 4)
    return `+${d.slice(0, 2)} (${d.slice(2)}`;
  const subscriber = d.slice(4);
  if (subscriber.length <= 4)
    return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${subscriber}`;
  return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${subscriber.slice(0, -4)}-${subscriber.slice(-4)}`;
};
