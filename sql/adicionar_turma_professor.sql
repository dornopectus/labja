-- ============================================================
-- Adicionar turma(s) extras a um professor que JÁ existe
-- (não recria o professor, então não dá erro de login duplicado)
-- ============================================================

-- 1) Garante que a(s) turma(s) nova(s) existem
insert into turmas (nome)
values ('4º B')  -- <- troque/adicione as turmas novas aqui
on conflict (nome) do nothing;

-- 2) Vincula ao professor já existente (pelo login dele)
insert into professor_turmas (professor_id, turma_id)
select p.id, t.id
from professores p, turmas t
where p.login = 'backend@escola.com'  -- <- login do professor já existente
  and t.nome in ('4º B')              -- <- turma(s) novas a vincular
on conflict (professor_id, turma_id) do nothing;
