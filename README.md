# Fortynex

Fortynex e uma plataforma web privada para treino, evolucao, gamificacao e batalhas entre competidores. O projeto foi construido com Next.js App Router, TypeScript, Tailwind CSS, Supabase Auth, PostgreSQL com RLS, React Hook Form, Zod, Lucide React e Recharts.

O app foi pensado para um uso real em producao:

- login privado com Supabase Auth
- selecao do esporte do dia antes do dashboard
- suporte inicial para musculacao, pilates e crossfit
- assistente inteligente de treino com contexto do usuario
- execucao de treino com videos embutidos
- cronometro de descanso e RPE por exercicio
- historico, evolucao, pontos, nivel, streak e badges
- batalhas 1x1 com placar em tempo real
- PWA instalavel com suporte mobile real
- exportacao de backup em JSON e CSV
- observabilidade basica de erros do cliente
- migracoes versionadas para evolucao do banco
- layout responsivo e pronto para deploy gratuito na Vercel

## 1. Arquitetura Escolhida

### Visao geral

O projeto foi organizado em quatro camadas principais:

1. `App Router`
   Rotas publicas, autenticadas, layouts, loading states e Server Components.
2. `Features`
   Cada dominio fica em `src/features`, com `queries`, `actions`, `schemas` e `service`.
3. `UI componentizada`
   Componentes reutilizaveis em `src/components`, com foco em cards, navegação, paines e formularios.
4. `Supabase + PostgreSQL`
   Banco relacional, auth, funcoes SQL, seed, RLS e policies por usuario.
5. `Assistant layer`
   Um modulo proprio para montar contexto do usuario, responder com fallback local e integrar opcionalmente a OpenAI Responses API.

### Fluxo de autenticacao

1. O usuario cria conta em `/signup`.
2. O Supabase Auth gerencia email e senha.
3. O callback de confirmacao cai em `/auth/confirm`.
4. O layout privado exige sessao.
5. O trigger `handle_new_user()` cria `profiles` e `user_points`.
6. O primeiro acesso chama `ensureUserSeeded()` e cria os dados base do usuario.

### Fluxo do esporte do dia

1. Usuario autenticado entra em `/app`.
2. Se ainda nao escolheu o esporte do dia, o app mostra a tela `Qual esporte voce vai praticar hoje?`.
3. A escolha grava um registro em `user_sport_sessions`.
4. A modalidade selecionada passa a filtrar treinos, execucoes, dashboard e pontuacao.

### Fluxo de treino

1. O usuario escolhe a modalidade do dia.
2. O dashboard mostra somente treinos da modalidade selecionada.
3. Ao iniciar um treino, o app cria uma linha em `workout_executions`.
4. Ao salvar a sessao, os exercicios sao persistidos em `exercise_logs`.
5. Cada evento relevante gera pontos pela funcao `award_gamification_event`.
6. A pontuacao recalcula `user_points`, streak e badges.

### Fluxo de batalhas

1. O usuario cria uma batalha em `/app/battles/new`.
2. O app salva `battles` e `battle_participants`.
3. A funcao SQL `sync_battle_scores()` recalcula score, status e vencedor.
4. O app aplica pontos de `BATTLE_WIN` ou `BATTLE_DRAW` de forma idempotente.
5. Cada usuario so visualiza batalhas nas quais participa.

### Fluxo do assistente

1. O usuario acessa `/app/assistant`.
2. O app monta contexto com esporte do dia, treinos, execucoes, pontos e batalhas.
3. Se `OPENAI_API_KEY` estiver configurada, a rota `/api/assistant` usa a OpenAI Responses API.
4. Se a chave nao estiver configurada ou a API falhar, o app responde com um coach local heuristico.
5. Em ambos os casos, o assistente so enxerga dados do usuario autenticado.

## 2. Arvore de Pastas

