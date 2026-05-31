# CLAUDE.md — Frontend Guidelines
## Synq Frontend

Este documento é a fonte primária de verdade para agentes de IA e desenvolvedores que trabalham no frontend do Synq. Toda contribuição deve seguir rigorosamente os padrões aqui definidos.

> **Design System:** Consulte o `DESIGN_SYSTEM.md` (na raiz de `frontend/`) para todos os tokens de cor, tipografia, espaçamento, variantes de componente e regras visuais. **Nunca use cores, tamanhos ou espaçamentos hardcoded** — use sempre as classes Tailwind documentadas no Design System.

---

## 1. Princípios Fundamentais

- **Design System First:** Antes de criar qualquer estilo ou variante visual, consulte o `DESIGN_SYSTEM.md`. Se o token necessário não existir, adicione-o lá antes de usá-lo no código.
- **Utility-first:** Toda estilização é feita com classes Tailwind diretamente nos componentes. Sem CSS-in-JS, sem módulos CSS por componente.
- **Semântica sobre estética:** Cores mapeiam para significado — use os tokens semânticos corretos (ex: `text-red-500` para erros, não apenas para "vermelho").
- **Mobile-first:** Breakpoints aplicados de fora para dentro (`sm:`, `md:`, `lg:`).
- **Dark mode desde o início:** Todo novo componente deve suportar dark mode com o par `light / dark:`.
- **TypeScript estrito:** `strict: true` com `noUncheckedIndexedAccess` e `exactOptionalPropertyTypes`. Nunca use `any`.
- **Fail Fast:** Prefira erros em tempo de compilação. Valide em boundaries de sistema (entrada do usuário, resposta da API).

---

## 2. Stack Técnica

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 15 (App Router) |
| Runtime | React 19 |
| Linguagem | TypeScript 5 (strict mode) |
| Estilização | Tailwind CSS v4 |
| Ícones | Lucide React |
| Fontes | Geist Sans / Geist Mono (Google Fonts) |
| HTTP Client | Fetch nativo via `ApiClient` customizado |
| Estado global | React Context API |
| Formulários | React controlado (`useState`) — sem bibliotecas externas |
| Pagamentos | Stripe (react-stripe-js) |
| Gerenciador de pacotes | **yarn** — único gerenciador permitido |

---

## 3. Estrutura de Pastas

```
src/
├── app/                          # Next.js App Router
│   ├── (public)/                 # Rotas públicas (sem autenticação)
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   ├── reset-password/
│   │   ├── oauth/callback/
│   │   ├── invite/
│   │   ├── layout.tsx
│   │   └── components/           # Componentes exclusivos de páginas públicas
│   │
│   └── (private)/                # Rotas protegidas (autenticação obrigatória)
│       ├── dashboard/
│       ├── channels/
│       ├── contacts/
│       ├── groups/
│       ├── campaigns/
│       ├── auto-replies/
│       ├── scheduling/
│       ├── ia/
│       ├── settings/
│       ├── plans/
│       ├── layout.tsx            # Layout com Sidebar + Header
│       └── [feature]/
│           ├── page.tsx          # Página principal da feature
│           └── components/       # Componentes locais da feature
│
├── components/                   # Componentes globais reutilizáveis
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Select.tsx
│   ├── Textarea.tsx
│   ├── Modal.tsx
│   ├── Card.tsx
│   ├── Table.tsx
│   ├── Badge.tsx
│   ├── Toast.tsx
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   ├── EmptyState.tsx
│   ├── PageLoader.tsx
│   └── ...
│
├── contexts/                     # React Context providers
│   ├── ThemeContext.tsx
│   ├── SidebarContext.tsx
│   ├── ChannelStatusContext.tsx
│   ├── SupportChatContext.tsx
│   └── SubscriptionContext.tsx
│
├── hooks/                        # Custom React hooks globais
│   ├── SearchHook.ts
│   ├── ChannelHook.ts
│   └── AIHooks.ts
│
├── services/                     # Camada de comunicação com a API
│   ├── auth.service.ts
│   ├── dashboard.service.ts
│   ├── contact.service.ts
│   ├── campaign.service.ts
│   └── ...                       # Um arquivo por domínio
│
├── types/                        # Tipos TypeScript de domínio
│   ├── Contact.ts
│   ├── Channel.ts
│   ├── Campaign.ts
│   ├── Subscription.ts
│   └── ...
│
└── utils/
    ├── ApiClient.ts              # HTTP client singleton (Fetch + auth)
    └── ErrorHandling.ts          # Utilitários de tratamento de erro
```

