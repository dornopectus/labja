-- ============================================================
-- Exemplo: cadastro de turmas e grade de aulas
-- Ajustar/repetir esse padrão com os dados reais da escola.
-- ============================================================

insert into turmas (nome, curso, quantidade_estudantes, turno, bloco, ano_serie)
values
    ('3º A', 'Ensino Médio', 32, 'manhã', 'prédio antigo', '3º ano'),
    ('3º C - DS', 'Técnico em Desenvolvimento de Sistemas', 28, 'manhã', 'prédio novo', '3º ano');

-- Cada linha abaixo representa uma aula fixa na grade: essa turma,
-- com esse professor, dessa matéria, nesse horário da semana.
-- dia_semana e bloco precisam bater com uma linha já existente em `horarios`.

insert into aulas (turma_id, professor_id, disciplina, horario_id)
select
    t.id,
    p.id,
    'Matemática',
    h.id
from turmas t, professores p, horarios h
where t.nome = '3º A'
  and p.login = 'teste@escola'
  and h.dia_semana = 1
  and h.bloco = '1º horário';