```txt
.
|-- .env.example
|-- README.md
|-- eslint.config.mjs
|-- middleware.ts
|-- next.config.ts
|-- package.json
|-- postcss.config.mjs
|-- tsconfig.json
|-- public
|   |-- fortynex-logo.png
|   |-- manifest.webmanifest
|   |-- offline.html
|   `-- sw.js
|-- supabase
|   |-- migrations
|   |   |-- 20260424093000_profile_and_assistant_memory.sql
|   |   |-- 20260424120000_rpe_observability.sql
|   |   `-- README.md
|   |-- schema.sql
|   `-- seed.sql
`-- src
    |-- app
    |   |-- globals.css
    |   |-- layout.tsx
    |   |-- loading.tsx
    |   |-- page.tsx
    |   |-- api
    |   |   |-- assistant
    |   |   |   `-- route.ts
    |   |   |-- export
    |   |   |   `-- backup
    |   |   |       `-- route.ts
    |   |   |-- executions
    |   |   |   `-- [id]
    |   |   |       `-- copilot
    |   |   |           `-- route.ts
    |   |   `-- observability
    |   |       `-- route.ts
    |   |-- auth
    |   |   `-- confirm
    |   |       `-- route.ts
    |   |-- (auth)
    |   |   |-- layout.tsx
    |   |   |-- login
    |   |   |   `-- page.tsx
    |   |   |-- signup
    |   |   |   `-- page.tsx
    |   |   |-- forgot-password
    |   |   |   `-- page.tsx
    |   |   `-- reset-password
    |   |       `-- page.tsx
    |   `-- (app)
    |       `-- app
    |           |-- layout.tsx
    |           |-- page.tsx
    |           |-- assistant
    |           |   `-- page.tsx
    |           |-- select-sport
    |           |   `-- page.tsx
    |           |-- workouts
    |           |   |-- page.tsx
    |           |   |-- new
    |           |   |   `-- page.tsx
    |           |   `-- [id]
    |           |       |-- page.tsx
    |           |       `-- edit
    |           |           `-- page.tsx
    |           |-- executions
    |           |   `-- [id]
    |           |       `-- page.tsx
    |           |-- history
    |           |   |-- page.tsx
    |           |   `-- [id]
    |           |       `-- page.tsx
    |           |-- progress
    |           |   `-- page.tsx
    |           |-- ranking
    |           |   `-- page.tsx
    |           `-- battles
    |               |-- page.tsx
    |               |-- new
    |               |   `-- page.tsx
    |               `-- [id]
    |                   `-- page.tsx
    |-- components
    |   |-- assistant
    |   |-- app-shell.tsx
    |   |-- logout-button.tsx
    |   |-- mobile-nav.tsx
    |   |-- runtime
    |   |-- pwa
    |   |-- sidebar-nav.tsx
    |   |-- stat-card.tsx
    |   |-- workout-access-tracker.tsx
    |   |-- auth
    |   |-- battles
    |   |-- charts
    |   |-- gamification
    |   |-- progress
    |   |-- sports
    |   |-- ui
    |   |-- videos
    |   `-- workouts
    |-- features
    |   |-- assistant
    |   |-- onboarding
    |   |-- sports
    |   |-- workouts
    |   |-- gamification
    |   `-- battles
    `-- lib
        |-- auth.ts
        |-- constants.ts
        |-- format.ts
        |-- observability.ts
        |-- utils.ts
        |-- video.ts
        `-- supabase
            |-- client.ts
            |-- database.types.ts
            |-- middleware.ts
            `-- server.ts
```

## 3. Dependencias e Instalacao

### Principais dependencias

- `next`, `react`, `react-dom`
- `@supabase/ssr`, `@supabase/supabase-js`
- `react-hook-form`, `zod`, `@hookform/resolvers`
- `tailwindcss`, `@tailwindcss/postcss`
- `lucide-react`
- `recharts`

### Instalacao local

```bash
npm install
```

No PowerShell do Windows, se `npm run dev` falhar por causa de script policy, rode:

```powershell
cmd /c npm run dev
```

### Validacao