---

## 4. Tipos de Domínio (`/types`)

Todo objeto recebido ou enviado à API deve ter um tipo TypeScript explícito em `/types/`. Nunca use `any`, nunca tipar inline sem nome.

### Convenções

- **Interfaces** para objetos de domínio completos.
- **Types** para unions, status e utilitários.
- Sufixo de contexto obrigatório quando necessário para desambiguar (ex: `CampaignPayload`, `ContactFilters`).
- Payloads de criação/edição são tipos separados do modelo completo.

### Exemplo

```typescript
// types/Campaign.ts

export type CampaignStatus = 'draft' | 'scheduled' | 'running' | 'paused' | 'finished' | 'error';

export interface Campaign {
  _id: string;
  name: string;
  status: CampaignStatus;
  messageTemplate: string;
  channelIds: string[];
  scheduledAt: string;
  createdAt: string;
}

export interface CreateCampaignPayload {
  name: string;
  messageTemplate: string;
  channelIds: string[];
  scheduledAt: string;
}
```

---

## 5. Services (`/services`)

Services são a **única camada que chama o `ApiClient`**. Componentes e hooks nunca importam `ApiClient` diretamente.

### Convenções

- Um arquivo por domínio: `campaign.service.ts`, `contact.service.ts`.
- Cada método é `async`, retorna o tipo explícito e lança `Error` com mensagem em português.
- Nunca coloque lógica de UI dentro de um service (sem toast, sem redirect).
- Use os tipos de `/types` como entrada e saída.

### Exemplo

```typescript
// services/campaign.service.ts

import { apiClient } from '@lib/ApiClient';
import type { Campaign, CreateCampaignPayload } from '@types';

class CampaignService {
  async list(): Promise<Campaign[]> {
    const response = await apiClient.get<{ campaigns: Campaign[] }>('/campaigns');
    if (!response.success || !response.data) {
      throw new Error('Falha ao buscar campanhas.');
    }
    return response.data.campaigns;
  }

  async create(payload: CreateCampaignPayload): Promise<Campaign> {
    const response = await apiClient.post<{ campaign: Campaign }>('/campaigns', payload);
    if (!response.success || !response.data) {
      throw new Error('Falha ao criar campanha.');
    }
    return response.data.campaign;
  }

  async remove(id: string): Promise<void> {
    const response = await apiClient.delete(`/campaigns/${id}`);
    if (!response.success) {
      throw new Error('Falha ao remover campanha.');
    }
  }
}

export const campaignService = new CampaignService();
```

---

## 6. ApiClient (`/utils/ApiClient.ts`)

Singleton baseado em Fetch nativo. Toda chamada HTTP passa por ele.

- **Autenticação:** Injeta `Authorization: Bearer {token}` automaticamente via `localStorage`.
- **Timeout:** 12 segundos com `AbortController`.
- **Resposta tipada:** `ApiResponse<T>` com `success: boolean` e `data?: T`.
- **Base URL:** `NEXT_PUBLIC_API_URL` (padrão: `http://localhost:3000`).

**Nunca instancie `ApiClient` diretamente em componentes.** Use sempre via service.

---

## 7. Hooks (`/hooks`)

