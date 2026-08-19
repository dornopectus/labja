-- ============================================================
-- Dados iniciais: 5 laboratórios + prioridades por matéria
-- ============================================================

insert into laboratorios (nome, tipo_agendamento, capacidade, tipo_equipamento, exclusivo_curso_tecnico) values
    ('Lab 1', 'semanal', 38, 'desktop', false),
    ('Lab 2 - Notebooks', 'quinzenal', 30, 'notebook', true),
    ('Lab 3', 'semanal', 34, 'desktop', false),
    ('Lab 4 - Chromebooks', 'semanal', 40, 'chromebook', false),
    ('Lab 5 - Tablets', 'semanal', 40, 'tablet', false);

-- Prioridades por laboratório (ordem_prioridade: menor número = maior prioridade)

-- Lab 1: Português, Leitura e Redação, Inglês
insert into prioridades_laboratorio (laboratorio_id, materia, ordem_prioridade, bloqueada)
select id, 'Português', 1, false from laboratorios where nome = 'Lab 1'
union all
select id, 'Leitura e Redação', 2, false from laboratorios where nome = 'Lab 1'
union all
select id, 'Inglês', 3, false from laboratorios where nome = 'Lab 1';

-- Lab 2: Desenvolvimento de Sistemas > outros cursos técnicos > interdisciplinares
insert into prioridades_laboratorio (laboratorio_id, materia, ordem_prioridade, bloqueada)
select id, 'Desenvolvimento de Sistemas', 1, false from laboratorios where nome = 'Lab 2 - Notebooks'
union all
select id, 'Outros Cursos Técnicos', 2, false from laboratorios where nome = 'Lab 2 - Notebooks'
union all
select id, 'Projetos Interdisciplinares', 3, false from laboratorios where nome = 'Lab 2 - Notebooks';

-- Lab 3: Matemática, Inglês, Português, Leitura e Redação
insert into prioridades_laboratorio (laboratorio_id, materia, ordem_prioridade, bloqueada)
select id, 'Matemática', 1, false from laboratorios where nome = 'Lab 3'
union all
select id, 'Inglês', 2, false from laboratorios where nome = 'Lab 3'
union all
select id, 'Português', 3, false from laboratorios where nome = 'Lab 3'
union all
select id, 'Leitura e Redação', 4, false from laboratorios where nome = 'Lab 3';

-- Lab 4: Programação, Pensamento Computacional (Inglês bloqueado)
insert into prioridades_laboratorio (laboratorio_id, materia, ordem_prioridade, bloqueada)
select id, 'Programação', 1, false from laboratorios where nome = 'Lab 4 - Chromebooks'
union all
select id, 'Pensamento Computacional', 2, false from laboratorios where nome = 'Lab 4 - Chromebooks'
union all
select id, 'Inglês', null, true from laboratorios where nome = 'Lab 4 - Chromebooks';

-- Lab 5: sem prioridade por disciplina (recurso móvel) - nenhuma linha necessária
