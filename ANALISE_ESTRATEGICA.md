# Synq — Análise Estratégica e Roadmap Competitivo

> Documento de produto. Diagnóstico do sistema atual, benchmarking com os principais concorrentes de automação para Instagram/WhatsApp, CRM de leads e recuperação de carrinho, e roadmap priorizado. Inclui a especificação do novo **Funil/CRM (Kanban)** já implementado nesta entrega.
>
> Data: junho/2026 · Escopo: produto, UX e arquitetura

---

## 1. Sumário executivo

O Synq já cobre bem a **camada de entrada** (captação via Instagram oficial, WhatsApp não-oficial, automações de comentário, auto-respostas, recuperação de carrinho e IA). O que falta é a **camada de gestão comercial**: hoje não existe um lugar onde o operador veja o lead avançando por etapas, entenda o quão "quente" ele está e decida a próxima ação. Os contatos vivem em uma tabela plana, sem estágio de funil, score, temperatura, origem ou status de atendimento.

É exatamente esse o padrão que define os líderes de mercado em vendas por mensageria — Kommo (ex-amoCRM), Respond.io e, no Brasil, RD Station — todos organizados em torno de um **pipeline visual (Kanban)** com **qualificação automática de leads**. Esta entrega fecha o maior gap do produto: um **Funil/CRM Kanban premium** com classificação inteligente de leads (frio → morno → aquecido → quente), score 0–100, probabilidade de conversão, tempo sem resposta, origem e notas — tudo construído de forma escalável para acomodar TikTok e Telegram no futuro.

As três apostas de maior impacto/menor esforço, em ordem: **(1)** o Funil/CRM Kanban com lead scoring (entregue aqui); **(2)** um **inbox unificado** de conversas com atribuição de leads a colaboradores; **(3)** evolução da recuperação de carrinho para **cadência omnichannel com janela de ouro** e teste A/B.

---

## 2. Diagnóstico do sistema atual

### 2.1 Pontos fortes

O produto tem uma base sólida e difícil de replicar: integração com a **API oficial do Instagram** (conformidade Meta/LGPD, algo que muitos concorrentes BR não têm), automações de comentário→DM, auto-respostas, campanhas com agendamento, **recuperação de carrinho já multi-etapa** (o modelo `AbandonedCart` tem `recoveryAttempts` com `stepIndex`, `scheduledFor` e status por tentativa), IA generativa (Gemini) com identidade/tom/regras e fila de atendimento humano (`awaitingHuman`). A arquitetura backend é limpa (camadas Route→Service→Repository, `DomainError` semântico, isolamento por `workspaceId`) e o frontend tem um Design System maduro e consistente.

### 2.2 Lacunas principais (o que os concorrentes têm e o Synq não)

A tabela abaixo resume o diagnóstico. As lacunas estão ordenadas por impacto comercial.

| # | Lacuna | Situação atual no Synq | Padrão de mercado | Impacto |
|---|---|---|---|---|
| 1 | **Pipeline / CRM visual** | Inexistente — contatos em tabela plana | Kanban de estágios é o coração do Kommo, Respond.io, RD | 🔴 Alto |
| 2 | **Classificação de leads** (score, temperatura, prob. de conversão) | Inexistente | Score 0–100 + quente/morno/frio padrão em todo CRM | 🔴 Alto |
| 3 | **Inbox unificado de conversas** | Lista de contatos + flag `awaitingHuman`, sem visão de chat | Inbox omnichannel é a tela #1 de Respond.io/Kommo | 🔴 Alto |
| 4 | **Atribuição / roteamento de leads** | Não há dono do lead nem distribuição | Respond.io roteia por idioma/região/interesse/horário | 🟠 Médio-alto |
| 5 | **Construtor visual de fluxos** (nós) | Automações configuradas por formulário | Flow builder visual é o grande diferencial do ManyChat | 🟠 Médio-alto |
| 6 | **Tarefas / follow-ups** ligados ao lead | Inexistente | Tarefas com lembrete são padrão em CRM | 🟠 Médio |
| 7 | **Tags ricas e segmentos salvos** | Tags planas (só `id` + `name`) | Tags com cor/categoria + segmentos dinâmicos | 🟡 Médio |
| 8 | **Analytics de conversão do funil** | Dashboard geral, sem funil | Taxa de conversão por etapa, tempo médio por etapa | 🟡 Médio |
| 9 | **Recuperação de carrinho avançada** | Cadência multi-etapa existe | Janela de ouro (30–60 min), A/B, omnichannel orquestrado | 🟡 Médio |
| 10 | **Multicanal TikTok/Telegram** | Planejado | Kommo e ManyChat já entregam | 🟢 Roadmap |

