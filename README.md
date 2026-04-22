# Treino App

Sistema web full stack para gerenciamento privado de treinos de academia, fortalecimento para corrida e exercícios complementares.

O projeto usa Next.js App Router, TypeScript, Tailwind CSS, Supabase Auth, PostgreSQL com RLS, React Hook Form, Zod, Lucide React e Recharts.

## 1. Arquitetura Escolhida

A aplicação foi organizada como um produto real em camadas:

- `Next.js App Router`: páginas, layouts, rotas autenticadas e Server Components.
- `Supabase Auth SSR`: sessão persistida por cookies com `@supabase/ssr`, middleware e clientes separados para browser/server.
- `PostgreSQL + RLS`: todas as tabelas têm Row Level Security e policies por `auth.uid()`.
- `Server Actions`: mutações validadas no servidor com Zod antes de gravar no Supabase.
- `Feature modules`: consultas, schemas e ações ficam em `src/features`.
- `UI própria`: componentes reutilizáveis em Tailwind, sem bibliotecas pesadas de UI.
- `Seed automático`: no primeiro acesso autenticado, o app chama uma função SQL que importa os treinos padrão para o usuário logado.

Fluxo de autenticação:

1. Usuário cria conta em `/signup`.
2. Supabase envia confirmação por e-mail, quando habilitada.
3. O link confirma em `/auth/confirm`.
4. Usuário entra em `/login`.
5. O layout privado exige sessão e redireciona não autenticados.
6. Dados privados são lidos e gravados com RLS por usuário.

Fluxo de treino:

1. O usuário acessa `/app/workouts`.
2. Pode criar, editar, excluir e visualizar treinos.
3. Ao clicar em executar, uma sessão é criada em `workout_executions`.
4. Cada exercício gera ou atualiza registros em `exercise_logs`.
5. Histórico e evolução usam esses logs para frequência, cargas e calendário.

## 2. Árvore de Pastas

```txt
.
├─ .env.example
├─ .gitignore
├─ README.md
├─ eslint.config.mjs
├─ middleware.ts
├─ next-env.d.ts
├─ next.config.ts
├─ package-lock.json
├─ package.json
├─ postcss.config.mjs
├─ tsconfig.json
├─ supabase
│  ├─ schema.sql
│  └─ seed.sql
└─ src
   ├─ app
   │  ├─ (app)
   │  │  └─ app
   │  │     ├─ executions/[id]/page.tsx
   │  │     ├─ history/[id]/page.tsx
   │  │     ├─ history/page.tsx
   │  │     ├─ layout.tsx
   │  │     ├─ page.tsx
   │  │     ├─ progress/page.tsx
   │  │     └─ workouts
   │  │        ├─ [id]/edit/page.tsx
   │  │        ├─ [id]/page.tsx
   │  │        ├─ new/page.tsx
   │  │        └─ page.tsx
   │  ├─ (auth)
   │  │  ├─ forgot-password/page.tsx
   │  │  ├─ layout.tsx
   │  │  ├─ login/page.tsx
   │  │  ├─ reset-password/page.tsx
   │  │  └─ signup/page.tsx
   │  ├─ auth/confirm/route.ts
   │  ├─ globals.css
   │  ├─ layout.tsx
   │  ├─ loading.tsx
   │  └─ page.tsx
   ├─ components
   │  ├─ auth
   │  ├─ charts
   │  ├─ progress
   │  ├─ ui
   │  └─ workouts
   ├─ features
   │  ├─ onboarding/actions.ts
   │  └─ workouts
   │     ├─ actions.ts
   │     ├─ queries.ts
   │     ├─ schemas.ts
   │     └─ types.ts
   └─ lib
      ├─ auth.ts
      ├─ constants.ts
      ├─ format.ts
      ├─ supabase
      │  ├─ client.ts
      │  ├─ database.types.ts
      │  ├─ middleware.ts
      │  └─ server.ts
      └─ utils.ts
```

## 3. Dependências e Instalação

Principais dependências:

- `next`, `react`, `react-dom`
- `@supabase/ssr`, `@supabase/supabase-js`
- `react-hook-form`, `zod`, `@hookform/resolvers`
- `tailwindcss`, `@tailwindcss/postcss`
- `lucide-react`
- `recharts`

Instalação local:

```bash
npm install
```

Rodar em desenvolvimento:

```bash
npm run dev
```

Validar produção:

```bash
npm run lint
npm run build
```

## 4. Modelagem do Banco

Tabelas principais:

- `profiles`: perfil do usuário autenticado e controle do seed inicial.
- `workouts`: treinos do usuário, categoria, objetivo e agenda semanal.
- `workout_sections`: blocos/seções dos treinos.
- `exercises`: exercícios ordenados por bloco, com séries, reps, carga, vídeo e prioridade.
- `workout_executions`: execução de um treino em uma data.
- `exercise_logs`: carga, repetições, observações e conclusão por exercício.