Hooks encapsulam lógica de estado e efeitos reutilizáveis. Componentes devem ser o mais "burros" possível — apenas renderizam o que os hooks e contexts fornecem.

### Hooks Globais (`/hooks`)

| Hook | Responsabilidade |
|---|---|
| `useFilter()` | Busca/filtro com normalização de acentos — retorna `{ query, setQuery, filtered }` |
| `useAIConfig()` | Estado da configuração de IA com persistência via `aiService` |

### Hooks de Contexto (via `useContext`)

| Hook | Arquivo | Responsabilidade |
|---|---|---|
| `useTheme()` | `ThemeContext` | Toggle dark/light mode |
| `useSubscription()` | `SubscriptionContext` | Dados do plano ativo |
| `usePlanLimitCheck(resource)` | `SubscriptionContext` | Verificar uso de limites de plano |
| `useSidebar()` | `SidebarContext` | Estado de expansão da sidebar |
| `useChannelStatus()` | `ChannelStatusContext` | Status de conexão dos canais |

### Convenções

- Prefixo `use` obrigatório.
- Retorne sempre um objeto nomeado — nunca tupla com mais de 2 elementos.
- Hooks que fazem chamadas à API usam `useState` (data, loading, error) + `useEffect` + `useCallback` para refetch.
- Hooks locais de feature ficam em `app/(private)/[feature]/` quando não reutilizados.

### Exemplo

```typescript
// hooks/useCampaigns.ts

import { useState, useEffect, useCallback } from 'react';
import { campaignService } from '@/services/campaign.service';
import type { Campaign } from '@/types/Campaign';

interface UseCampaignsReturn {
  campaigns: Campaign[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useCampaigns(): UseCampaignsReturn {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await campaignService.list();
      setCampaigns(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar campanhas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { campaigns, loading, error, reload: load };
}
```

---

## 8. Componentes

### 8.1 Componentes Globais (`/components`)

Átomicos e agnósticos de domínio. Nunca importam services ou tipos de domínio específicos.

| Componente | Variantes / Props principais |
|---|---|
| `Button` | `variant`: primary, secondary, ghost, danger · `size`: sm, md, lg · `loading`, `icon` |
| `Card` | Wrapper com `className` extensível |
| `Input` | `label`, `error`, `hint`, `leftIcon`, `rightElement` |
| `Select` | `label`, `error`, opções tipadas |
| `Textarea` | `label`, `error`, `hint` |
| `Badge` | `type`: whatsapp, instagram, success, warning, error, processing, neutral, group, admin, collaborator · `pill` |
| `Modal` | `size`: sm, md, lg, xl · `isOpen`, `onClose`, `title` |
| `Toast` | `success` / `error` · auto-dismiss em 4s |
| `Table` | Colunas tipadas, estado vazio, paginação |
| `EmptyState` | Ícone, título, descrição, CTA opcional |
| `PageLoader` | Full-page loading indicator |

### 8.2 Componentes Locais de Feature

Ficam em `app/(private)/[feature]/components/`. Criados apenas quando a lógica ou visual é específico daquele domínio.

### Convenções Gerais

- **Functional components** com arrow function e tipagem explícita de props via `interface`.
- Props opcionais com `?` e valores padrão no destructuring.
- Props de callback nomeadas com prefixo `on`: `onSave`, `onClose`, `onStatusChange`.
- Componentes de página (`page.tsx`) não recebem props — consomem hooks/contexts diretamente.
- **Todas as cores, tamanhos e espaçamentos** seguem o `DESIGN_SYSTEM.md`. Nunca hardcode.
- Sempre suporte dark mode: use o par de classes `light / dark:` em toda propriedade de cor.
- Aceite `className?: string` para extensibilidade quando fizer sentido.

### Exemplo

```tsx
// components/EmptyState.tsx

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
      <div className="text-slate-300 dark:text-slate-600">{icon}</div>
      <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">{description}</p>
      {action}
    </div>
  );
}
```

