-- Mostra a prioridade/bloqueio de matéria em cada laboratório,
-- pra conferir se bate com o documento oficial.
select
    l.nome as laboratorio,
    pl.materia,
    pl.ordem_prioridade,
    pl.bloqueada
from prioridades_laboratorio pl
join laboratorios l on l.id = pl.laboratorio_id
order by l.nome, pl.ordem_prioridade nulls last;
