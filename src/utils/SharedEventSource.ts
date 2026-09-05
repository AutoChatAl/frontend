/**
 * Uma conexão SSE por URL, compartilhada por quem precisar dela.
 *
 * O navegador mantém no máximo 6 conexões por origem no HTTP/1.1, e um stream de
 * SSE fica aberto para sempre — cada um ocupa um slot permanente. Com a barra
 * lateral, o sino de notificações, a lista de conversas e a conversa aberta cada um
 * abrindo o seu, sobravam duas conexões para todas as chamadas normais da API, e as
 * requisições passavam a esperar na fila: a prévia da conversa demorava segundos
 * para chegar mesmo com o evento já entregue.
 *
 * Aqui a conexão é contada por referência: o primeiro assinante abre, o último a
 * sair fecha. Duas telas que escutam a mesma URL passam a dividir um socket só.
 */

interface Entry {
  source: EventSource;
  /** Handlers por nome de evento, para o desmonte de um assinante não derrubar o outro. */
  listeners: Map<string, Set<(event: MessageEvent) => void>>;
  refCount: number;
  retryTimer: ReturnType<typeof setTimeout> | null;
}

const connections = new Map<string, Entry>();

function open(url: string, entry: Entry) {
  const source = new EventSource(url);
  entry.source = source;

  for (const [eventName, handlers] of entry.listeners) {
    source.addEventListener(eventName, (event) => {
      for (const handler of handlers) handler(event as MessageEvent);
    });
  }

  source.onerror = () => {
    // O EventSource se reconecta sozinho em falha transitória; só recriamos quando
    // ele desiste de vez, e apenas se ainda houver alguém escutando.
    if (source.readyState !== EventSource.CLOSED) return;
    source.close();
    if (entry.refCount === 0) return;
    if (entry.retryTimer) clearTimeout(entry.retryTimer);
    entry.retryTimer = setTimeout(() => {
      entry.retryTimer = null;
      if (entry.refCount > 0) open(url, entry);
    }, 4000);
  };
}

/**
 * Escuta eventos de uma URL. Devolve a função de cancelamento — chame no cleanup do
 * efeito, como faria com `removeEventListener`.
 */
export function subscribeToEvents(
  url: string,
  handlers: Record<string, (event: MessageEvent) => void>,
): () => void {
  let entry = connections.get(url);
  const isNew = !entry;
  if (!entry) {
    entry = {
      source: null as unknown as EventSource,
      listeners: new Map(),
      refCount: 0,
      retryTimer: null,
    };
    connections.set(url, entry);
  }

  const registered: Array<[string, (event: MessageEvent) => void]> = [];
  for (const [eventName, handler] of Object.entries(handlers)) {
    let set = entry.listeners.get(eventName);
    if (!set) {
      set = new Set();
      entry.listeners.set(eventName, set);
      // Evento que ainda não existia na conexão aberta precisa ser ligado agora.
      if (!isNew && entry.source) {
        const bucket = set;
        entry.source.addEventListener(eventName, (event) => {
          for (const fn of bucket) fn(event as MessageEvent);
        });
      }
    }
    set.add(handler);
    registered.push([eventName, handler]);
  }

  entry.refCount += 1;
  if (isNew) open(url, entry);

  return () => {
    const current = connections.get(url);
    if (!current) return;
    for (const [eventName, handler] of registered) {
      current.listeners.get(eventName)?.delete(handler);
    }
    current.refCount -= 1;
    if (current.refCount > 0) return;
    if (current.retryTimer) clearTimeout(current.retryTimer);
    current.source?.close();
    connections.delete(url);
  };
}
