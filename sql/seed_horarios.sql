-- ============================================================
-- Horários de exemplo: 5 aulas por dia, segunda a sexta (turno manhã)
-- Ajustar depois conforme a grade real da escola.
-- ============================================================

insert into horarios (dia_semana, bloco, hora_inicio, hora_fim)
select dia, bloco, hora_inicio, hora_fim
from (values
    (1, '1º horário', '07:30', '08:20'),
    (1, '2º horário', '08:20', '09:10'),
    (1, '3º horário', '09:10', '10:00'),
    (1, '4º horário', '10:20', '11:10'),
    (1, '5º horário', '11:10', '12:00'),
    (2, '1º horário', '07:30', '08:20'),
    (2, '2º horário', '08:20', '09:10'),
    (2, '3º horário', '09:10', '10:00'),
    (2, '4º horário', '10:20', '11:10'),
    (2, '5º horário', '11:10', '12:00'),
    (3, '1º horário', '07:30', '08:20'),
    (3, '2º horário', '08:20', '09:10'),
    (3, '3º horário', '09:10', '10:00'),
    (3, '4º horário', '10:20', '11:10'),
    (3, '5º horário', '11:10', '12:00'),
    (4, '1º horário', '07:30', '08:20'),
    (4, '2º horário', '08:20', '09:10'),
    (4, '3º horário', '09:10', '10:00'),
    (4, '4º horário', '10:20', '11:10'),
    (4, '5º horário', '11:10', '12:00'),
    (5, '1º horário', '07:30', '08:20'),
    (5, '2º horário', '08:20', '09:10'),
    (5, '3º horário', '09:10', '10:00'),
    (5, '4º horário', '10:20', '11:10'),
    (5, '5º horário', '11:10', '12:00')
) as t(dia, bloco, hora_inicio, hora_fim);