Decisões importantes:

- `scheduled_days text[]` permite treinos em mais de um dia, como Treino A segunda/quinta e Treino B terça/sexta.
- `workout_name` e `exercise_name` são snapshots no histórico, preservando registros mesmo se o treino for renomeado ou removido.
- `exercise_logs.exercise_id` usa `on delete set null` para preservar histórico.
- Todos os dados privados têm policies de RLS por usuário.

## 5. SQL Completo

O SQL completo está em:

```txt
supabase/schema.sql
```

Ele inclui:

- criação das tabelas
- primary keys e foreign keys
- constraints
- índices
- triggers de `updated_at`
- trigger de criação de profile no cadastro
- RLS habilitado
- policies completas
- função `seed_default_workouts_for_user`
- função `seed_my_default_workouts`

## 6. Seed dos Treinos

Os treinos informados estão cadastrados dentro da função SQL em `supabase/schema.sql`.

O app chama automaticamente:

```sql
select public.seed_my_default_workouts();
```

Isso acontece no primeiro acesso autenticado ao painel privado. A função cria:

- Segunda — Quadríceps + Posterior
- Quarta — Glúteo Médio + Core Completo
- Sexta — Pliometria + Estabilidade + Ombros
- Treino A — Peito + Tríceps
- Treino B — Costas + Bíceps

O arquivo `supabase/seed.sql` é apenas um helper opcional para seed manual pelo SQL Editor, caso você queira importar para um usuário específico.

## 7. Arquivos Principais com Código

- `src/lib/supabase/client.ts`: cliente Supabase para Client Components.
- `src/lib/supabase/server.ts`: cliente Supabase para Server Components e Server Actions.
- `src/lib/supabase/middleware.ts`: refresh de sessão por cookies.
- `middleware.ts`: registra o middleware do Next.
- `src/lib/auth.ts`: helpers `getCurrentUser` e `requireUser`.
- `src/features/workouts/schemas.ts`: validações Zod dos treinos e execuções.
- `src/features/workouts/actions.ts`: CRUD de treino, exclusão, início e salvamento de execução.
- `src/features/workouts/queries.ts`: consultas do dashboard, treinos, histórico e evolução.
- `src/features/onboarding/actions.ts`: seed automático do usuário.
- `src/components/workouts/workout-form.tsx`: formulário dinâmico de treino com blocos e exercícios.
- `src/components/workouts/execution-form.tsx`: tela de execução diária.
- `src/components/progress/progress-view.tsx`: gráficos e calendário de evolução.
- `src/app/(app)/app/layout.tsx`: layout privado e proteção de sessão.
- `src/app/auth/confirm/route.ts`: confirmação de e-mail e recuperação de senha.

## 8. README.md

Este arquivo é o README principal do projeto. Ele documenta instalação, banco, seed, autenticação, execução local e deploy.

## 9. .env.example

Arquivo criado:

```txt
.env.example
```

Para rodar localmente:

```bash
cp .env.example .env.local
```

No Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Depois preencha:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_ou_anon_key
```

Observação: apesar do nome `ANON_KEY`, você pode usar a chave publishable atual do Supabase. Não coloque `service_role` no frontend nem na Vercel para este app.

## 10. Tutorial Completo de Deploy Gratuito

### 1. Criar conta no GitHub

1. Acesse [GitHub](https://github.com/).
2. Clique em `Sign up`.
3. Crie a conta e verifique seu e-mail.
4. Recomendo habilitar 2FA.

Referência: [Creating an account on GitHub](https://docs.github.com/en/get-started/start-your-journey/creating-an-account-on-github).

### 2. Criar repositório

1. No GitHub, clique em `+`.
2. Selecione `New repository`.
3. Nome sugerido: `treino-app`.
4. Escolha `Private` se quiser manter privado.
5. Não marque README, porque este projeto já tem um.
6. Clique em `Create repository`.

Referência: [Quickstart for repositories](https://docs.github.com/en/repositories/creating-and-managing-repositories/quickstart-for-repositories).

### 3. Subir o código

No terminal, dentro da pasta do projeto:

```bash
git init
git add .
git commit -m "Initial Treino App"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/treino-app.git
git push -u origin main
```

Se `git` não existir no Windows, instale o Git for Windows antes.

Referência: [Pushing commits to a remote repository](https://docs.github.com/get-started/using-git/pushing-commits-to-a-remote-repository).

### 4. Criar conta no Supabase

1. Acesse [Supabase](https://supabase.com/).
2. Crie uma conta gratuita.
3. Confirme seu e-mail.

### 5. Criar projeto no Supabase

1. Clique em `New project`.
2. Escolha uma organização.
3. Defina nome, senha forte do banco e região.
4. Aguarde o provisionamento.

### 6. Pegar URL e chaves

1. No projeto Supabase, abra `Project Settings`.
2. Vá em `API Keys` ou use o diálogo `Connect`.
3. Copie a `Project URL`.
4. Copie a chave `publishable` ou a chave legacy `anon`.

Referência: [Understanding API keys](https://supabase.com/docs/guides/api/api-keys).

### 7. Configurar autenticação

1. Vá em `Authentication`.
2. Em `Providers`, mantenha `Email` habilitado.
3. Em `URL Configuration`, defina temporariamente `Site URL` como `http://localhost:3000`.
4. Em `Redirect URLs`, adicione `http://localhost:3000/auth/confirm`.
5. Depois do deploy, adicione também `https://SEU-PROJETO.vercel.app/auth/confirm`.