```bash
npm run lint
npm run build
```

## 4. Modelagem do Banco

### Tabelas principais

- `profiles`
  Perfil do usuario autenticado.
- `sports`
  Catalogo de modalidades suportadas pelo produto.
- `user_sport_sessions`
  Modalidade selecionada para o dia.
- `workouts`
  Treinos privados do usuario, vinculados a uma modalidade.
- `workout_sections`
  Blocos internos de um treino.
- `exercises`
  Exercicios ordenados dentro dos blocos.
- `workout_executions`
  Registro de uma sessao executada.
- `exercise_logs`
  Resultado detalhado de cada exercicio executado.
- `body_measurements`
  Historico corporal do usuario para perfil e evolucao.
- `gamification_events`
  Eventos que geram pontuacao.
- `user_points`
  Total de pontos, nivel e streak do usuario.
- `badges`
  Catalogo de conquistas.
- `user_badges`
  Badges conquistadas pelo usuario.
- `battles`
  Desafios entre dois competidores.
- `battle_participants`
  Participantes de cada batalha.
- `battle_scores`
  Score agregado da batalha por usuario.
- `assistant_conversations`
  Conversas persistidas do Fortynex Coach.
- `assistant_messages`
  Mensagens da memoria do assistente.
- `app_error_events`
  Eventos de erro enviados pelo cliente para observabilidade basica.

### Regras de negocio principais

- cada treino pertence a um unico usuario
- cada treino pertence a um esporte
- cada execucao herda o esporte do treino
- o usuario seleciona apenas um esporte por dia
- pontos sao gerados por eventos idempotentes
- badges sao concedidas automaticamente
- batalhas so podem ser vistas por participantes
- candidatos de batalha sao expostos por RPC controlada

## 5. SQL Completo do Supabase

O arquivo completo esta em:

```txt
supabase/schema.sql
```

Ele inclui:

- criacao e upgrade das tabelas
- chaves primarias e estrangeiras
- indices e constraints
- triggers de `updated_at`
- trigger `handle_new_user`
- RLS em todas as tabelas sensiveis
- policies completas
- funcoes SQL para:
  - `ensure_reference_badges()`
  - `award_gamification_event(...)`
  - `sync_user_badges(...)`
  - `sync_battle_scores(...)`
  - `list_battle_candidates()`
  - `seed_default_workouts_for_user(...)`
  - `seed_my_default_workouts()`

### Migracoes reais

Agora o projeto tambem possui migracoes incrementais em:

```txt
supabase/migrations
```

Uso recomendado:

1. projeto novo: aplicar `supabase/schema.sql`
2. projeto ja existente: aplicar apenas os arquivos novos de `supabase/migrations` em ordem
3. manter `schema.sql` como retrato completo do estado atual

## 6. Regras de Gamificacao

As regras centralizadas ficam em `src/features/gamification/config.ts`.

Pontuacoes atuais:

- `COMPLETE_WORKOUT = 100`
- `COMPLETE_EXERCISE = 10`
- `WEEKLY_STREAK_3 = 80`
- `WEEKLY_STREAK_5 = 150`
- `BATTLE_WIN = 120`
- `BATTLE_DRAW = 50`
- `ADD_NOTE = 5`
- `SPORT_SELECTION_COMPLETED = 10`

Badges iniciais:

- Primeiro treino concluido
- Semana perfeita
- Especialista em musculacao
- Especialista em pilates
- Especialista em crossfit
- Vencedor de batalha
- Sequencia de 7 dias
- 10 treinos concluidos
- 50 exercicios concluidos

## 7. Seed Inicial

### Esportes

O schema ja insere:

- musculacao
- pilates
- crossfit

### Treinos padrao

No primeiro acesso autenticado, o app executa:

```sql
select public.seed_my_default_workouts();
```

Isso gera treinos iniciais distribuidos entre as tres modalidades:

- musculacao
  - `Upper Push Premium`
  - `Lower Strength Builder`
  - `Pull and Arms`
