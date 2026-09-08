-- LabJá - migração para guardar a data exata da aula/reserva
-- Necessária para o Laboratório 2 quinzenal distinguir a 1ª e a 2ª semana.

begin;

alter table public.agendamentos
  add column if not exists data_aula date;

update public.agendamentos a
set data_aula = a.periodo_referencia + (h.dia_semana - 1)
from public.horarios h
where h.id = a.horario_id
  and a.data_aula is null;

alter table public.agendamentos
  alter column data_aula set not null;

-- Remove índices antigos que não distinguem as duas semanas de uma quinzena.
drop index if exists public.agendamentos_laboratorio_horario_periodo_idx;
drop index if exists public.agendamentos_professor_horario_periodo_idx;
drop index if exists public.agendamentos_turma_horario_periodo_idx;

create unique index if not exists agendamentos_laboratorio_horario_data_idx
  on public.agendamentos (laboratorio_id, horario_id, data_aula)
  where status <> 'cancelado';

create unique index if not exists agendamentos_professor_horario_data_idx
  on public.agendamentos (professor_id, horario_id, data_aula)
  where status <> 'cancelado';

create unique index if not exists agendamentos_turma_horario_data_idx
  on public.agendamentos (turma_id, horario_id, data_aula)
  where status <> 'cancelado';

commit;
