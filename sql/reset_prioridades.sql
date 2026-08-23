-- ============================================================
-- Reset das prioridades por laboratório — garante que bate
-- exatamente com o documento oficial.
-- ============================================================

delete from prioridades_laboratorio;

-- Lab 1: Português > Leitura e Redação > Inglês
insert into prioridades_laboratorio (laboratorio_id, materia, ordem_prioridade, bloqueada)
select id, 'Português', 1, false from laboratorios where nome = 'Lab 1'
union all
select id, 'Leitura e Redação', 2, false from laboratorios where nome = 'Lab 1'
union all
select id, 'Inglês', 3, false from laboratorios where nome = 'Lab 1';

-- Lab 2: Desenvolvimento de Sistemas > Outros Cursos Técnicos > Projetos Interdisciplinares
insert into prioridades_laboratorio (laboratorio_id, materia, ordem_prioridade, bloqueada)
select id, 'Desenvolvimento de Sistemas', 1, false from laboratorios where nome = 'Lab 2 - Notebooks'
union all
select id, 'Outros Cursos Técnicos', 2, false from laboratorios where nome = 'Lab 2 - Notebooks'
union all
select id, 'Projetos Interdisciplinares', 3, false from laboratorios where nome = 'Lab 2 - Notebooks';

-- Lab 3: Matemática > Inglês > Português > Leitura e Redação
insert into prioridades_laboratorio (laboratorio_id, materia, ordem_prioridade, bloqueada)
select id, 'Matemática', 1, false from laboratorios where nome = 'Lab 3'
union all
select id, 'Inglês', 2, false from laboratorios where nome = 'Lab 3'
union all
select id, 'Português', 3, false from laboratorios where nome = 'Lab 3'
union all
select id, 'Leitura e Redação', 4, false from laboratorios where nome = 'Lab 3';

-- Lab 4: Programação > Pensamento Computacional (Inglês PROIBIDO)
insert into prioridades_laboratorio (laboratorio_id, materia, ordem_prioridade, bloqueada)
select id, 'Programação', 1, false from laboratorios where nome = 'Lab 4 - Chromebooks'
union all
select id, 'Pensamento Computacional', 2, false from laboratorios where nome = 'Lab 4 - Chromebooks'
union all
select id, 'Inglês', null, true from laboratorios where nome = 'Lab 4 - Chromebooks';

-- Lab 5: sem prioridade por matéria (recurso móvel) — nenhuma linha necessária

-- Conferência final
select l.nome as laboratorio, pl.materia, pl.ordem_prioridade, pl.bloqueada
from prioridades_laboratorio pl
join laboratorios l on l.id = pl.laboratorio_id
order by l.nome, pl.ordem_prioridade nulls last;
