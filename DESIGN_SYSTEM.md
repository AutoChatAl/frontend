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

### 2.2 Neutros — Slate

Base de toda a interface: fundos, textos, bordas, separadores.

| Token Tailwind | Hex | Uso |
|---|---|---|
| `slate-50` | `#f8fafc` | Fundo de página (light) |
| `slate-100` | `#f1f5f9` | Fundo de botão secondary, hover ghost |
| `slate-200` | `#e2e8f0` | Bordas de card/input (light) |
| `slate-300` | `#cbd5e1` | Scrollbar thumb (light), bordas sutis |
| `slate-400` | `#94a3b8` | Placeholder, ícones secundários |
| `slate-500` | `#64748b` | Texto de hint, meta info |
| `slate-600` | `#475569` | Texto de corpo (light) |
| `slate-700` | `#334155` | Texto médio, botão secondary (dark bg) |
| `slate-800` | `#1e293b` | Fundo de card (dark), texto escuro |
| `slate-900` | `#0f172a` | Fundo de input (dark), texto principal (light) |

**Mapeamento semântico:**

| Semântica | Light | Dark |
|---|---|---|
| Fundo de página | `slate-50` ou `white` | `slate-900` |
| Fundo de card | `white` | `slate-800` |
| Fundo de input | `white` | `slate-900` |
| Borda padrão | `slate-200` | `slate-700` |
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
| `rounded-md` | 6px | Badges padrão |
| `rounded-lg` | 8px | Botões, modais, elementos de UI pequenos |
| `rounded-xl` | 12px | Cards, inputs — padrão principal |
| `rounded-full` | 9999px | Badges pill, avatares, scrollbar thumb |

**Regra geral:**
- `rounded-xl` → cards, inputs, containers principais
- `rounded-lg` → botões, modais, menus
- `rounded-full` → elementos circulares, pills

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
| `shadow-sm` | Cards padrão, botão secondary |
| `shadow-sm shadow-indigo-200` | Botão primary (light only) |
| `shadow-sm shadow-red-200` | Botão danger (light only) |
| `shadow-xl` | Modais |
| `dark:shadow-none` | Remove sombras coloridas no dark |

**Princípio:** No dark mode, sombras coloridas são removidas. Apenas `shadow-xl` é mantida em modais para separação visual via elevação.

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

### 7.2 Padrão de Classes

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

### 7.3 Scrollbar (globals.css)

```css
/* Light */
scrollbar-color: #cbd5e1 transparent;   /* slate-300 */
thumb hover: #94a3b8;                    /* slate-400 */

/* Dark */
scrollbar-color: #475569 transparent;   /* slate-600 */
thumb hover: #64748b;                    /* slate-500 */

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
bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm
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
- `error`: mensagem de erro (muda borda para red-400)
- `hint`: texto de ajuda (aparece quando não há erro)
- `leftIcon`: ReactNode — ícone dentro do input à esquerda
- `rightElement`: ReactNode — elemento à direita (ex: botão de senha)

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

```tsx
<Badge type="success" text="Ativo" icon={CheckCircle} />
<Badge type="warning" text="Trial" pill />
<Badge type="whatsapp" text="WhatsApp" icon={MessageCircle} />
```

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

### 8.7 IconButton

Botão compacto somente com ícone. Usado em ações terciárias (editar, excluir inline, copiar).

```tsx
// Padrão de estilo
p-2 rounded-lg transition-colors
hover:bg-slate-100 dark:hover:bg-slate-700
text-slate-500 dark:text-slate-400
```

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

- **Header**: `h-16`, borda inferior, tema toggle, notificações
- **Sidebar**: `w-64` expandida, `w-16` colapsada, fundo `white/slate-800`
- **Main**: flex-1, padding interno `p-6`, background `slate-50/slate-900`

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

- Use `rounded-xl` em containers e inputs; `rounded-lg` em botões e modais
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

*Última atualização: 2026-05-24 — baseado na análise do código-fonte do repositório Synq frontend.*