- pilates
  - `Pilates Core e Controle`
  - `Pilates Mobilidade e Estabilidade`
- crossfit
  - `Crossfit Barbell Power`
  - `Crossfit Engine and Skill`

O helper manual continua disponivel em:

```txt
supabase/seed.sql
```

## 8. Arquivos Principais com Codigo

### Nucleo

- `src/lib/constants.ts`
  Nome do app, esportes, categorias, rotas e enums de batalha.
- `src/lib/video.ts`
  Converte URLs do YouTube para embed seguro.
- `src/lib/supabase/server.ts`
  Cliente Supabase SSR para server components e server actions.
- `src/lib/supabase/client.ts`
  Cliente para client components.

### Features

- `src/features/workouts/queries.ts`
  Dashboard, treinos, historico, progresso e contexto do esporte atual.
- `src/features/workouts/actions.ts`
  CRUD de treinos, inicio de execucao e persistencia de logs.
- `src/features/workouts/copilot.ts`
  Media de carga, sugestao de descanso, leitura de RPE e mensagens em tempo real.
- `src/features/sports/actions.ts`
  Grava o esporte do dia em `user_sport_sessions`.
- `src/features/gamification/service.ts`
  Regras de pontos, bonus semanais e sincronizacao com batalhas.
- `src/features/battles/actions.ts`
  Cria batalhas entre dois usuarios.
- `src/features/battles/service.ts`
  Recalcula score e vencedor usando `sync_battle_scores()`.
- `src/features/assistant/queries.ts`
  Monta o contexto do coach com dados do usuario autenticado.
- `src/features/assistant/service.ts`
  Gera a resposta do assistente com OpenAI ou fallback local.

### Componentes novos

- `src/components/assistant/assistant-panel.tsx`
  Interface de conversa com prompts iniciais e painel de contexto.
- `src/components/sports/sport-selector.tsx`
  Cards da etapa inicial "Qual esporte voce vai praticar hoje?".
- `src/components/videos/exercise-video-button.tsx`
  Modal com video embutido ou fallback para link externo.
- `src/components/workouts/execution-copilot-card.tsx`
  Painel com carga media, melhor carga, descanso sugerido e leitura de RPE.
- `src/components/gamification/points-panel.tsx`
  Painel com pontos, nivel, streak e meta.
- `src/components/gamification/badge-grid.tsx`
  Grade de badges desbloqueadas.
- `src/components/battles/battle-card.tsx`
  Card resumido de batalha.
- `src/components/battles/comparative-scoreboard.tsx`
  Barra comparativa entre os competidores.
- `src/components/battles/battle-form.tsx`
  Formulario para criar um desafio 1x1.
- `src/components/pwa/install-app-prompt.tsx`
  Prompt para instalar o app no celular ou desktop.
- `src/components/runtime/app-runtime-bridge.tsx`
  Registro do service worker e captura global de erros do navegador.

## 9. .env.example

Copie `.env.example` para `.env.local`:

```powershell
Copy-Item .env.example .env.local
```

Preencha:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_ou_anon_key
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5
```

Nao use `service_role` no frontend nem na Vercel.
`OPENAI_API_KEY` e opcional. Sem ela, o Fortynex Coach continua funcionando em modo local.

## 10. Como Rodar Localmente

1. Instale dependencias.
2. Crie `.env.local`.
3. No Supabase, abra `SQL Editor`.
4. Cole o conteudo de `supabase/schema.sql`.
5. Clique em `Run`.
6. Configure as URLs de auth:
   - `http://localhost:3000`
   - `http://localhost:3000/auth/confirm`
7. Rode o projeto:

```powershell
cmd /c npm run dev
```