---

## 9. Formulários

O projeto usa **React controlado com `useState`** — sem react-hook-form, Zod, Yup ou Formik.

### Padrão de Formulário

```tsx
const [name, setName] = useState('');
const [error, setError] = useState('');
const [loading, setLoading] = useState(false);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!name.trim()) {
    setError('Nome é obrigatório.');
    return;
  }
  setLoading(true);
  try {
    await campaignService.create({ name, ... });
    toast.success('Campanha criada com sucesso!');
    onClose();
  } catch (e) {
    toast.error(e instanceof Error ? e.message : 'Erro ao criar campanha.');
  } finally {
    setLoading(false);
  }
};
```

### Validação

- HTML5 (`required`, `minLength`, `type="email"`) para validações básicas.
- Validações de negócio no handler antes da chamada ao service.
- Mensagens de erro sempre em **português**.
- Exiba erros com o prop `error` dos componentes de input — nunca com `alert()`.

---

## 10. Segurança

### 10.1 Autenticação e Proteção de Rotas

O guard de rotas privadas vive no `app/(private)/layout.tsx`. Ele verifica autenticação via `authService.isAuthenticated()` **no `useEffect`** e redireciona para `/login` imediatamente se o token estiver ausente ou inválido. Enquanto a verificação não termina, exibe um spinner — **nunca renderize conteúdo privado antes da confirmação de auth**.

```tsx
// Padrão obrigatório no layout privado
useEffect(() => {
  if (!authService.isAuthenticated()) {
    router.push('/login');
    return;
  }
  setIsAuthenticated(true);
  authService.fetchMe().then(setUser).catch(() => {});
}, [router]);

if (!isAuthenticated) return <LoadingSpinner />;
```

O `authService.fetchMe()` valida o token contra a API — se retornar 401, o `ApiClient` deve redirecionar para `/login`. Qualquer falha silenciosa aqui é uma vulnerabilidade.

### 10.2 Armazenamento de Token

- JWT armazenado em `localStorage` com chave `auth_token`.
- **Risco:** localStorage é acessível por JavaScript — não armazene dados sensíveis além do token.
- Nunca logue o token em `console.log` ou o inclua em relatórios de erro.
- Ao fazer logout, remova **todos** os itens de auth do localStorage (`auth_token`, `auth_user`).

### 10.3 Controle de Acesso na UI

**Nunca** controle visibilidade de elementos sensíveis apenas com CSS — remova do DOM com condicionais TypeScript.

```tsx
// ERRADO — elemento existe no DOM, só está invisível
<button className={isAdmin ? '' : 'hidden'}>Excluir workspace</button>

// CORRETO — elemento não existe no DOM
{isAdmin && <button>Excluir workspace</button>}
```

Papéis disponíveis: `'admin'` (owner do workspace) e role de colaborador. A checagem de `user.role === 'admin'` está no `layout.tsx` privado e propagada via props para `Sidebar` e `SupportChatWidget`.

### 10.4 Prevenção de XSS

- **Nunca** use `dangerouslySetInnerHTML` — se inevitável, sanitize com DOMPurify antes.
- Nunca renderize conteúdo vindo da API diretamente como HTML — use sempre texto puro ou componentes React.
- Inputs do usuário exibidos na UI devem ser tratados como strings — o React escapa automaticamente em JSX, mas não em atributos manipulados via DOM diretamente.
- Nunca construa URLs a partir de input do usuário sem validação (ex: `href={userInput}` pode ser `javascript:`).

```tsx
// ERRADO
<div dangerouslySetInnerHTML={{ __html: message.content }} />

// CORRETO
<p className="whitespace-pre-wrap">{message.content}</p>
```

### 10.5 Pagamentos — Stripe