---

## 3. Benchmarking competitivo

### 3.1 Quem são os concorrentes e o que fazem melhor

**ManyChat** — referência global em automação de Instagram/Messenger/WhatsApp e, desde 2025, **TikTok DM**. Diferencial: **construtor visual de fluxos** intuitivo, com lógica condicional, delays, teste A/B e gatilhos por comentário, palavra-chave em DM e clique em link de Story. Fluxos de geração de lead capturam e-mail/telefone e roteiam "leads quentes" para vendas. Personalização em tempo real via IA (OpenAI/GPT).

**Kommo (ex-amoCRM)** — posicionado como "o CRM nº 1 para vendas por mensageria". O **pipeline visual (Kanban)** é a espinha dorsal: cada coluna é uma etapa da jornada, cada lead é um card que se move da primeira conversa ao fechamento. Inbox unificado de WhatsApp, Instagram, TikTok, Messenger, **Telegram** e e-mail. **Salesbot** qualifica leads e dispara follow-ups; contatos do Instagram entram automaticamente na base. Tarefas, dashboards de conversão. Preço US$ 15–45/usuário/mês.

**Respond.io** — foco em **conversação + IA operacional**. AI Agents que **qualificam leads, atualizam campos do CRM/ciclo de vida, recomendam produtos, atribuem/fecham chats, disparam workflows, bloqueiam spam e escalam para humano** sem quebrar a conversa. **Roteamento automático** por idioma, região, interesse de produto e horário de operação. Omnichannel + voz, 30+ idiomas.

**Mercado brasileiro** — **RD Station** (automação de marketing + CRM + WhatsApp, gestão de leads, lead scoring nativo), **Take Blip** e **Zenvia** (chatbots/atendimento em escala), **SleekFlow** (automação com IA no WhatsApp) e players de nicho de automação de Instagram como **Youze/ResponDM**, que enfatizam **API oficial da Meta e conformidade com LGPD** — terreno em que o Synq já joga.

### 3.2 Recuperação de carrinho — o que funciona (dados de mercado)

A recuperação por WhatsApp tem **taxa de abertura próxima de 100%** e conversão de **45–60%**, contra 2–5% do e-mail; follow-ups por WhatsApp recuperam **20–30% a mais** que outros canais. As três alavancas comprovadas:

1. **Janela de ouro:** falar nos primeiros **30–60 minutos** — a intenção de compra cai forte depois disso.
2. **Cadência:** até **3 lembretes**, espaçados em **1 hora, 1 dia e 3 dias**.
3. **Personalização + omnichannel:** usar o nome e os itens do carrinho; orquestrar e-mail e WhatsApp em vez de disparar ambos juntos eleva a recuperação para **20–35%**.

O Synq já tem a estrutura de cadência (`recoveryAttempts`); a evolução é tornar a **janela de ouro** e o **A/B de mensagem/horário** explícitos e medir recuperação por etapa.

---

## 4. Oportunidades por área

### 4.1 Funil / CRM (entregue nesta release)

Substituir a leitura passiva de contatos por um **pipeline acionável**. Detalhado na seção 6.

### 4.2 Automação inteligente

Hoje as automações são configuradas por formulário (auto-replies, comment-automations, campanhas, IA). O salto competitivo é um **construtor visual de fluxos** (estilo ManyChat) com nós de gatilho (comentário, palavra-chave, novo lead, carrinho abandonado, mudança de etapa), condições (tags, score, origem, horário) e ações (enviar mensagem, aguardar, mover etapa no funil, atribuir a colaborador, chamar IA). Como ponte de curto prazo: **gatilhos baseados no funil** — ex. "quando lead entrar na etapa X, enviar template Y" e "se sem resposta há N horas, reativar".

### 4.3 Qualificação e roteamento

Adicionar **dono do lead** (`assignedTo`) e regras simples de distribuição (round-robin entre colaboradores, ou por canal/origem). Combinado com o lead scoring, permite "leads quentes vão automaticamente para o vendedor disponível" — o padrão do Respond.io.

### 4.4 Tags, segmentação e classificação

