Use `supabase/schema.sql` como baseline para projetos novos.

Depois da primeira aplicacao, passe a registrar mudancas incrementais nesta pasta.

Ordem recomendada:

1. aplicar `schema.sql` em um projeto novo
2. para upgrades futuros, aplicar os arquivos desta pasta em ordem alfabetica/timestamp
3. manter `schema.sql` consolidado apenas como referencia completa do estado atual

Migracoes iniciais versionadas:

- `20260424093000_profile_and_assistant_memory.sql`
- `20260424120000_rpe_observability.sql`