8. Acesse [http://localhost:3000](http://localhost:3000)

Se quiser habilitar respostas de IA no coach:

1. Adicione `OPENAI_API_KEY` em `.env.local`.
2. Opcionalmente defina `OPENAI_MODEL`.
3. Reinicie o servidor de desenvolvimento.

## 11. Recursos Novos de Produto

### Cronometro de descanso + RPE

- ao abrir uma execucao em `/app/executions/[id]`, cada exercicio exibe referencias do seu historico
- o campo `RPE` aceita valores de `1` a `10`
- o copiloto sugere descanso com base no tipo de exercicio e no historico recente
- o cronometro pode ser iniciado pelo painel do copiloto sem travar a tela

### PWA e uso mobile

- o app expõe `manifest.webmanifest`
- o service worker fica em `public/sw.js`
- o fallback offline fica em `public/offline.html`
- o prompt de instalacao aparece quando o navegador suportar `beforeinstallprompt`

Importante:

- o PWA funciona melhor em ambiente HTTPS
- em producao, use a URL da Vercel para testar instalacao real no celular

### Observabilidade

- erros do cliente sao enviados para `/api/observability`
- os registros ficam na tabela `app_error_events`
- isso ajuda a rastrear problemas reais sem expor dados entre usuarios

### Exportacao e backup

Na tela de perfil, o usuario pode exportar:

- backup completo em JSON
- medidas corporais em CSV
- historico de treinos em CSV

Rotas usadas:

- `/api/export/backup?format=json&scope=all`
- `/api/export/backup?format=csv&scope=body`
- `/api/export/backup?format=csv&scope=history`

## 12. Deploy Gratuito com GitHub + Supabase + Vercel

### 1. GitHub

1. Crie conta em [GitHub](https://github.com/).
2. Crie um repositorio, por exemplo `fortynex`.
3. Suba o codigo:

```bash
git init
git add .
git commit -m "Fortynex inicial"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/fortynex.git
git push -u origin main
```

### 2. Supabase

1. Crie conta em [Supabase](https://supabase.com/).
2. Crie um projeto novo.
3. Copie:
   - `Project URL`
   - `publishable key` ou `anon key`
4. Em `Authentication > URL Configuration`, configure:
   - `Site URL`: `http://localhost:3000` durante o desenvolvimento
   - `Redirect URL`: `http://localhost:3000/auth/confirm`
5. Execute `supabase/schema.sql`.

### 3. Vercel

1. Crie conta em [Vercel](https://vercel.com/).
2. Importe o repositorio do GitHub.
3. Adicione as variaveis:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_publica
OPENAI_API_KEY=sua_chave_openai_opcional
OPENAI_MODEL=gpt-5
```

4. Clique em `Deploy`.
5. Depois do primeiro deploy, copie a URL gerada, por exemplo:

```txt
https://fortynex.vercel.app
```

6. Volte ao Supabase e atualize:
   - `Site URL`: `https://fortynex.vercel.app`
   - `Redirect URL`: `https://fortynex.vercel.app/auth/confirm`

7. Para PWA e service worker funcionarem corretamente:
   - use sempre a URL HTTPS publicada pela Vercel
   - abra o site no celular e escolha `Adicionar a tela inicial` quando o navegador sugerir
   - valide o arquivo `manifest.webmanifest` e o registro do `sw.js`

### 4. Atualizacoes futuras

Depois de qualquer ajuste:

```bash
git add .
git commit -m "Atualiza Fortynex"
git push
```

A Vercel fara novo deploy automaticamente.

## 13. Validacao Local

Comandos ja previstos no projeto:

```bash
npm run lint
npm run build
```

## 14. Referencias Oficiais

- [Supabase SSR com Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Supabase Auth com senha](https://supabase.com/docs/guides/auth/passwords)
- [Supabase Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [OpenAI Responses API](https://platform.openai.com/docs/api-reference/responses/create?api-mode=responses)
- [OpenAI Text generation guide](https://platform.openai.com/docs/guides/text?api-mode=responses)
- [Vercel Git Deployments](https://vercel.com/docs/deployments/git)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [GitHub Quickstart for repositories](https://docs.github.com/en/repositories/creating-and-managing-repositories/quickstart-for-repositories)