Evoluir as tags planas para **tags com cor e categoria** e introduzir **segmentos salvos** (filtros dinâmicos reutilizáveis: "VIP", "Carrinho > R$ 300 nos últimos 7 dias", "Sem resposta há 48h"). Segmentos viram público de campanha e gatilho de automação.

### 4.5 UX/UI

O Design System é forte; o que falta são **telas de trabalho densas e acionáveis**. O Kanban entregue segue 100% o DS (indigo/slate, `rounded-xl`, dark mode, micro-interações). Próximos: inbox unificado, painel de detalhe do lead com timeline de interações, e widgets de "próxima melhor ação".

### 4.6 Retenção e conversão

Alavancas de retenção do cliente final: pós-venda automatizado (NPS, recompra), reativação de leads frios, e **alertas de SLA** (lead esperando humano há muito tempo — o Synq já tem `awaitingHumanSince`, falta exibir como métrica acionável). O badge de fila humana já existe na Sidebar; o Kanban agora destaca visualmente o tempo sem resposta.

---

## 5. Modelo de classificação de leads (implementado)

Sem inventar dados, o score é computado a partir de **sinais reais já disponíveis** no Synq, seguindo a prática de mercado (escala 0–100, recência pesa mais que histórico antigo).

**Sinais e pesos (score base 0–100):**

| Sinal | Fonte no Synq | Peso |
|---|---|---|
| Recência da última interação | `lastInteractionAt` | até +35 (≤1d) decrescendo até +0 (>30d) |
| Compra realizada | `statsByContactIds.salesCount/Value` | +30 |
| Carrinho abandonado (alta intenção) | `statsByContactIds.abandonedCount` | +20 |
| Pediu atendimento humano | `awaitingHuman` | +15 |
| Opt-in de marketing | `identities.marketingOptIn` | +10 |

**Temperatura (4 faixas, conforme pedido):** Frio `0–25` · Morno `26–50` · Aquecido `51–75` · Quente `76–100`. Etapas terminais sobrescrevem: "Ganho" = 100, "Perdido" = 0.

**Probabilidade de conversão:** combina score e avanço no funil — `0.6 × score + 0.4 × (progresso da etapa × 100)`, arredondado e limitado a 0–100. Quanto mais fundo no funil e mais quente o lead, maior a probabilidade.

Tudo é computado no `FunnelService` em tempo de leitura (sempre fresco, sem jobs). O operador pode **sobrescrever o score manualmente** (`scoreOverride`) quando tiver contexto que o sistema não vê.

---

## 6. O novo Funil / CRM (Kanban) — especificação entregue

**Onde:** nova página dedicada `/funnel` ("Funil" na Sidebar), mantendo `/contacts` como a base de contatos.

**Backend:** novo modelo `FunnelStage` (etapas customizáveis por workspace, com cor, ordem e flags `isWon`/`isLost`) e extensão do `Contact` com `funnelStageId`, `attendanceStatus`, `origin`, `notes`, `stageEnteredAt`, `boardOrder` e `scoreOverride`. Endpoints REST sob `/funnel`: board paginado por coluna, mover lead entre etapas, edição rápida do lead e CRUD de etapas. Estágios padrão (Novo Lead → Em Contato → Qualificado → Negociação → Ganho/Perdido) são **semeados automaticamente** no primeiro acesso.

**Frontend:** board Kanban com **drag-and-drop** (`@dnd-kit` — acessível, com suporte a toque e teclado, alta performance). Cada **LeadCard** mostra: avatar/nome, badge de canal (WhatsApp/Instagram), **temperatura** (frio/morno/aquecido/quente) com cor e ícone, **score** em anel visual, **probabilidade de conversão**, **última interação**, **tempo sem resposta** (destacado quando estoura SLA), **origem**, **tags**, **status de atendimento** e **prévia das notas**. Edição rápida em drawer lateral. Filtros por canal/temperatura/origem e busca. Animações sutis com framer-motion, responsivo (colunas com scroll horizontal no mobile), dark mode completo.

**Princípios de UX seguidos:** visual premium e limpo (nada genérico), indicadores intuitivos por cor semântica do DS, cards organizados com hierarquia tipográfica clara, e performance — colunas carregam em página (infinite scroll por coluna) para suportar muitos leads.

---

## 7. Arquitetura escalável para TikTok e Telegram

As decisões abaixo já deixam o caminho aberto para os próximos canais sem refatoração:

