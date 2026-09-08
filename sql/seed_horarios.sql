-- LabJá - horários padrão para o calendário
-- Segunda a sexta; não apaga nem duplica horários existentes.

begin;

insert into public.horarios (dia_semana, hora_inicio, hora_fim)
select v.dia_semana, v.hora_inicio::time, v.hora_fim::time
from (values
  (1,'06:50','07:30'),(1,'07:30','08:20'),(1,'08:20','09:15'),(1,'09:30','10:20'),(1,'10:20','11:10'),(1,'11:10','12:00'),
  (2,'06:50','07:30'),(2,'07:30','08:20'),(2,'08:20','09:15'),(2,'09:30','10:20'),(2,'10:20','11:10'),(2,'11:10','12:00'),
  (3,'06:50','07:30'),(3,'07:30','08:20'),(3,'08:20','09:15'),(3,'09:30','10:20'),(3,'10:20','11:10'),(3,'11:10','12:00'),
  (4,'06:50','07:30'),(4,'07:30','08:20'),(4,'08:20','09:15'),(4,'09:30','10:20'),(4,'10:20','11:10'),(4,'11:10','12:00'),
  (5,'06:50','07:30'),(5,'07:30','08:20'),(5,'08:20','09:15'),(5,'09:30','10:20'),(5,'10:20','11:10'),(5,'11:10','12:00')
) as v(dia_semana,hora_inicio,hora_fim)
where not exists (
  select 1 from public.horarios h
  where h.dia_semana=v.dia_semana
    and h.hora_inicio=v.hora_inicio::time
    and h.hora_fim=v.hora_fim::time
);

commit;

select id,dia_semana,hora_inicio,hora_fim
from public.horarios
order by dia_semana,hora_inicio;
