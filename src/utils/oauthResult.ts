/**
 * Aviso de "conta conectada" entre a janela do OAuth e a aba que a abriu.
 *
 * O `window.opener` não serve para isso: Instagram e Google mandam
 * Cross-Origin-Opener-Policy nas telas de login, e o navegador corta o vínculo
 * com a aba de origem assim que o popup passa por lá. Na volta ao callback o
 * popup não sabe mais quem o abriu, e a aba de origem já enxerga o popup como
 * fechado. O BroadcastChannel só depende de as duas estarem na mesma origem.
 */
export type OAuthProvider = 'instagram' | 'google';

const CHANNEL_NAME = 'synq-oauth-result';

interface OAuthResultMessage {
  provider: OAuthProvider;
  status: 'success';
}

export function announceOAuthSuccess(provider: OAuthProvider): void {
  if (typeof BroadcastChannel === 'undefined') {
    return;
  }
  const channel = new BroadcastChannel(CHANNEL_NAME);
  channel.postMessage({ provider, status: 'success' } satisfies OAuthResultMessage);
  channel.close();
}

/** Devolve a função que encerra a escuta. */
export function listenOAuthSuccess(provider: OAuthProvider, onSuccess: () => void): () => void {
  if (typeof BroadcastChannel === 'undefined') {
    return () => {};
  }
  const channel = new BroadcastChannel(CHANNEL_NAME);
  channel.onmessage = (event: MessageEvent<Partial<OAuthResultMessage> | null>) => {
    if (event.data?.status === 'success' && event.data.provider === provider) {
      onSuccess();
    }
  };
  return () => channel.close();
}
