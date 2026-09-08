-- LabJá - horários padrão para o calendário
-- 6 horários por dia, segunda a sexta, turno da manhã.
-- Não apaga nenhum horário existente; só insere linhas se ainda não existirem.

begin;

insert into public.horarios (dia_semana, bloco, hora_inicio, hora_fim)
select v.dia_semana, v.bloco, v.hora_inicio::time, v.hora_fim::time
from (values
  (1, '1º horário', '06:50', '07:30'),
  (1, '2º horário', '07:30', '08:20'),
  (1, '3º horário', '08:20', '09:15'),
  (1, '4º horário', '09:30', '10:20'),
  (1, '5º horário', '10:20', '11:10'),
  (1, '6º horário', '11:10', '12:00'),
  (2, '1º horário', '06:50', '07:30'),
  (2, '2º horário', '07:30', '08:20'),
  (2, '3º horário', '08:20', '09:15'),
  (2, '4º horário', '09:30', '10:20'),
  (2, '5º horário', '10:20', '11:10'),
  (2, '6º horário', '11:10', '12:00'),
  (3, '1º horário', '06:50', '07:30'),
  (3, '2º horário', '07:30', '08:20'),
  (3, '3º horário', '08:20', '09:15'),
  (3, '4º horário', '09:30', '10:20'),
  (3, '5º horário', '10:20', '11:10'),
  (3, '6º horário', '11:10', '12:00'),
  (4, '1º horário', '06:50', '07:30'),
  (4, '2º horário', '07:30', '08:20'),
  (4, '3º horário', '08:20', '09:15'),
  (4, '4º horário', '09:30', '10:20'),
  (4, '5º horário', '10:20', '11:10'),
  (4, '6º horário', '11:10', '12:00'),
  (5, '1º horário', '06:50', '07:30'),
  (5, '2º horário', '07:30', '08:20'),
  (5, '3º horário', '08:20', '09:15'),
  (5, '4º horário', '09:30', '10:20'),
  (5, '5º horário', '10:20', '11:10'),
  (5, '6º horário', '11:10', '12:00')
) as v(dia_semana, bloco, hora_inicio, hora_fim)
where not exists (
  select 1 from public.horarios h
  where h.dia_semana = v.dia_semana
    and h.bloco = v.bloco
    and h.hora_inicio = v.hora_inicio::time
    and h.hora_fim = v.hora_fim::time
);

commit;

select id, dia_semana, bloco, hora_inicio, hora_fim
from public.horarios
order by dia_semana, hora_inicio;
