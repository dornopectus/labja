-- Apaga tudo para recriar do zero com o schema atualizado
drop view if exists vw_prioridade_professor;
drop table if exists agendamentos cascade;
drop table if exists horarios cascade;
drop table if exists prioridades_laboratorio cascade;
drop table if exists laboratorios cascade;
drop table if exists professor_dias_aula cascade;
drop table if exists professores cascade;