Referências:

- [Password-based Auth](https://supabase.com/docs/guides/auth/passwords)
- [Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)

### 8. Executar SQL

1. Abra `SQL Editor` no Supabase.
2. Copie todo o conteúdo de `supabase/schema.sql`.
3. Cole no editor.
4. Clique em `Run`.
5. Confirme se as tabelas apareceram em `Table Editor`.

Referência: [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security).

### 9. Rodar seed

O seed roda automaticamente no primeiro acesso autenticado ao `/app`.

Fluxo normal:

1. Faça cadastro no site.
2. Confirme o e-mail.
3. Entre no painel.
4. Os treinos padrão serão criados para seu usuário.

Seed manual opcional:

1. Copie o `id` do usuário em `Authentication > Users`.
2. Abra `supabase/seed.sql`.
3. Troque o UUID placeholder pelo `id`.
4. Rode no SQL Editor.

### 10. Criar conta no Vercel

1. Acesse [Vercel](https://vercel.com/).
2. Crie uma conta.
3. Conecte com GitHub.

### 11. Importar projeto do GitHub

1. No Vercel Dashboard, clique em `New Project`.
2. Selecione o repositório `treino-app`.
3. Framework Preset deve ser detectado como `Next.js`.
4. Build command: `npm run build`.
5. Output directory: deixe padrão.

Referências:

- [Deploying Git Repositories with Vercel](https://vercel.com/docs/deployments/git)
- [Import an existing project](https://vercel.com/docs/getting-started-with-vercel/import)

### 12. Configurar variáveis de ambiente

Na tela de importação ou em `Project Settings > Environment Variables`, adicione:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_publishable_ou_anon_key
```

Marque os ambientes `Production`, `Preview` e `Development` se desejar.

Referência: [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables).

### 13. Fazer deploy

1. Clique em `Deploy`.
2. Aguarde a build.
3. Abra a URL gerada pela Vercel.
4. Volte ao Supabase e atualize:
   - `Site URL`: `https://SEU-PROJETO.vercel.app`
   - `Redirect URLs`: `https://SEU-PROJETO.vercel.app/auth/confirm`
5. Se alterou variáveis depois do deploy, faça `Redeploy`.

### 14. Testar no celular e em qualquer dispositivo

1. Abra a URL da Vercel no celular.
2. Crie uma conta.
3. Confirme o e-mail.
4. Faça login.
5. Verifique se os treinos seedados aparecem no dashboard.
6. Abra um treino, clique em `Executar treino`, conclua alguns exercícios e finalize.
7. Confira `/app/history` e `/app/progress`.

### 15. Atualizar futuramente

Sempre que alterar o projeto:

```bash
git add .
git commit -m "Descreva a alteração"
git push
```

A Vercel fará novo deploy automaticamente no push para a branch de produção.

## 11. Instruções Finais de Uso

1. Aplique `supabase/schema.sql` no Supabase.
2. Copie `.env.example` para `.env.local`.
3. Preencha URL e chave pública do Supabase.
4. Rode `npm run dev`.
5. Crie conta, confirme e-mail e acesse `/app`.
6. Os treinos iniciais aparecem automaticamente no primeiro acesso autenticado.
7. Use `Treinos` para editar protocolos.
8. Use `Executar treino` para registrar carga, reps e observações.
9. Use `Histórico` para revisar sessões.
10. Use `Evolução` para acompanhar frequência, cargas e calendário.

## Validação

Comandos executados com sucesso:

```bash
npm run lint
npm run build
```

## Referências Oficiais

- [Supabase SSR com Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Supabase Auth com senha](https://supabase.com/docs/guides/auth/passwords)
- [Supabase Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
- [Supabase API Keys](https://supabase.com/docs/guides/api/api-keys)
- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Vercel Git Deployments](https://vercel.com/docs/deployments/git)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [GitHub Repositories Quickstart](https://docs.github.com/en/repositories/creating-and-managing-repositories/quickstart-for-repositories)