- **Origem do lead como enum extensível** (`WHATSAPP | INSTAGRAM | CART_RECOVERY | COMMENT | CAMPAIGN | MANUAL | TIKTOK | TELEGRAM`) — TikTok/Telegram já existem no tipo, basta passar a popular.
- **`ContactIdentity` por canal** (já existe): adicionar `TIKTOK`/`TELEGRAM` ao enum `type` e um provider novo em `infra/providers/` reaproveita todo o funil, tags, score e Kanban.
- **Funil agnóstico de canal:** o board agrupa por etapa, não por canal; um lead pode ter múltiplas identidades. Badges de canal no card escalam para N canais.
- **Score por sinais, não por canal:** a função de intel consome sinais genéricos (recência, compra, carrinho), então novos canais entram sem tocar na lógica de classificação.

Recomendação: ao adicionar um canal, criar `infra/providers/<canal>.ts`, estender o enum `type` da identidade e o webhook correspondente — o CRM, automações e analytics passam a funcionar automaticamente.

---

## 8. Roadmap priorizado

Notação de esforço: S (pequeno), M (médio), L (grande).

### Fase 1 — Quick wins (0–6 semanas)
| Item | Impacto | Esforço |
|---|---|---|
| **Funil/CRM Kanban + lead scoring** | 🔴 Alto | L · ✅ entregue nesta release |
| Tags com cor + categoria | 🟠 Médio | S |
| Alertas de SLA (tempo sem resposta) no funil e dashboard | 🟠 Médio | S |
| Janela de ouro (30–60 min) explícita na recuperação de carrinho | 🟠 Médio | M |

### Fase 2 — Diferenciação (6–14 semanas)
| Item | Impacto | Esforço |
|---|---|---|
| Inbox unificado de conversas (chat ao vivo multicanal) | 🔴 Alto | L |
| Atribuição/roteamento de leads a colaboradores | 🟠 Médio-alto | M |
| Tarefas/follow-ups ligados ao lead | 🟠 Médio | M |
| Segmentos salvos (filtros dinâmicos reutilizáveis) | 🟠 Médio | M |
| Analytics de conversão por etapa do funil | 🟡 Médio | M |

### Fase 3 — Plataforma (14+ semanas)
| Item | Impacto | Esforço |
|---|---|---|
| Construtor visual de fluxos (nós) | 🔴 Alto | L |
| Canais TikTok e Telegram | 🟠 Médio-alto | L |
| Teste A/B em automações e recuperação | 🟡 Médio | M |
| Pós-venda automatizado (NPS, recompra, reativação) | 🟡 Médio | M |

---

## 9. Métricas para acompanhar

Conversão por etapa do funil (taxa de avanço entre colunas), tempo médio por etapa, taxa de recuperação de carrinho por etapa de cadência, tempo médio de primeira resposta (SLA), distribuição de leads por temperatura, e receita atribuída por origem de lead. Essas métricas validam o lead scoring (eficiência = % de leads "quentes" que de fato convertem) e orientam onde o funil vaza.

---

## 10. Fontes

- [ManyChat — recursos 2025/2026 (Tidio review)](https://www.tidio.com/blog/manychat-review/)
- [ManyChat — automação de Instagram (blog oficial)](https://manychat.com/blog/unlock-the-power-of-instagram-automation-transform-your-dms-into-a-growth-engine/)
- [Kommo — CRM para vendas por mensageria](https://www.kommo.com/)
- [Kommo — WhatsApp CRM](https://www.kommo.com/whatsapp/)
- [Kommo (amoCRM) — perfil e recursos (Software Advice)](https://www.softwareadvice.com/crm/amocrm-profile/)
- [Respond.io — AI Agents](https://respond.io/ai-agents)
- [Respond.io — qualificação de leads](https://respond.io/ai-agents-for-lead-qualification)
- [Recuperação de carrinho por WhatsApp — boas práticas (AiSensy)](https://m.aisensy.com/blog/recover-abandoned-carts-with-whatsapp/)
- [WhatsApp Shopify cart recovery 2025 (Zoko)](https://www.zoko.io/post/whatsapp-shopify-recover-abandoned-browsers)
- [Melhores ferramentas de WhatsApp para empresas 2025 (Rasayel)](https://learn.rasayel.io/pt-br/blog/best-whatsapp-tools/)
- [Lead scoring — modelos quente/morno/frio (ThomasNet)](https://blog.thomasnet.com/lead-generation/lead-scoring)
- [Warm vs Hot leads — modelo de score (Prospeo)](https://prospeo.io/s/warm-leads-vs-hot-leads)
