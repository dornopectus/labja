-- LabJá: conflitos de reserva pela DATA REAL da aula.
-- Execute depois de garantir que public.agendamentos.data_aula existe.

begin;

drop index if exists public.agendamentos_lab_horario_periodo_idx;
drop index if exists public.agendamentos_professor_horario_periodo_idx;
drop index if exists public.agendamentos_turma_horario_periodo_idx;
drop index if exists public.agendamento_turma_horario_data_idx;
drop index if exists public.agendamentos_turma_horario_data_idx;

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
