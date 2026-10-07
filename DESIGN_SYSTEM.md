# Synq Design System

> Referência central de design para o frontend do Synq. Baseado em **Tailwind CSS v4**, **Next.js 15** e componentes React feitos do zero — sem biblioteca de UI externa.

---

## Sumário

1. [Fundamentos](#1-fundamentos)
2. [Cores](#2-cores)
3. [Tipografia](#3-tipografia)
4. [Espaçamento](#4-espaçamento)
5. [Bordas e Sombras](#5-bordas-e-sombras)
6. [Animações e Transições](#6-animações-e-transições)
7. [Dark Mode](#7-dark-mode)
8. [Componentes Base](#8-componentes-base)
9. [Padrões de Layout](#9-padrões-de-layout)
10. [Ícones](#10-ícones)
11. [Acessibilidade](#11-acessibilidade)
12. [Diretrizes de Uso](#12-diretrizes-de-uso)

---

## 1. Fundamentos

### Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 15 (App Router) |
| Runtime | React 19 |
| Linguagem | TypeScript 5 |
| Estilização | Tailwind CSS v4 |
| Ícones | Lucide React |
| Fontes | Geist (Google Fonts) |

### Filosofia

- **Utility-first**: toda estilização é feita com classes Tailwind diretamente nos componentes. Sem CSS-in-JS, sem módulos CSS por componente.
- **Mobile-first**: breakpoints aplicados de fora para dentro (`sm:`, `md:`, `lg:`).
- **Dark mode por classe**: ativado via `.dark` na raiz do documento (`@custom-variant dark (&:where(.dark, .dark *))`).
- **Sem biblioteca de UI de terceiros**: todos os componentes são construídos internamente com Tailwind.
- **Semântica sobre estética**: cores mapeiam para significado (não apenas aparência).

---

## 2. Cores

O sistema de cores usa a paleta padrão do Tailwind com atribuições semânticas fixas. Não há tokens CSS personalizados — a semântica é garantida por convenção de uso.

### 2.1 Cor Primária — Indigo

Usada em ações principais, links ativos, foco, destaques de marca.

| Token Tailwind | Hex | Uso |
|---|---|---|
| `indigo-50` | `#eef2ff` | Fundo de seção destacada (light) |
| `indigo-100` | `#e0e7ff` | Background de badge, hover suave |
| `indigo-400` | `#818cf8` | Ícones, textos de destaque (dark) |
| `indigo-500` | `#6366f1` | Focus ring, bordas ativas |
| `indigo-600` | `#4f46e5` | Botão primário, label de destaque |
| `indigo-700` | `#4338ca` | Hover do botão primário |
| `indigo-900` | `#312e81` | Texto de destaque muito escuro |

**Exemplo de uso:**
```tsx
// Botão primário
className="bg-indigo-600 hover:bg-indigo-700 text-white"

// Label de seção
className="text-indigo-600 dark:text-indigo-400 uppercase tracking-wider text-xs font-semibold"

// Focus ring em inputs
className="focus:ring-indigo-500/20 focus:border-indigo-400"
```

---

### 2.2 Neutros — Zinc (via classes `slate-*`)

Base de toda a interface: fundos, textos, bordas, separadores.

> **Remapeamento central:** o código usa classes `slate-*`/`gray-*`, mas os valores são
> **remapeados para a escala Zinc** (cinza 100% neutro) num bloco `@theme` do
> `src/app/globals.css`. Os tons 700–950 foram deslocados um passo para baixo para
> produzir o dark mode moderno (página `#09090b`, card `#18181b`, borda `#27272a`).
> Nunca altere os hex no código — altere o `@theme` e esta tabela juntos.

| Token no código | Hex renderizado | Equivalente Zinc | Uso |
|---|---|---|---|
| `slate-50` | `#fafafa` | zinc-50 | Fundo de página (light) |
| `slate-100` | `#f4f4f5` | zinc-100 | Fundo de botão secondary, hover ghost |
| `slate-200` | `#e4e4e7` | zinc-200 | Bordas de card/input (light) |
| `slate-300` | `#d4d4d8` | zinc-300 | Scrollbar thumb (light), bordas sutis |
| `slate-400` | `#a1a1aa` | zinc-400 | Placeholder, ícones secundários |
| `slate-500` | `#71717a` | zinc-500 | Texto de hint, meta info |
| `slate-600` | `#52525b` | zinc-600 | Texto de corpo (light) |
| `slate-700` | `#27272a` | zinc-800 | Borda (dark), hover de superfície (dark) |
| `slate-800` | `#18181b` | zinc-900 | Fundo de card (dark), texto escuro |
| `slate-900` | `#09090b` | zinc-950 | Fundo de página (dark), texto principal (light) |

As classes `gray-*` são remapeadas para os mesmos valores (gray-50 = slate-50, etc.).

**Mapeamento semântico:**

| Semântica | Light | Dark |
|---|---|---|
| Fundo de página | `slate-50` ou `white` | `slate-900` (`#09090b`) |
| Fundo de card | `white` | `slate-800` (`#18181b`) |
| Fundo de input | `white` | `slate-900` |
| Borda padrão | `slate-200` | `slate-700` (`#27272a`) |
| Texto primário | `slate-900` | `white` |
| Texto secundário | `slate-600` | `slate-400` |
| Texto terciário / meta | `slate-500` | `slate-400` |
| Texto de label | `slate-700` | `slate-300` |
| Placeholder | `slate-400` | `slate-500` |

---

### 2.3 Cores de Status

Cada cor mapeia para um estado semântico claro.

#### Sucesso — Emerald
Também representa WhatsApp.

| Token | Uso |
|---|---|
| `emerald-50 / emerald-500/10` | Fundo de badge sucesso |
| `emerald-100 / emerald-500/20` | Borda de badge sucesso |
| `emerald-400` | Ícone/texto no dark mode |
| `emerald-500` | Ícone de sucesso |
| `emerald-700` | Texto de sucesso (light) |

#### Aviso — Amber
Também representa papéis de administrador e período de trial.

| Token | Uso |
|---|---|
| `amber-50 / amber-500/10` | Fundo de badge warning/admin |
| `amber-100 / amber-500/20` | Borda de badge warning |
| `amber-400` | Ícone/texto dark |
| `amber-600` | Preço riscado, destaque numérico |
| `amber-700` | Texto warning (light) |

#### Erro — Red / Rose
Red para botões/ações destrutivas, Rose para badges de erro.

| Token | Uso |
|---|---|
| `red-50` | Fundo de zona de perigo |
| `red-400` | Borda de input com erro |
| `red-500` | Mensagem de erro (texto), focus ring |
| `red-600` | Botão danger |
| `red-700` | Hover botão danger |
| `rose-50 / rose-500/10` | Fundo de badge erro |
| `rose-100 / rose-500/20` | Borda de badge erro |
| `rose-700 / rose-400` | Texto de badge erro |

#### Processando — Blue
Representa estados de carregamento e colaboradores.

| Token | Uso |
|---|---|
| `blue-50 / blue-500/10` | Fundo de badge processing/collaborator |
| `blue-100 / blue-500/20` | Borda |
| `blue-400` | Ícone/texto dark |
| `blue-700` | Texto (light) |

#### Premium / IA — Violet
Recursos de IA e grupos avançados.

| Token | Uso |
|---|---|
| `violet-50 / violet-500/10` | Fundo de seção IA, badge group |
| `violet-100 / violet-500/20` | Borda |
| `violet-400` | Ícone/texto dark |
| `violet-500 / violet-600` | Ícones de destaque premium |
| `violet-700` | Texto (light) |

#### Plataforma — Fuchsia
Exclusivo para conteúdo do Instagram.

| Token | Uso |
|---|---|
| `fuchsia-50 / fuchsia-500/10` | Fundo badge Instagram |
| `fuchsia-100 / fuchsia-500/20` | Borda |
| `fuchsia-400` | Ícone/texto dark |
| `fuchsia-700` | Texto (light) |

---

### 2.4 Opacidade em Cores Dark Mode

No dark mode, backgrounds de badges usam a notação `color/opacity` do Tailwind para evitar cores sólidas pesadas:

```
bg-emerald-500/10   →  10% de opacidade
border-emerald-500/20  →  20% de opacidade
```

Isso cria um visual suave e consistente em superfícies escuras.

---

## 3. Tipografia

### 3.1 Fontes

| Fonte | Variável CSS | Uso |
|---|---|---|
| **Geist Sans** | `--font-geist-sans` | Toda a interface |
| **Geist Mono** | `--font-geist-mono` | Código, dados técnicos |

Ambas são carregadas via `next/font/google` com subset `latin`.

### 3.2 Escala de Tamanhos

| Nome | Classe Tailwind | Tamanho | Uso |
|---|---|---|---|
| Display | `text-2xl` | 1.5rem / 24px | Títulos de modais, headings de página |
| H1 | `text-xl` | 1.25rem / 20px | Títulos de seção, modal header |
| H2 | `text-lg` | 1.125rem / 18px | Subtítulos de seção |
| H3 | `text-base` | 1rem / 16px | Títulos de card, itens de lista |
| Body | `text-sm` | 0.875rem / 14px | Texto padrão de interface |
| Small | `text-xs` | 0.75rem / 12px | Labels, badges, hints, meta info |

### 3.3 Pesos

| Classe | Peso | Uso |
|---|---|---|
| `font-normal` | 400 | Texto de corpo, hints |
| `font-medium` | 500 | Subtítulos, botões, labels de input |
| `font-semibold` | 600 | Títulos de modal, badges, labels de destaque |
| `font-bold` | 700 | Títulos de página, valores monetários de destaque |

### 3.4 Hierarquia Tipográfica Completa

```
Label de seção:   text-xs uppercase tracking-wider font-semibold text-indigo-600 dark:text-indigo-400
Título de página: text-xl sm:text-2xl font-bold text-slate-900 dark:text-white
Título de card:   text-base font-semibold text-slate-900 dark:text-white
Subtítulo:        text-sm font-medium text-slate-700 dark:text-slate-200
Corpo:            text-sm text-slate-600 dark:text-slate-400
Meta/hint:        text-xs text-slate-500 dark:text-slate-400
Placeholder:      placeholder:text-slate-400 dark:placeholder:text-slate-500
Label de input:   text-sm font-medium text-slate-700 dark:text-slate-300
Erro de input:    text-xs text-red-500
```

### 3.5 Letter Spacing

| Classe | Uso |
|---|---|
| `tracking-wider` | Labels de seção em uppercase |
| (padrão) | Todo o resto |

---

## 4. Espaçamento

Baseado na escala padrão do Tailwind (1 unidade = 0.25rem = 4px).

### 4.1 Escala de Referência

| Classe | Valor | Pixels |
|---|---|---|
| `0.5` | 0.125rem | 2px |
| `1` | 0.25rem | 4px |
| `1.5` | 0.375rem | 6px |
| `2` | 0.5rem | 8px |
| `2.5` | 0.625rem | 10px |
| `3` | 0.75rem | 12px |
| `4` | 1rem | 16px |
| `5` | 1.25rem | 20px |
| `6` | 1.5rem | 24px |
| `8` | 2rem | 32px |
| `10` | 2.5rem | 40px |
| `12` | 3rem | 48px |

### 4.2 Padding de Componentes

| Componente | Padding |
|---|---|
| Card | `p-4 sm:p-6` |
| Modal (header/body) | `p-6` |
| Input | `py-2.5 px-4` |
| Botão SM | `px-3 py-1.5` |
| Botão MD | `px-4 py-2` |
| Botão LG | `px-6 py-3` |
| Badge (pill) | `px-2 py-0.5` |
| Badge (default) | `px-2.5 py-1` |
| Sidebar | `p-4` |

### 4.3 Gap e Espaçamento de Layout

| Uso | Classe |
|---|---|
| Entre elementos inline | `gap-1`, `gap-2` |
| Entre campos de formulário | `gap-3`, `gap-4` |
| Entre cards / seções | `gap-4`, `gap-6` |
| Espaço vertical entre seções | `space-y-4`, `space-y-6` |
| Espaço interno de lista | `space-y-1.5`, `space-y-2` |

### 4.4 Responsividade de Espaçamento

Padrão responsivo adotado nos cards e layouts:
```
p-4 sm:p-6          → padding aumenta em telas maiores
gap-2 sm:gap-4      → gap responsivo
flex-col sm:flex-row → empilha no mobile, lado a lado no desktop
```

---

## 5. Bordas e Sombras

### 5.1 Border Radius

| Classe | Valor | Uso |
|---|---|---|
| `rounded-md` | 6px | Badges padrão, itens de menu da sidebar |
| `rounded-lg` | 8px | **Cards, botões, modais — padrão principal** |
| `rounded-xl` | 12px | Inputs (legado; novos containers usam `rounded-lg`) |
| `rounded-full` | 9999px | Badges pill, avatares, scrollbar thumb, barras de progresso |

**Regra geral (visual minimalista — raios contidos):**
- `rounded-lg` → cards, containers principais, botões, modais, menus
- `rounded-md` → badges, itens de navegação, chips
- `rounded-full` → elementos circulares, pills, barras finas
- `rounded-xl` só permanece em inputs existentes — não usar em cards novos

### 5.2 Bordas

| Contexto | Light | Dark |
|---|---|---|
| Card | `border-slate-200` | `border-slate-700` |
| Input (normal) | `border-slate-200` | `border-slate-700` |
| Input (erro) | `border-red-400` | `border-red-400` |
| Input (foco) | `border-indigo-400` | `border-indigo-400` |
| Modal | `border-slate-200` | `border-slate-700` |
| Separador de seção | `border-slate-100` | `border-slate-700` |

### 5.3 Sombras

| Classe | Uso |
|---|---|
| `shadow-xs dark:shadow-none` | Cards padrão (elevação mínima — visual chapado/minimalista) |
| `shadow-sm` | Botão secondary, dropdowns |
| `shadow-sm shadow-indigo-200` | Botão primary (light only) |
| `shadow-sm shadow-red-200` | Botão danger (light only) |
| `shadow-xl` | Modais |
| `dark:shadow-none` | Remove sombras no dark |

**Princípio:** No dark mode, a separação visual vem das superfícies (card `#18181b` sobre página `#09090b`) e das bordas `#27272a` — não de sombras. Apenas `shadow-xl` é mantida em modais.

---

## 6. Animações e Transições

### 6.1 Transições Padrão

| Classe | Uso |
|---|---|
| `transition-colors` | Botões, links, badges — mudança de cor no hover |
| `transition-colors duration-200` | Badge (mais rápido) |
| `transition-colors duration-300` | Links e botões principais |
| `transition-all` | Botões com escala |

### 6.2 Micro-interações de Botões

```css
/* Todos os botões */
hover:scale-105    → cresce levemente ao hover
active:scale-95    → pressiona ao clicar

/* Botão desabilitado / loading */
hover:scale-100    → cancela escala (fica estático)
opacity-50 cursor-not-allowed
```

### 6.3 Animações de Entrada

Usadas via classes `animate-in` do Tailwind (plugin `tailwindcss-animate`):

| Componente | Animação |
|---|---|
| Backdrop do modal | `animate-in fade-in duration-200` |
| Conteúdo do modal | `animate-in zoom-in-95 duration-200` |
| Toast notification | `animate-in slide-in-from-right-4 duration-300` |
| Bolha nova no chat de teste da IA | `animate-bubble-in` (utilitário em `globals.css`) |
| Três pontinhos de "digitando" | `animate-typing`, com `[animation-delay:170ms]` e `[animation-delay:340ms]` no 2º e 3º ponto |

As duas animações do chat ficam desligadas quando o sistema pede menos movimento (`prefers-reduced-motion`), já tratado em `globals.css`.

### 6.4 Loading State

```tsx
// Spinner padrão
<Loader2 size={14} className="animate-spin" />

// Aplicado em botões com loading=true
// Ícone é substituído pelo spinner, texto muda para loadingText
```

---

## 7. Dark Mode

### 7.1 Ativação

Dark mode é controlado por classe na raiz:
```css
@custom-variant dark (&:where(.dark, .dark *));
```

A classe `.dark` é aplicada no `<html>` ou no elemento raiz. O toggle é feito via JavaScript pelo componente de tema.

### 7.2 Superfícies — Zinc

O dark mode usa a escala Zinc deslocada (ver §2.2). Resultado prático:

| Superfície | Classe no código | Hex renderizado |
|---|---|---|
| Página | `dark:bg-slate-900` | `#09090b` (zinc-950) |
| Card / sidebar / header | `dark:bg-slate-800` | `#18181b` (zinc-900) |
| Borda / separador | `dark:border-slate-700` | `#27272a` (zinc-800) |
| Hover de superfície | `dark:hover:bg-slate-700(/50)` | `#27272a` |
| Elemento elevado (tooltip) | `dark:bg-slate-700` | `#27272a` |

O `globals.css` também define `color-scheme: dark` dentro de `.dark`, para que
controles nativos (inputs de data, scrollbars, autofill) acompanhem o tema.

### 7.3 Padrão de Classes

Sempre use o par `light / dark:` em cores:

```tsx
// Fundo
bg-white dark:bg-slate-800           // cards
bg-slate-50 dark:bg-slate-900        // páginas

// Texto
text-slate-900 dark:text-white       // primário
text-slate-600 dark:text-slate-400   // secundário
text-slate-500 dark:text-slate-400   // terciário

// Bordas
border-slate-200 dark:border-slate-700

// Interações
hover:bg-slate-100 dark:hover:bg-slate-700
```

### 7.4 Scrollbar (globals.css)

```css
/* Light */
scrollbar-color: #d4d4d8 transparent;   /* zinc-300 */
thumb hover: #a1a1aa;                    /* zinc-400 */

/* Dark */
scrollbar-color: #3f3f46 transparent;   /* zinc-700 */
thumb hover: #52525b;                    /* zinc-600 */

/* Dimensões */
width: 6px; height: 6px;
border-radius: 9999px;
```

---

## 8. Componentes Base

### 8.1 Button

**Arquivo:** `src/components/Button.tsx`

**Props:**
- `variant`: `primary` | `secondary` | `ghost` | `danger` (default: `primary`)
- `size`: `sm` | `md` | `lg` (default: `md`)
- `loading`: boolean — mostra spinner e desabilita
- `loadingText`: string — texto alternativo durante loading
- `icon`: ReactNode — ícone à esquerda do texto

**Variantes:**

| Variante | Estilo Light | Estilo Dark |
|---|---|---|
| `primary` | `bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-200` | `shadow-none` |
| `secondary` | `bg-slate-100 text-slate-700 hover:bg-slate-200` | `bg-slate-700 text-slate-200 hover:bg-slate-600` |
| `ghost` | `bg-transparent text-slate-600 hover:bg-slate-100` | `text-slate-300 hover:bg-slate-700` |
| `danger` | `bg-red-600 text-white hover:bg-red-700 shadow-sm shadow-red-200` | `shadow-none` |

**Tamanhos:**

| Size | Classes | Altura aprox. |
|---|---|---|
| `sm` | `px-3 py-1.5 text-xs` | 28px |
| `md` | `px-4 py-2 text-sm` | 36px |
| `lg` | `px-6 py-3 text-base` | 48px |

```tsx
<Button variant="primary" size="md" icon={<Plus size={16} />}>
  Criar novo
</Button>

<Button variant="danger" loading loadingText="Excluindo...">
  Excluir
</Button>
```

---

### 8.2 Card

**Arquivo:** `src/components/Card.tsx`

```tsx
// Estilo fixo
bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs dark:shadow-none
```

Aceita `className` para extensão. Usado como container padrão de seções.

```tsx
<Card className="p-6">
  <h2>Conteúdo</h2>
</Card>
```

---

### 8.3 Input

**Arquivo:** `src/components/Input.tsx`

**Props:**
- `label`: texto do label (opcional)
- `required`: boolean — exibe asterisco vermelho (`text-red-500`) após o label; disponível também em Textarea e Dropdown. Campos obrigatórios em formulários devem usá-lo
- `error`: mensagem de erro (muda borda para red-400)
- `hint`: texto de ajuda (aparece quando não há erro)
- `leftIcon`: ReactNode — ícone dentro do input à esquerda
- `rightElement`: ReactNode — elemento à direita (ex: botão de senha)

**Contador de caracteres:** quando o campo tem limite, o contador fica **abaixo do campo, alinhado à direita** (`text-[11px] tabular-nums text-slate-400`), nunca dentro do label.

**Estados visuais:**

| Estado | Borda | Focus ring |
|---|---|---|
| Normal | `slate-200 / slate-700` | `indigo-500/20` |
| Com erro | `red-400` | `red-500/20` |
| Foco | `indigo-400` | — |

```tsx
<Input
  label="Email"
  type="email"
  placeholder="voce@empresa.com"
  leftIcon={<Mail size={16} />}
  error="Email inválido"
  hint="Use seu email corporativo"
/>
```

---

### 8.4 Badge

**Arquivo:** `src/components/Badge.tsx`

**Props:**
- `type`: string — define o estilo semântico
- `text`: string — conteúdo do badge
- `icon`: ComponentType — ícone Lucide (opcional)
- `pill`: boolean — `rounded-full` ao invés de `rounded-md` com borda

**Tipos disponíveis:**

| Tipo | Cor | Significado |
|---|---|---|
| `whatsapp` | Emerald | Canal WhatsApp |
| `instagram` | Fuchsia | Canal Instagram |
| `mixed` | Indigo | Canal misto/múltiplos |
| `success` | Emerald | Ação bem-sucedida |
| `warning` | Amber | Atenção necessária |
| `error` | Rose | Falha / problema |
| `processing` | Blue | Em andamento |
| `neutral` | Slate | Estado neutro |
| `group` | Violet | Grupo / IA |
| `tag` | Slate (light) | Rótulo genérico |
| `admin` | Amber | Administrador |
| `collaborator` | Blue | Colaborador |
| `beta` | Violet | Recurso em fase beta |

```tsx
<Badge type="success" text="Ativo" icon={CheckCircle} />
<Badge type="warning" text="Trial" pill />
<Badge type="whatsapp" text="WhatsApp" icon={MessageCircle} />
<Badge type="beta" text="BETA" pill />
```

**Selos do menu lateral (`Sidebar.tsx`):** marcam o item do menu sem competir com o texto. Ficam logo depois do nome, somem no modo recolhido e usam o mesmo formato compacto (`rounded-full px-1.5 text-[9px] font-semibold leading-4 tracking-wide`).

| Selo | Classes de cor | Quando usar |
|---|---|---|
| `BETA` | `bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400` | Recurso novo, ainda em teste |
| `AVANÇADO` | `bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400` | Recurso para depois dos primeiros passos (Fluxos e Funil). Aparece só enquanto o usuário não concluiu os primeiros passos e traz `title` explicando o motivo |

O `AVANÇADO` é neutro de propósito: avisa sem desencorajar nem parecer erro. Ative pela flag `advanced` do `MenuItem` (calculada no `SidebarContext`), nunca escrevendo o selo direto na página.

---

### 8.5 Modal

**Arquivo:** `src/components/Modal.tsx`

**Props:**
- `isOpen`: boolean
- `onClose`: função — chamada ao clicar no backdrop ou pressionar Esc
- `title`: string — exibido no header
- `size`: `sm` | `md` | `lg` | `xl`

**Tamanhos:**

| Size | max-width | Uso |
|---|---|---|
| `sm` | 448px | Confirmações simples |
| `md` | 672px | Formulários padrão (default) |
| `lg` | 896px | Formulários complexos |
| `xl` | 1152px | Dashboards, tabelas |

**Estrutura interna:**
```
backdrop: fixed inset-0 bg-black/50 backdrop-blur-sm
container: bg-white dark:bg-slate-800 rounded-lg shadow-xl max-h-[90vh]
header: p-6 border-b — título + botão X
body: flex-1 overflow-y-auto p-6
```

---

### 8.6 Toast / Notificações

**Arquivo:** `src/components/Toast.tsx`

- Auto-dismiss em 4 segundos
- Dois tipos: `success` e `error`
- Animação: `slide-in-from-right-4 duration-300`
- Posição: canto inferior direito

```tsx
// Uso via ToastContainer + hook/context
toast.success('Salvo com sucesso')
toast.error('Algo deu errado')
```

---

### 8.6a MetricCard

**Arquivo:** `src/components/MetricCard.tsx`

KPI compacto padrão das páginas: título `text-sm font-semibold`, número
`text-xl sm:text-2xl tabular-nums`, `hint` opcional abaixo (11px) e `trend`
opcional — chip pill **alinhado à direita** na linha do número, com tom
`positive` (verde), `negative` (vermelho) ou `neutral` (cinza), usado para
variações tipo "+32%" / "-33% vs sem. passada".

```tsx
<MetricCard title="Total de Contatos" value="1.240" hint="82 sem canal vinculado"
  trend={{ label: '+12% vs sem. passada', tone: 'positive' }}/>
```

---

### 8.6b CardEmptyState

**Arquivo:** `src/components/CardEmptyState.tsx`

Estado vazio **dentro de cards** (o `EmptyState` continua sendo o de página inteira).
Mensagem sempre **centralizada** (horizontal e vertical, `min-h-24`) em
`text-[13px] text-slate-400 dark:text-slate-500`, com `action` opcional (ex.: um `Link`).
Regra: todo card sem dados usa este componente — nunca um `<p>` solto alinhado à esquerda.

```tsx
<CardEmptyState message="Nenhum consumo no período."/>
<CardEmptyState message="Nenhum disparo para hoje." action={<Link href="/campaigns">Criar uma campanha</Link>}/>
```

---

### 8.7 IconButton

Botão compacto somente com ícone. Usado em ações terciárias (editar, excluir inline, copiar).

```tsx
// Padrão de estilo
p-2 rounded-lg transition-colors
hover:bg-slate-100 dark:hover:bg-slate-700
text-slate-500 dark:text-slate-400
```

---

### 8.8 AudioPlayer

**Arquivo:** `src/components/AudioPlayer.tsx`

Player de áudio com forma de onda, usado no `AudioPicker` (Automações) e nos balões de áudio da inbox. Substitui o `<audio controls>` nativo, que não acompanha o tema.

- Botão circular de play/pause `h-8 w-8`, tempo `atual / total` em `tabular-nums`
- A onda vem dos picos reais do áudio; quando o CDN barra o fetch por CORS, cai numa onda genérica
- O seek é um `input[type=range]` invisível sobreposto à onda — mantém teclado e leitor de tela funcionando
- **Barras:** `bars` controla a densidade (padrão 44). Barras têm `min-w-0.5` e `gap-0.5`, então em
  espaços estreitos elas encostam e a onda vira um bloco sólido. Regra prática: ~44 barras a partir de
  `w-96`, ~28 barras em torno de `w-72` (usado nos balões da inbox)

| Variante | Quando usar | Botão | Onda preenchida | Onda vazia | Tempo |
|---|---|---|---|---|---|
| `default` | Fundo claro ou card | `bg-indigo-600 text-white` | `bg-indigo-500 dark:bg-indigo-400` | `bg-slate-300 dark:bg-slate-600` | `text-slate-500 dark:text-slate-400` |
| `accent` | Fundo sólido escuro (balão enviado, `bg-indigo-600`) | `bg-white/20 text-white` | `bg-white` | `bg-indigo-300/50` | `text-indigo-200` |

```tsx
<AudioPlayer src={src} />
<AudioPlayer src={src} variant="accent" className="w-64 max-w-full" />
```

---

### 8.9 Passo a passo numerado

**Arquivos:** `channels/components/ConnectStepList.tsx` (Canais), `GuideStep` em `cart-recovery/components/ConnectionGuide.tsx` (Recuperação) e a lista de passos do `HelpArticleView` (widget de ajuda).

É **um padrão só**: toda instrução em sequência para o usuário fazer fora do Synq (no celular, no Instagram, no painel da plataforma de vendas) vira uma lista `<ol>` com número em círculo. Nunca use parágrafo corrido nem lista com marcador para passos.

| Parte | Classes |
|---|---|
| Lista | `<ol className="space-y-2.5">` |
| Item | `flex items-start gap-3` |
| Número | `flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold` + tom (abaixo), com `aria-hidden` |
| Texto | `pt-0.5 text-sm text-slate-600 dark:text-slate-300` (ou `text-slate-700 dark:text-slate-300` quando o passo tem conteúdo extra, como botão ou campo) |
| Destaque de botão/menu citado | `StepHighlight`: `font-semibold text-slate-900 dark:text-white` |

| Tom do número | Classes | Quando usar |
|---|---|---|
| Plataforma — WhatsApp | `bg-emerald-500 dark:bg-emerald-600 text-white` | Conectar WhatsApp (QR Code ou código) |
| Plataforma — Instagram | `bg-fuchsia-500 dark:bg-fuchsia-600 text-white` | Mudar para conta profissional |
| Primária | `bg-indigo-600 dark:bg-indigo-500 text-white` | Passo a passo de ligação com a plataforma de vendas |
| Suave | `bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400` | Artigos de ajuda (leitura, não ação imediata) |

O nome do botão ou menu citado no passo é exatamente o texto que aparece na tela (ex.: "Aparelhos conectados", "Conectar um aparelho").

```tsx
<ConnectStepList tone="emerald" steps={[
  'Abra o WhatsApp no seu celular.',
  <>Entre em <StepHighlight>Aparelhos conectados</StepHighlight> e toque em <StepHighlight>Conectar um aparelho</StepHighlight>.</>,
]}/>
```

---

### 8.10 Cartões de escolha (WhatsAppKindChooser)

**Arquivo:** `channels/components/WhatsAppKindChooser.tsx`

Usado quando o usuário precisa escolher entre caminhos diferentes antes de começar (ex.: "Qual WhatsApp é para mim?"). O título do cartão é o **objetivo** do usuário ("Quero enviar promoções para muitos contatos"), e o nome técnico do recurso vai num selo neutro.

- Grade: `grid gap-2 sm:gap-3`, com `md:grid-cols-2` quando há duas opções
- Cartão (`<button>`): `group flex w-full min-w-0 flex-col gap-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-left transition-colors hover:border-indigo-300 dark:hover:border-indigo-500/40 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5`
- Ícone: `h-9 w-9 rounded-lg border` na cor da plataforma (emerald para QR Code, teal para WhatsApp Oficial, ex.: `border-teal-100 dark:border-teal-500/20 bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400`); vira `Loader2 animate-spin` durante o carregamento
- Título `text-sm font-semibold text-slate-900 dark:text-white` + `<Badge type="neutral" pill/>` com o nome do recurso
- Seta à direita: `ArrowRight` 16, `text-slate-300 dark:text-slate-600`, `group-hover:text-indigo-500 dark:group-hover:text-indigo-400`
- Descrição: `text-xs text-slate-500 dark:text-slate-400`
- Exigência importante (opcional) no rodapé: faixa `rounded-lg border border-amber-100 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1.5 text-xs text-amber-700 dark:text-amber-300` com `TriangleAlert` 13

Aparece embutido na página quando ainda não há nenhuma conexão e, depois, dentro de um `Modal size="md"` aberto pelo botão "Qual WhatsApp é para mim?".

---

### 8.11 Cartão de receita / modelo pronto

**Arquivos:** `auto-replies/components/RecipeGallery.tsx` (Automações) e `flows/components/FlowTemplatePicker.tsx` (Fluxos)

Ponto de partida para quem não sabe por onde começar: o usuário escolhe um **objetivo** e recebe a automação ou o fluxo já montado para revisar.

| Parte | Classes |
|---|---|
| Grade | `grid gap-2 sm:grid-cols-2 lg:grid-cols-3` (receitas) · `grid gap-2 sm:grid-cols-2` (fluxos) |
| Cartão (`<button>`) | `group flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition-colors hover:border-indigo-400 hover:bg-indigo-50/50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-indigo-500/50 dark:hover:bg-indigo-500/5` |
| Ícone | `flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400`, ícone 18 |
| Título / descrição | `text-sm font-semibold text-slate-900 dark:text-white` / `mt-0.5 text-xs leading-snug text-slate-500 dark:text-slate-400` |
| Destino (onde vai funcionar) | `text-[11px] font-medium text-indigo-600 dark:text-indigo-400` + `ArrowRight` 11 com `group-hover:translate-x-0.5` |
| Selo "Indicado para você" | `rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400` |
| Opção "Começar do zero" | mesmo cartão com `border-dashed border-slate-300 bg-transparent dark:border-slate-600`, ícone neutro `bg-slate-100 text-slate-500 dark:bg-slate-700/60 dark:text-slate-400` e `sm:col-span-2` |

Regras: os cartões que combinam com o tipo de negócio do usuário vêm primeiro; mostre os 6 primeiros e esconda o resto atrás de "Ver todas (N)" (`text-[13px] font-medium text-indigo-600 dark:text-indigo-400` + `ChevronDown` que gira). Abaixo da galeria, o campo "Ou descreva o que você quer" monta a automação a partir de um texto livre — nada é ativado sem confirmação.

---

### 8.12 Chat de teste da IA (AISimulator)

**Arquivo:** `ia/components/AISimulator.tsx`

Conversa de mentira para o usuário testar a IA como se fosse um cliente. Nada é enviado para ninguém.

| Parte | Classes |
|---|---|
| Área da conversa | `flex h-80 flex-col gap-2 overflow-y-auto rounded-lg border border-slate-100 bg-slate-50 p-3 sm:h-96 dark:border-slate-700 dark:bg-slate-900` |
| Bolha do cliente (direita) | `max-w-[85%] whitespace-pre-wrap break-words rounded-lg rounded-tr-none px-3 py-2 text-sm shadow-xs dark:shadow-none bg-indigo-600 text-white dark:bg-indigo-500` |
| Bolha da IA (esquerda) | mesma base com `rounded-tl-none border border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white` |
| Avatar da IA | `h-6 w-6 rounded-full bg-violet-50 dark:bg-violet-500/10` + `Bot` 14 `text-violet-600 dark:text-violet-400` |
| Digitando | bolha da IA com três pontos `h-1.5 w-1.5 animate-typing rounded-full bg-slate-400 dark:bg-slate-500` (atrasos 170ms e 340ms) e `aria-label="A IA está digitando"` |
| Entrada de bolha | `animate-bubble-in` |
| Chips de sugestão (conversa vazia, dentro do `action` de um `CardEmptyState`) | `rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-indigo-400 dark:hover:text-indigo-400` |
| Campo em pílula | `min-w-0 flex-1 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-base sm:text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white` (`text-base` no celular evita o zoom do iOS) |
| Botão de enviar | `h-10 w-10 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 active:scale-95 dark:bg-indigo-500 dark:hover:bg-indigo-600` |

Falhas aparecem num `Callout tone="warning"` abaixo da conversa com o botão "Tentar de novo"; o rótulo do campo existe só para leitor de tela (`sr-only`).

---

### 8.13 Widget de ajuda

**Arquivos:** `components/support-chat/SupportChatWidget.tsx`, `HelpPanel.tsx`, `HelpArticleView.tsx`, `HelpContactCard.tsx`

O botão flutuante abre um painel com duas abas (`SegmentedControl`): **Ajuda** (artigos) e a conversa com o suporte. Os artigos vivem em `helpArticles.ts` e sempre citam os nomes exatos de menus e botões.

- **Painel:** tela cheia no celular; a partir de `sm`, janela `sm:h-140 sm:w-105 sm:rounded-t-lg sm:border sm:border-b-0 sm:border-slate-200 sm:shadow-xl sm:dark:border-slate-700` presa ao canto inferior direito, fundo `bg-white dark:bg-slate-800`
- **Rótulo de seção** ("Sugestões para esta tela", "Todos os assuntos"): `text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400`
- **Cartão de artigo:** `group flex w-full items-start gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-left hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-indigo-500/50 dark:hover:bg-indigo-500/5`; ícone `h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400`; título `text-sm font-medium`; resumo `line-clamp-2 text-xs text-slate-500 dark:text-slate-400`; `ChevronRight` 16 que fica indigo no hover
- **Lista por assunto:** grupo `overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800`, cabeçalho com ícone 14 indigo e `divide-y divide-slate-100 dark:divide-slate-700` entre os artigos
- **Leitor de artigo:** botão "voltar" discreto (`text-xs font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700`), categoria `text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400`, título `text-base font-semibold`, passos no padrão 8.9 (tom suave), dica em `Callout tone="info"` com `Lightbulb` 14 e botão primário de largura total para ir à tela. Se o usuário já está na tela do artigo, o botão vira `Callout tone="success"` ("Você já está na tela certa").
- **Cartão "Ainda precisa de ajuda?":** `rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800`, com o botão primário de falar com o suporte e, quando houver número, o **botão de WhatsApp verde**:

```tsx
<a className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white
  shadow-sm shadow-emerald-200 transition-all hover:scale-105 hover:bg-emerald-700 active:scale-95 dark:shadow-none">
  <MessageCircle size={14}/> Falar no WhatsApp
</a>
```

O verde (`emerald-600`) é reservado a ações que abrem o WhatsApp de verdade; não use em botões comuns.

---

## 9. Padrões de Layout

### 9.1 Estrutura de Página

```
┌─────────────────────────────────────────┐
│  Header (fixo no topo)                  │
├──────────┬──────────────────────────────┤
│ Sidebar  │  Conteúdo principal          │
│ (fixo)   │  (scrollável)                │
│          │                              │
└──────────┴──────────────────────────────┘
```

- **Header**: `h-14`, borda inferior, tema toggle, notificações
- **Sidebar**: `w-60` expandida, `w-16` colapsada, fundo `white/slate-800`; itens compactos (`text-[13px]`, ícone 16, `py-[7px]`, `rounded-md`)
- **Main**: flex-1, padding interno `p-3 sm:p-5`, background `gray-50/slate-900`

### 9.2 Padrão de Seção em Página

```tsx
// Seção padrão dentro de página de configurações
<div className="space-y-6">
  {/* Label de categoria */}
  <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
    Categoria
  </p>

  <Card className="p-6">
    {/* Cabeçalho do card com ação */}
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
          Título
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Descrição
        </p>
      </div>
      <Button size="sm">Ação</Button>
    </div>

    {/* Conteúdo */}
  </Card>
</div>
```

### 9.3 Formulários

```tsx
// Grid de formulário responsivo
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <Input label="Nome" />
  <Input label="Email" />
</div>

// Ações de formulário (alinhadas à direita)
<div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
  <Button variant="ghost">Cancelar</Button>
  <Button type="submit">Salvar</Button>
</div>
```

### 9.4 Zona de Perigo (DangerZone)

```tsx
// Arquivo: src/components/DangerZone.tsx
// Estilo:
bg-red-50 dark:bg-red-500/5
border border-red-100 dark:border-red-500/20
rounded-xl p-6
```

Usado para ações irreversíveis (excluir conta, cancelar plano).

### 9.5 Empty State

```tsx
// Arquivo: src/components/EmptyState.tsx
// Centralizado, ícone grande, título e descrição + CTA opcional
flex flex-col items-center justify-center py-12
text-center space-y-3
```

### 9.6 Landing — Superfícies e Transições de Seção

Na landing (`app/(public)/`) as seções **não têm fundo próprio**. Existe uma única superfície
contínua, declarada uma vez em `page.tsx`, que cobre todo o bloco claro de uma vez só:

```tsx
<div className="relative">
  <div aria-hidden="true" className="pointer-events-none absolute inset-0
    bg-[linear-gradient(to_bottom,#eef2ff_0%,#f4f6ff_8%,#ffffff_20%,#f8fafc_34%,#ffffff_48%,#f8fafc_62%,#ffffff_76%,#f8fafc_88%,#ffffff_100%)]" />
  <div className="relative">{/* Hero … Faq, todas sem classe de fundo */}</div>
</div>
```

> **Sem fundo por seção, não existe emenda.** O tom varia lentamente ao longo da página inteira,
> nunca de um bloco para o outro. A ordem das seções pode mudar (feature flags) sem quebrar nada.

**Regras:**

- Seção clara: nenhuma classe `bg-*` no `<section>`. Só `py-24` (+ `relative`/`overflow-hidden`).
- Decoração (orbe `blur-3xl`, wash radial) **nunca encosta na borda** da seção: o `overflow-hidden`
  corta o blur em linha reta e esse corte aparece como emenda. Afaste da borda (`top-32`) ou apague
  com máscara antes dela: `[mask-image:linear-gradient(to_bottom,black_30%,transparent_95%)]`.
- Um wash usa **uma família de matiz só** (indigo no hero). Misturar indigo + fuchsia + emerald no
  mesmo fundo deixa a superfície manchada.
- Nunca separe seções com `border-t` — não há emenda para marcar.

**Seções escuras** (`FinalCta`, `CartRecoverySection`) mantêm fundo próprio e ficam **fora** da
superfície contínua, que termina em branco puro para encontrá-las. A passagem é o
`SectionBlend` (`app/(public)/components/SectionBlend.tsx`), rampa oficial branco → noite:

`#ffffff → #eef2ff (indigo-50) → #312e81 (indigo-900) → slate-950 transparente`, em `h-28 sm:h-36`.

A rampa é tingida de indigo — cor primária do sistema — para "anoitecer" em vez de virar cinza sujo.
O último stop é transparente de propósito: revela o fundo real da seção, então a mesma rampa serve
para qualquer base escura. Renderize-a **depois** dos overlays decorativos e **antes** do conteúdo,
com `edge="top"` e/ou `edge="bottom"` conforme a vizinhança.

**Destaque de headline:** cor sólida do sistema (`text-indigo-600`). Texto em gradiente fica
reservado a destaques sobre fundo escuro.

### 9.7 Teste grátis — barra de uso, fim do teste e faixa de aviso

**Arquivos:** `components/TrialBanner.tsx` e `components/TrialEndedScreen.tsx`

**Faixa do teste (`TrialBanner`):** fica acima do conteúdo, `mb-4 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-xs dark:border-slate-700 dark:bg-slate-800 dark:shadow-none`, com ícone `h-8 w-8 rounded-lg`, botão "Escolher plano" (`size="sm"`) e um `X` discreto para fechar. Quando o uso de IA ou de mensagens passa de 80% do limite do teste, a faixa troca a contagem de dias pela **barra de uso**:

| Parte | Classes |
|---|---|
| Trilho | `mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700`, com `role="progressbar"` e `aria-valuenow` |
| Preenchimento (perto do limite) | `h-full rounded-full bg-amber-500 dark:bg-amber-400` |
| Preenchimento (limite atingido) | `h-full rounded-full bg-red-500 dark:bg-red-400` |
| Ícone (perto do limite) | `bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400` |
| Ícone (limite atingido) | `bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400` |

Nesse modo o botão vira "Assinar agora". O texto fala do resultado ("Sua IA já respondeu 80 de 100 mensagens do teste"), não do limite técnico. Com o limite atingido a faixa não pode ser fechada.

**Tela de fim do teste (`TrialEndedScreen`):** substitui o conteúdo das páginas quando o teste acabou (exceto `/plans` e `/settings`). Centralizada em `mx-auto w-full max-w-xl py-6 sm:py-12`, dentro de um `Card` com `overflow-hidden`:

- Topo: `border-b border-slate-100 bg-slate-50 px-6 py-8 text-center dark:border-slate-700 dark:bg-slate-900/40 sm:px-8`, ícone `Hourglass` em `h-12 w-12 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400`, título `text-xl sm:text-2xl font-semibold`
- Lista do que ficou guardado: título com `CheckCircle2` `text-emerald-500 dark:text-emerald-400` e itens com ícone em `h-7 w-7 rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300`. A mensagem central é sempre "nada foi apagado"
- Aviso do que está parado: faixa `rounded-lg border border-violet-100 bg-violet-50 px-4 py-3 dark:border-violet-500/20 dark:bg-violet-500/10` com texto `text-xs text-violet-700 dark:text-violet-300`
- Ações: `flex flex-col gap-2 sm:flex-row`, "Escolher um plano" (`size="lg"` primário) e "Falar com o suporte" (`variant="secondary"`, abre direto a conversa do widget). Para quem não pode assinar, as ações viram um aviso neutro pedindo ao responsável pela conta

**Faixa de fim de teste (`TrialEndedNotice`):** em Configurações, no lugar da tela inteira: `mb-4 flex flex-col gap-3 rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-amber-500/20 dark:bg-amber-500/10`, texto `text-sm text-amber-700 dark:text-amber-300`, `Hourglass` 16 e botão "Escolher um plano" `size="sm"`.

### 9.8 Canais — status, selo de atenção e "Reconectar"

**Arquivo:** `channels/components/ChannelTypeCard.tsx`

Cada conexão da lista mostra um ponto no avatar e um selo de status. Conexão que caiu e precisa do usuário recebe o tom de **atenção** (âmbar), diferente de uma conexão apenas desligada (cinza).

| Estado | Ponto no avatar | Selo (`rounded-full px-2 py-0.5 text-[10px] font-semibold`, oculto no celular) |
|---|---|---|
| Ativo | `bg-emerald-500` | `bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400` |
| Precisa de atenção (ex.: "Desconectado") | `bg-amber-500` | `bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400` |
| Parado | `bg-slate-300 dark:bg-slate-600` | `bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400` |

O ponto fica em `absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-slate-800`.

**Ação "Reconectar":** quando a conexão não está ativa, o ícone de ligar dá lugar a um botão com texto — mais fácil de achar do que um ícone sozinho:

```tsx
'shrink-0 inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-semibold transition-colors cursor-pointer
 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30 hover:bg-indigo-50 dark:hover:bg-indigo-500/10'
// + <RotateCcw size={12}/> Reconectar
```

As demais ações da linha (sincronizar, renomear, remover) seguem como `h-7 w-7` só com ícone. No topo do cartão, a barra `h-1` mostra quantas conexões estão "no ar" (`{ativas}/{total} no ar`).

### 9.9 Linha de resultados do cartão de automação

**Arquivo:** `auto-replies/components/AutomationCard.tsx`

Rodapé do cartão que mostra se a automação está trazendo resultado. Fica separado por `border-t border-slate-100 pt-2.5 dark:border-slate-700/60`, em `text-xs`.

- Com disparos: `flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-500 dark:text-slate-400`, cada métrica com ícone 12 — `Zap` e `Send` em `text-indigo-500 dark:text-indigo-400`, `MousePointerClick` (cliques) em `text-emerald-500 dark:text-emerald-400`. O número principal ("12 disparos") vai em `font-semibold text-slate-900 dark:text-white`; "última vez hoje/ontem/há N dias" fecha a linha em `text-slate-400 dark:text-slate-500`
- Sem disparos: uma linha só, "Ainda não disparou", em `text-slate-400 dark:text-slate-500` com `Zap` 12
- Enquanto os números carregam, a linha não aparece (nada de "0" provisório)

Textos sempre no plural certo ("1 clique", "3 cliques") e falando de pessoas ("5 pessoas receberam o link").

### 9.10 Seção recolhível "Mais opções"

**Arquivo:** `auto-replies/components/AutomationModal.tsx`

Esconde ajustes finos que já vêm no valor que funciona melhor, para o formulário principal ficar curto.

```tsx
<section className="border-t border-slate-100 pt-5 dark:border-slate-700/60">
  <button type="button" aria-expanded={open} className="flex w-full cursor-pointer items-center justify-between gap-3 text-left">
    <span>
      <span className="block text-sm font-semibold text-slate-900 dark:text-white">Mais opções</span>
      <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">Já vem configurado do jeito que funciona melhor. Só mexa se precisar.</span>
    </span>
    <ChevronDown size={16} className={`shrink-0 text-slate-400 dark:text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}/>
  </button>
  {open && <div className="mt-4 space-y-4">…</div>}
</section>
```

Regras: começa fechada; nada obrigatório pode ficar aqui dentro; quando um valor escondido muda o comportamento (ex.: resposta com formato especial ou mensagens extras sorteadas), o formulário principal avisa e manda o usuário para "Mais opções".

### 9.11 Seletor "Modo simples" / "Configurações avançadas"

**Arquivo:** `ia/page.tsx` (usa `SegmentedControl`)

Páginas com muitas configurações oferecem um caminho curto e um completo. O seletor fica no cabeçalho da página, à direita do título (`flex flex-wrap items-center gap-2`), com as opções "Modo simples" e "Configurações avançadas".

- Trilho: `inline-flex flex-wrap rounded-xl border border-slate-200 bg-slate-100/70 p-1 dark:border-slate-700 dark:bg-slate-800`
- Opção ativa: `rounded-lg font-semibold bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white`
- Opção inativa: `text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200`

Quem ainda não configurou nada abre no modo simples; quem já configurou abre no avançado. Links diretos para uma aba (`?tab=`) sempre abrem o avançado. A descrição abaixo do título muda junto com o modo.

### 9.12 Indicador de espera (teste de conexão)

**Arquivo:** `cart-recovery/components/ConnectionGuide.tsx`

Usado quando o Synq está esperando algo que o usuário vai fazer em outro lugar (ex.: uma compra de teste na plataforma de vendas). Diz o que está esperando e que a janela pode ficar aberta.

| Estado | Classes |
|---|---|
| Esperando | `flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300` + `Loader2` 14 `animate-spin` |
| Recebido | `flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300` + `CheckCircle2` 16 |

Azul é o tom de "processando" (seção 2.3); a confirmação usa verde e texto um pouco maior, porque é o momento de alívio do usuário.

### 9.13 Métrica em destaque (valor recuperado)

**Arquivo:** `cart-recovery/components/SummaryCards.tsx`

Quando uma página tem **um** número que prova o valor do Synq (ex.: "R$ recuperados este mês"), ele aparece acima dos `MetricCard` comuns, num bloco próprio:

- Bloco: `flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4 sm:items-center sm:p-5 dark:border-emerald-500/20 dark:bg-emerald-500/10`
- Ícone: `h-10 w-10 rounded-lg bg-white text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400`, ícone 20
- Valor: `text-2xl sm:text-3xl font-bold tracking-tight tabular-nums text-emerald-700 dark:text-emerald-300`, com o complemento ("recuperados este mês") na mesma linha em `ml-2 text-base sm:text-lg font-semibold`
- Frase de apoio: `mt-1 text-sm text-emerald-700 dark:text-emerald-300`, explicando o número em linguagem simples; com zero, diz o que vai aparecer ali

Use no máximo um bloco desses por página.

---

## 10. Ícones

**Biblioteca:** [Lucide React](https://lucide.dev/) v0.563

**Tamanhos padrão:**

| Contexto | Size |
|---|---|
| Dentro de badge | `size={12}` |
| Texto body / input | `size={14}` – `size={16}` |
| Botão de ação | `size={16}` |
| Header de modal / fechar | `size={20}` |
| Empty state / destaque | `size={48}` – `size={64}` |

**Cor dos ícones:** sempre herda a cor do texto pai. Para ícones decorativos:
```tsx
className="text-slate-400 dark:text-slate-500"
```

---

## 11. Acessibilidade

### 11.1 Focus Ring

Inputs usam `focus:ring-2` com opacidade para não poluir visualmente:
```
focus:ring-indigo-500/20 focus:border-indigo-400   // normal
focus:ring-red-500/20 focus:border-red-400          // erro
```

### 11.2 Semântica HTML

- Botões `<button>` com `type` explícito (`button`, `submit`, `reset`)
- Labels associadas via `htmlFor` / `id` nos inputs
- Modais bloqueiam scroll do body e escutam `Escape`
- Estados desabilitados com `disabled` nativo + `cursor-not-allowed opacity-50`

### 11.3 Contraste

Segue os pares de cor testados:
- Texto `slate-700` em fundo `white` → alto contraste
- Texto `slate-400` em fundo `slate-800` → contraste adequado para texto secundário
- Botão primary (`white` em `indigo-600`) → WCAG AA

---

## 12. Diretrizes de Uso

### 12.1 O que fazer

- Use `rounded-lg` em cards, containers, botões e modais; `rounded-md` em badges e itens de navegação
- Aplique sempre o par `light / dark:` ao definir cores
- Use `transition-colors` em elementos interativos
- Use a hierarquia tipográfica definida (não misture pesos/tamanhos arbitrários)
- Prefira `space-y-*` para listas e `gap-*` em flex/grid
- Use `text-sm` como tamanho de corpo padrão

### 12.2 O que evitar

- Não use cores fora do vocabulário definido (evite cores arbitrárias não-semânticas)
- Não adicione sombras coloridas no dark mode (use `dark:shadow-none`)
- Não use `font-bold` em texto de corpo — apenas em headings e valores numéricos de destaque
- Não crie novos componentes quando os existentes cobrem o caso de uso
- Não use CSS inline ou módulos CSS para estilização — use Tailwind

### 12.3 Extensão de Componentes

Para customizar um componente existente, use a prop `className`:
```tsx
// OK — estender via className
<Card className="p-8 border-indigo-200">...</Card>

// NÃO — reescrever componente para caso único
```

### 12.4 Novos Componentes

Todo novo componente deve:
1. Aceitar `className?: string` para extensibilidade
2. Suportar dark mode desde o início
3. Usar apenas classes Tailwind (sem estilos inline)
4. Seguir a hierarquia tipográfica e paleta de cores deste documento

---

## 13. Temperatura de Lead (Funil / CRM)

O quadro Kanban do Funil classifica cada lead em quatro temperaturas, numa escala térmica (frio → quente). Use exatamente estes tokens:

| Temperatura | Token | Chip (light) | Indicador |
|---|---|---|---|
| Frio | `blue` | `bg-blue-50 text-blue-700 border-blue-200` | `bg-blue-500` |
| Morno | `amber` | `bg-amber-50 text-amber-700 border-amber-200` | `bg-amber-500` |
| Aquecido | `orange` | `bg-orange-50 text-orange-700 border-orange-200` | `bg-orange-500` |
| Quente | `red` | `bg-red-50 text-red-700 border-red-200` | `bg-red-500` |

No dark mode use a notação `color/opacity` (ex: `dark:bg-blue-500/10 dark:text-blue-300`). O token `orange` é **exclusivo** da escala de temperatura de lead — não use em outros contextos. O anel de score (0–100) herda a cor da temperatura correspondente.

---

## 13.1 Blocos do Construtor de Fluxos

**Arquivo:** `src/app/(private)/flows/components/blocks.ts`

Cada tipo de bloco do canvas tem um matiz próprio, usado no ponto da paleta
(`bg-{cor}-500`) e no rótulo do tipo dentro do card (`text-{cor}-600 dark:text-{cor}-400`).
A cor aqui é só identificação — não carrega significado de status —, e por isso este é o
único contexto em que `green`, `pink`, `lime`, `stone`, `yellow`, `red`, `zinc`, `gray` e
`neutral` são permitidos.

| Bloco | Token | Bloco | Token |
|---|---|---|---|
| Iniciar por palavra | `indigo` | Horário de atendimento | `orange` |
| Qualquer mensagem | `indigo` | | |
| Boas-vindas | `green` | Dividir aleatoriamente | `fuchsia` |
| Reagiu ao story | `pink` | Aguardar tempo | `blue` |
| Mencionou no story | `red` | Aplicar etiqueta | `emerald` |
| Enviar mensagem | `slate` | Remover etiqueta | `teal` |
| Enviar link | `sky` | Verificar etiqueta | `cyan` |
| Enviar mídia | `lime` | Mover no funil | `zinc` |
| Enviar documento | `stone` | Situação do atendimento | `gray` |
| Perguntar com opções | `violet` | Notificar equipe | `neutral` |
| Inteligência artificial | `yellow` | Atribuir atendente | `rose` |
| Aguardar resposta | `purple` | Passar para atendente | `rose` |
| Desviar por palavra | `amber` | | |

Duas exceções, ambas deliberadas:

- **`orange` no bloco de horário.** A reserva do `orange` protege a escala de temperatura
  de lead no quadro do Funil; o canvas de fluxos é outra tela, onde não há escala térmica
  com que confundir. Fora dessas duas telas o token continua proibido.
- **Matiz repetido em dois pares.** A paleta padrão do Tailwind tem 22 matizes e o
  construtor já passou disso, então a repetição é inevitável — a regra é repetir no par
  funcionalmente mais próximo, deixando o rótulo ao lado do ponto separar os dois:
  `rose` em *Atribuir atendente* e *Passar para atendente* (ambos entregam a conversa a uma
  pessoa) e `indigo` em *Iniciar por palavra* e *Qualquer mensagem* (ambos começam o fluxo
  por mensagem recebida).

Um bloco novo escolhe um matiz ainda não usado na tabela e o registra aqui antes de ir
para o código; esgotada a paleta, repete o matiz do bloco funcionalmente mais próximo.

---

## 13.2 Diagnóstico — Conversa Estilo WhatsApp

**Pasta:** `src/app/(public)/diagnostico/`

Página pública de anúncio, pensada primeiro para o celular: uma conversa em que o "contato"
Synq faz as perguntas e a pessoa responde tocando nas opções. Como imita o WhatsApp, é o único
lugar em que **emerald** faz o papel de cor primária (botões, seleção, progresso). O indigo
continua sendo a primária no resto do produto.

**Desktop:** a página ocupa a janela toda, como o WhatsApp Web. Cabeçalho, conversa e painel
de respostas são faixas de ponta a ponta; o conteúdo de cada uma fica em `mx-auto max-w-4xl`.
Balões passam a `lg:max-w-[70%]`, opções vão para `sm:grid-cols-2` e o campo de contato para
`sm:max-w-xl`. No resultado (`max-w-5xl`), a partir de `lg` o medidor ocupa 2 de 5 colunas e
fica `sticky`, com o texto e o botão do WhatsApp nas outras 3.

| Elemento | Light | Dark |
|---|---|---|
| Cabeçalho do contato | `bg-emerald-700 text-white`, subtítulo `text-emerald-100` | `dark:bg-slate-800`, `dark:text-slate-400` |
| Barra de progresso | trilho `bg-slate-200`, preenchimento `bg-emerald-500` | trilho `dark:bg-slate-700` |
| Fundo da conversa e do painel | `bg-slate-100` | `dark:bg-slate-900` |
| Balão recebido (Synq) | `bg-white text-slate-900` | `dark:bg-slate-800 dark:text-white` |
| Balão enviado (cliente) | `bg-emerald-100 text-slate-900` | `dark:bg-emerald-800 dark:text-white` |
| Confirmação de leitura (✓✓) | `text-blue-500` | `dark:text-blue-400` |
| Selo de verificado | `BadgeCheck` com `fill-blue-500 text-white` | — |
| Opção (um toque já responde) | `border-slate-200 bg-white`, `hover:border-emerald-500`, `active:bg-emerald-50` | `dark:border-slate-700 dark:bg-slate-800`, `dark:active:bg-emerald-500/10` |
| Botão de ação (enviar, CTA do WhatsApp) | `bg-emerald-600 hover:bg-emerald-700 text-white`; o CTA final leva `shadow-sm shadow-emerald-200` | `dark:shadow-none` |
| Item de "Como o Synq resolve" | card `bg-white border-slate-200` com check em círculo `h-5 w-5 bg-emerald-500 text-white` | `dark:bg-slate-800 dark:border-slate-700` |
| Medidor de saúde | arcos `stroke-red-500` / `stroke-amber-500` / `stroke-emerald-500`; valor e selo no tom da faixa (`text-red-600`, `text-amber-600`, `text-emerald-600`) | tons `-400` no texto, `/10` no fundo dos selos |

**Balões:** `rounded-lg`, `shadow-xs`, `max-w-[85%]`. O primeiro de cada sequência perde o
canto do lado da pontinha (`rounded-tl-none` / `rounded-tr-none`) e ganha a pontinha em SVG
(`h-3 w-2`, `fill-*` igual ao fundo do balão); os seguintes ficam colados (`mt-1`). Horário
em `text-[11px]`, flutuando no canto inferior direito.

**Campo de texto:** formato de pílula (`rounded-full`) com o botão de enviar redondo dentro,
como a barra de digitação do WhatsApp. Texto em `text-base` — abaixo de 16px o iPhone dá zoom
ao focar o campo.

**Animações** (em `globals.css`, desligadas com `prefers-reduced-motion`):

| Utilitário | Uso |
|---|---|
| `animate-bubble-in` | Entrada de balões, do painel de respostas e da tela de resultado (sobe 6px e aparece, 220ms) |
| `animate-typing` | Pontinhos do "digitando…", com `[animation-delay:170ms]` e `340ms` no segundo e terceiro |

---

## 14. Gráficos (Dashboard)

Gráficos são SVG feitos à mão (sem biblioteca), largura sempre 100% do card
(medida real via `ResizeObserver` — nunca `viewBox` esticado).

### 14.1 Série temporal — área preenchida (Origem dos envios)

**Arquivo:** `src/app/(private)/dashboard/components/MessagesAreaChart.tsx`

- Séries: origem dos envios por dia — **Enviadas pela IA** (indigo), **Enviadas manualmente** (emerald), **Enviadas por automações** (âmbar); dados de `daily[].aiSent/manualSent/automatedSent`.
- Área com gradiente vertical (topo ~22–32% de opacidade → base transparente) + linha de 2px com curva suave (bumpX).
- Grid horizontal recessivo (`slate-100/slate-700-60`), 4 linhas, labels de eixo `fontSize 10` em `slate-400`.
- Hover: crosshair vertical + pontos com anel de 2px na cor da superfície + tooltip em card do tema (`bg-white dark:bg-slate-700`).
- **Tabs de série no header** (substituem a legenda): segmented control (`border p-1 rounded-lg`, ativo = `bg-white dark:bg-slate-700`), cada tab com ponto da cor da série + label + total. Todas ativas por padrão; clicar alterna a série (`visibleKeys`), e o eixo Y reescala para as séries visíveis. Ponto cinza quando inativa. No mobile usa `shortLabel` ("IA", "Manualmente", "Automações") para as três caberem lado a lado.

### 14.2b Sparkline (cards de KPI)

**Arquivo:** `src/app/(private)/dashboard/components/Sparkline.tsx`

- Mini-linha (1.75px, bumpX) com área em gradiente e ponto no último valor; sem eixos, grid ou tooltip (`aria-hidden`).
- Os cards de KPI são gerados de `MESSAGE_SERIES` (Enviadas pela IA / manualmente / por automações) — mesmo label, cor e dado das séries do gráfico; o número fica **abaixo** do gráfico. Cards sem série diária usam `reserveSpark` para alinhar a altura.

### 14.2c Uso de IA (progresso)

**Arquivo:** `src/app/(private)/dashboard/components/AiUsageCard.tsx`

- Fonte: `useSubscription().usage.aiMessages` (workspace, ciclo atual) — sem fetch novo.
- Barra de progresso `h-2 rounded-full`: violet (`bg-violet-500 dark:bg-violet-600`), âmbar ≥ 80%, vermelho ≥ 100%; excedentes (`extraAiMessages.used`) em texto âmbar; limite `-1` = ilimitado (barra a 25% de opacidade).

### 14.3 Paleta de séries (validada para daltonismo e contraste)

As cores mudam com o tema (dark usa o degrau 600 para ficar dentro da faixa de
luminância correta sobre `#18181b`):

| Série / slot | Light | Dark |
|---|---|---|
| Enviadas pela IA | `#6366f1` | `#6366f1` |
| Enviadas manualmente | `#10b981` | `#059669` |
| Enviadas por automações | `#f59e0b` | `#d97706` |
| Reserva categórica (slots 4–8) | `#0ea5e9 #a855f7 #f43f5e #14b8a6 #f97316` | `#0284c7 #9333ea #e11d48 #0d9488 #ea580c` |
| "Outros" | `#a1a1aa` | `#71717a` |

Regras: valores e labels sempre em tokens de texto (nunca na cor da série);
identidade de série visível fora da cor (tabs/nome ao lado do ponto); um único
eixo Y; sem rosca/pizza para distribuições.

---

*Última atualização: 2026-08-22 — Zinc via @theme, cards `rounded-lg` + `shadow-xs`, layout compacto; §14: tabs de série no gráfico de mensagens, distribuição em barras horizontais, Sparkline nos KPIs e card de Uso de IA. Backend: `/dashboard/metrics` passou a enviar `daily[].contacts`.*
