-- LabJá - normaliza a tabela de horários
-- Seguro para banco já migrado: não apaga horários, apenas remove a coluna
-- antiga `bloco` se ela ainda existir.

alter table public.horarios
drop column if exists bloco;