- **Nunca** manipule dados de cartão diretamente — use sempre os componentes do Stripe Elements (`CardElement`, `PaymentElement`).
- Nunca logue dados de pagamento.
- O payload enviado à API deve conter apenas `paymentMethodId` ou `paymentIntentId` — nunca dados de cartão cru.
- Chaves Stripe no frontend usam exclusivamente a chave **pública** (`pk_`). A chave secreta (`sk_`) existe apenas no backend.

### 10.6 Comunicação com a API

- Toda chamada HTTP passa pelo `ApiClient` — nunca use `fetch` diretamente em componentes.
- O `ApiClient` injeta `Authorization: Bearer {token}` automaticamente.
- Timeout de 12 segundos via `AbortController` — não desabilite.
- A URL base vem de `NEXT_PUBLIC_API_URL` — nunca hardcode URLs de API.
- **Nunca** faça requisições para APIs de terceiros diretamente do frontend — roteie via backend quando necessário.

### 10.7 Exposição de Erros

- Nunca exiba mensagens de erro técnicas (stack trace, IDs internos, queries) para o usuário.
- Capture o erro, logue internamente se necessário, e exiba uma mensagem genérica em português via `Toast`.
- A resposta de erro da API tem o formato `{ reason: 'ERROR_CODE' }` — traduza para mensagem amigável no service ou no handler do componente.

```tsx
// CORRETO
try {
  await campaignService.create(payload);
} catch (e) {
  // Exibe mensagem amigável — nunca o erro bruto
  toast.error('Não foi possível criar a campanha. Tente novamente.');
}
```

### 10.8 Ações Destrutivas

- Toda ação irreversível (excluir, cancelar plano, desconectar canal) deve ser protegida por um `Modal` de confirmação — use `ConfirmDeleteModal` ou `Modal` com `variant="danger"`.
- Use o componente `DangerZone` para agrupar visualmente ações de alto risco.
- Botões de ação destrutiva usam `variant="danger"` do `Button` — nunca `variant="primary"`.

### 10.9 OAuth e Callbacks

- O callback OAuth (`/oauth/callback`) deve validar o `state` retornado para prevenir CSRF.
- Nunca redirecione o usuário para uma URL extraída diretamente de query params sem validar que o destino é interno.
- Tokens de convite (`/invite`) devem ser validados pelo backend antes de qualquer ação.

### 10.10 Dados Sensíveis em Estado

- Nunca armazene senhas, tokens de terceiros ou dados de cartão em `useState`, `localStorage` ou Context.
- Dados do usuário em `localStorage.auth_user` devem conter apenas informações de perfil (nome, email, role) — nunca credenciais ou tokens de integração.

---

## 11. Rotas e Navegação

- **App Router do Next.js 15** com route groups `(public)` e `(private)`.
- Use `useRouter()` para navegação programática.
- Use `usePathname()` para detectar rota ativa (ex: highlight na Sidebar).
- Rotas privadas têm `layout.tsx` próprio com `<Sidebar />` e `<Header />`.

---

## 12. Dark Mode

- Ativado via classe `.dark` no elemento raiz, gerenciado pelo `ThemeContext`.
- **Todo componente deve suportar dark mode** com o par `light / dark:`.
- Nunca use cores absolutas sem a contrapartida dark.
- Consulte a seção **7. Dark Mode** do `DESIGN_SYSTEM.md` para os pares de cores padrão.

```tsx
// Padrão obrigatório em qualquer elemento com cor
className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700"
```

---

## 13. Design System — Integração no Código

Siga estas regras ao implementar qualquer componente ou página:

