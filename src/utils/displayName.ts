/**
 * Nomes vindos do WhatsApp e do Instagram, tratados para exibição.
 *
 * Contato costuma escrever o próprio nome com as letras decorativas do Unicode
 * ("𝓙𝓸ã𝓸", "𝗔𝗻𝗮") e com emoji no meio. Isso quebra duas coisas:
 *
 * 1. Essas letras vivem fora do plano básico do Unicode, então ocupam DUAS
 *    unidades UTF-16. `nome[0]` e `charAt(0)` devolvem meio caractere, e o
 *    navegador desenha "" no lugar da inicial do avatar.
 * 2. Elas caem num fallback de fonte diferente do resto da interface, com outra
 *    altura de linha e outro peso — o nome fica desalinhado do que está à volta.
 *
 * A normalização NFKC resolve os dois: ela tem decomposição de compatibilidade
 * para essas letras, então "𝓙𝓸ã𝓸 🌟 𝓢𝓲𝓵𝓿𝓪" vira "João 🌟 Silva". O emoji é
 * preservado no nome — só não entra na inicial, onde não caberia mesmo.
 */

/** Zero-width, marcas de direção e seletores de variação: invisíveis que atrapalham medida e corte. */
const INVISIBLE = /[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF\uFE00-\uFE0F]/g;

/** Nome pronto para a tela: letras decorativas viram letras comuns, emoji fica. */
export function normalizeDisplayName(value?: string | null): string {
  if (!value) return '';
  return value
    .normalize('NFKC')
    .replace(INVISIBLE, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Iniciais do avatar.
 *
 * `Array.from` percorre por ponto de código, e não por unidade UTF-16 — é o que
 * impede o meio-caractere. Só letra e número entram: emoji não tem versão
 * maiúscula nem largura previsível dentro de um círculo pequeno.
 */
export function getInitials(name?: string | null, fallback?: string | null): string {
  for (const candidate of [name, fallback]) {
    const source = normalizeDisplayName(candidate).replace(/^@/, '');
    if (!source) continue;

    // Identificador que é telefone: o começo é o código do país, igual em toda a
    // base — dois avatares diferentes sairiam ambos como "55". As duas últimas
    // casas variam de contato para contato, que é o que a inicial precisa fazer.
    const digits = source.replace(/\D/g, '');
    if (digits.length >= 8 && digits.length === source.replace(/[^\d+\s()-]/g, '').replace(/\D/g, '').length && !/[\p{L}]/u.test(source)) {
      return digits.slice(-2);
    }

    const words = source
      .split(' ')
      .map((word) => Array.from(word).filter((char) => /[\p{L}\p{N}]/u.test(char)))
      .filter((chars) => chars.length > 0);
    if (words.length === 0) continue;

    const first = words[0]!;
    // Nome de uma palavra usa as duas primeiras letras dela; com sobrenome, a
    // inicial de cada ponta — que é o que se reconhece num círculo de 44px.
    const initials = words.length === 1
      ? first.slice(0, 2)
      : [first[0]!, words[words.length - 1]![0]!];
    return initials.join('').toLocaleUpperCase('pt-BR');
  }
  return '?';
}
