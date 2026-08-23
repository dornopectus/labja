-- ============================================================
-- Diagnóstico: confere o que já foi aplicado no banco.
-- Roda esse SELECT e olha a coluna "ok" (true = já está feito).
-- ============================================================

select 'Tabela: professores' as item, to_regclass('public.professores') is not null as ok
union all
select 'Tabela: laboratorios', to_regclass('public.laboratorios') is not null
union all
select 'Tabela: horarios', to_regclass('public.horarios') is not null
union all
select 'Tabela: prioridades_laboratorio', to_regclass('public.prioridades_laboratorio') is not null
union all
select 'Tabela: agendamentos', to_regclass('public.agendamentos') is not null
union all
select 'View: vw_prioridade_professor', to_regclass('public.vw_prioridade_professor') is not null
union all
select 'RLS ativo (rls_temp.sql)', exists (
    select 1 from pg_class where relname = 'professores' and relrowsecurity = true
)
union all
select 'Extensão pgcrypto (senha_hash.sql)', exists (
    select 1 from pg_extension where extname = 'pgcrypto'
)
union all
select 'Função: verificar_login (senha_hash.sql)', to_regprocedure('public.verificar_login(text,text)') is not null
union all
select 'Tabela: turmas (turmas_professor.sql)', to_regclass('public.turmas') is not null
union all
select 'Tabela: professor_turmas (turmas_professor.sql)', to_regclass('public.professor_turmas') is not null
union all
select 'Função: hora_atual_servidor (hora_servidor.sql)', to_regprocedure('public.hora_atual_servidor()') is not null
order by 1;
