'use client';
import { motion } from 'framer-motion';

/*
 * Réplica estática do construtor de fluxos. As coordenadas são fixas de
 * propósito: o desenho precisa ser idêntico em todo carregamento, e medir os
 * cards em tempo de execução só para traçar as curvas traria layout shift numa
 * seção que não tem interação nenhuma.
 */

const NODE_WIDTH = 200;
const HEADER_HEIGHT = 44;
const PREVIEW_HEIGHT = 44;
const HANDLE_HEIGHT = 26;

const CANVAS_WIDTH = 780;
const CANVAS_HEIGHT = 396;

interface MockNode {
  x: number;
  y: number;
  /** Rótulo do tipo, como aparece no topo do card no construtor. */
  kind: string;
  dot: string;
  tint: string;
  preview: string;
  outputs?: string[];
}

const NODES = {
  trigger: {
    x: 0,
    y: 146,
    kind: 'Iniciar por palavra',
    dot: 'bg-indigo-500',
    tint: 'text-indigo-600',
    preview: 'Quando a mensagem contém “orçamento”',
    outputs: ['Próximo passo'],
  },
  question: {
    x: 250,
    y: 106,
    kind: 'Perguntar com opções',
    dot: 'bg-violet-500',
    tint: 'text-violet-600',
    preview: 'Qual forma de pagamento?',
    outputs: ['Pix', 'Cartão', 'Não respondeu'],
  },
  link: {
    x: 540,
    y: 16,
    kind: 'Enviar link',
    dot: 'bg-sky-500',
    tint: 'text-sky-600',
    preview: '10% de desconto no Pix → Comprar',
  },
  tag: {
    x: 540,
    y: 156,
    kind: 'Aplicar etiqueta',
    dot: 'bg-emerald-500',
    tint: 'text-emerald-600',
    preview: 'Aplicar etiqueta “Cliente quente”',
  },
  handoff: {
    x: 540,
    y: 296,
    kind: 'Passar para atendente',
    dot: 'bg-rose-500',
    tint: 'text-rose-600',
    preview: 'Encaminhar para a caixa de entrada',
  },
} satisfies Record<string, MockNode>;

function nodeHeight(node: MockNode): number {
  return HEADER_HEIGHT + PREVIEW_HEIGHT + (node.outputs?.length ?? 0) * HANDLE_HEIGHT;
}

/** Y do ponto de saída, no centro da linha daquele caminho. */
function outputY(node: MockNode, index: number): number {
  return node.y + HEADER_HEIGHT + PREVIEW_HEIGHT + index * HANDLE_HEIGHT + HANDLE_HEIGHT / 2;
}

/** Card sem saída recebe a ligação no meio da lateral esquerda. */
function inputY(node: MockNode): number {
  return node.y + nodeHeight(node) / 2;
}

const EDGES: { from: MockNode; output: number; to: MockNode }[] = [
  { from: NODES.trigger, output: 0, to: NODES.question },
  { from: NODES.question, output: 0, to: NODES.link },
  { from: NODES.question, output: 1, to: NODES.tag },
  { from: NODES.question, output: 2, to: NODES.handoff },
];

function edgePath(from: MockNode, output: number, to: MockNode): string {
  const x1 = from.x + NODE_WIDTH;
  const y1 = outputY(from, output);
  const x2 = to.x;
  const y2 = inputY(to);
  const curve = Math.max(40, (x2 - x1) / 2);
  return `M ${x1} ${y1} C ${x1 + curve} ${y1}, ${x2 - curve} ${y2}, ${x2} ${y2}`;
}

function Node({ node }: { node: MockNode }) {
  return (
    <div
      className="absolute rounded-xl border border-slate-200 bg-white"
      style={{ left: node.x, top: node.y, width: NODE_WIDTH }}
    >
      <div
        className="flex items-center gap-2 px-3"
        style={{ height: HEADER_HEIGHT }}
      >
        <span className={`h-2 w-2 shrink-0 rounded-full ${node.dot}`} />
        <p className={`truncate text-[11px] font-semibold uppercase tracking-wide ${node.tint}`}>
          {node.kind}
        </p>
      </div>

      <div
        className="flex items-center border-t border-slate-100 px-3"
        style={{ height: PREVIEW_HEIGHT }}
      >
        <p className="line-clamp-2 text-[12px] leading-snug text-slate-600">{node.preview}</p>
      </div>

      {node.outputs?.map((output) => (
        <div
          key={output}
          className="relative flex items-center border-t border-slate-100 px-3"
          style={{ height: HANDLE_HEIGHT }}
        >
          <p className="truncate pr-3 text-[11px] font-medium text-slate-500">{output}</p>
          {/* Ponto sobre a borda direita, de onde a curva sai — igual ao construtor. */}
          <span
            style={{ top: HANDLE_HEIGHT / 2 }}
            className={`absolute right-0 h-2.5 w-2.5 -translate-y-1/2 translate-x-1/2 rounded-full ring-2 ring-white ${node.dot}`}
          />
        </div>
      ))}
    </div>
  );
}

export default function FlowBuilderSection() {
  return (
    <section id="fluxos" className="relative py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-indigo-600">
            Construtor de fluxos
          </p>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Monte o atendimento <span className="text-indigo-600">arrastando blocos</span>
          </h2>
          <p className="text-base leading-relaxed text-slate-600">
            Você desenha o caminho da conversa num quadro: a palavra que inicia, a pergunta com
            opções, o desvio por resposta, a espera de horas ou dias. Cada saída leva a um bloco
            diferente, então um mesmo fluxo atende quem quer comprar e quem só está pesquisando.
          </p>
        </motion.div>

        {/* Quadro largo: rola sozinho no celular em vez de espremer os cards. */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.55, delay: 0.1, ease: 'easeOut' }}
          className="mt-14 overflow-x-auto rounded-3xl border border-slate-200/80 bg-white/70 p-6 sm:p-10"
        >
          <div
            className="relative mx-auto"
            style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
          >
            {/* Malha de pontos do quadro, igual à do construtor. */}
            <div
              aria-hidden="true"
              className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle,#cbd5e1_1px,transparent_1px)] [background-size:22px_22px] opacity-60"
            />

            <svg
              aria-hidden="true"
              className="absolute inset-0"
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
            >
              {EDGES.map(({ from, output, to }) => (
                <path
                  key={`${from.kind}-${output}`}
                  d={edgePath(from, output, to)}
                  fill="none"
                  stroke="#a5b4fc"
                  strokeWidth={2}
                />
              ))}
            </svg>

            {Object.values(NODES).map((node) => (
              <Node key={node.kind} node={node} />
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mx-auto mt-12 grid max-w-4xl gap-8 text-center sm:grid-cols-3"
        >
          <div>
            <p className="text-sm font-semibold text-slate-900">Responde sem você</p>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
              O fluxo tem prioridade sobre a IA e roda no mesmo segundo em que a mensagem chega.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Espera pelo cliente</p>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
              Quem não responde recebe uma cobrança depois do prazo que você definir.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Chama uma pessoa na hora certa</p>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
              Quando a conversa esquenta, o bloco de atendente passa o contato para o seu time.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