1. **Cores:** Use as classes Tailwind do vocabulário definido no `DESIGN_SYSTEM.md` seção 2. Nunca invente cores novas.
2. **Tipografia:** Use a hierarquia da seção 3 do `DESIGN_SYSTEM.md`. Nunca misture pesos/tamanhos arbitrários.
3. **Espaçamento:** Use a escala da seção 4 do `DESIGN_SYSTEM.md`. Sem valores arbitrários como `p-[13px]`.
4. **Bordas e radius:** `rounded-xl` para cards/inputs, `rounded-lg` para botões/modais. Veja seção 5.
5. **Sombras:** Nunca adicione sombras coloridas no dark mode — use `dark:shadow-none`.
6. **Animações:** Micro-interações de botão (`hover:scale-105 active:scale-95`). Modais com `animate-in zoom-in-95`. Veja seção 6.
7. **Ícones:** Sempre Lucide React. Tamanhos: 12 (badge), 14-16 (body/botão), 20 (header modal). Veja seção 10.
8. **Badges:** Use os 12 tipos documentados no Design System — nunca crie uma nova variante sem documentar primeiro.
9. **Novos tokens:** Se precisar de uma cor, tamanho ou estilo não documentado, adicione ao `DESIGN_SYSTEM.md` **antes** de usar no código.

---

## 14. Path Aliases (tsconfig.json)

| Alias | Aponta para |
|---|---|
| `@/*` | `./src/*` |
| `@components/*` | `./src/components/*` |
| `@hooks/*` | `./src/hooks/*` |
| `@contexts/*` | `./src/contexts/*` |
| `@lib/*` | `./src/utils/*` |
| `@types` | `./src/types` |

**Nunca use caminhos relativos** (`../../../components/Button`) quando existe alias disponível.

---

## 15. Qualidade de Código

### ESLint

```bash
# Verificar lint
yarn lint
```

**Regras ativas:**
- 2-space indent, single quotes, semicolons, Unix line endings
- Imports ordenados por tipo (builtin → external → internal → relativo) e alfabetizados
- Nenhuma variável não utilizada (exceto prefixadas com `_`)
- Sem `console.log` remanescente em commits
- Preferir `const`, destructuring, arrow parens

### TypeScript

```bash
# Build para verificar tipos
yarn build
```

Nenhum PR ou commit pode ser finalizado com erros de TypeScript. O `strict: true` é inegociável.

### Validação Obrigatória Após Alterações

```bash
yarn lint   # Sem erros de lint
yarn build  # Sem erros de TypeScript
```

---

## 16. Variáveis de Ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Sim | URL base da API backend (padrão: `http://localhost:3000`) |

---

## 17. Proibições

- **Nunca** use `any` ou `unknown` — defina o tipo correto.
- **Nunca** faça chamadas HTTP dentro de componentes — use sempre via service.
- **Nunca** use `npm` ou `pnpm` para instalar ou rodar scripts — use exclusivamente `yarn`.
- **Nunca** use cores, tamanhos ou espaçamentos hardcoded — use classes Tailwind do `DESIGN_SYSTEM.md`.
- **Nunca** deixe `console.log` em código de produção.
- **Nunca** ignore erros de TypeScript com `@ts-ignore` sem justificativa em comentário.
- **Nunca** crie variantes visuais sem antes verificar e documentar no `DESIGN_SYSTEM.md`.
- **Nunca** importe `ApiClient` diretamente em componentes — use sempre um service.
- **Nunca** esconda elementos de permissão apenas com CSS — remova do DOM.
- **Nunca** escreva mensagens de erro para o usuário em inglês — use português.
- **Nunca** use `alert()`, `confirm()` ou `prompt()` nativos — use `Toast` ou `Modal`.
- **Nunca** aplique cor sem o par `dark:` correspondente.

---

## 18. Convenções de Commits

Siga o padrão **Conventional Commits** em português no imperativo:

```
feat: adicionar filtro por status na listagem de campanhas
fix: corrigir modal de pagamento PIX não fechando após sucesso
refactor: extrair lógica de paginação de contatos para hook usePagination
style: ajustar padding do card de plano na tela de billing
chore: atualizar dependências do projeto
```

- Um commit por tarefa ou correção — nunca misture refatoração com nova feature.
- Mensagens concisas e no imperativo.
- Comentários no código somente quando o **porquê** não é óbvio — sempre em português.
