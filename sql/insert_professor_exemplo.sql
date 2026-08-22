-- ============================================================
-- Cadastro completo de um professor (turma + professor + vínculo)
-- num único comando. Troque os valores marcados abaixo.
-- ============================================================

with turma_ins as (
    -- 1) Garante que as turmas existem (não duplica se já existirem)
    insert into turmas (nome)
    values ('1º A'), ('2º B')  -- <- troque pelos nomes reais das turmas
    on conflict (nome) do nothing
),
professor_ins as (
    -- 2) Cadastra o professor com a senha já em hash (nunca em texto puro)
    insert into professores (nome, login, senha_hash, materia, curso_tecnico)
    values (
        'Nome do Professor',                                       -- <- nome real
        'usuario@escola',                                          -- <- login real
        extensions.crypt('12345678900', extensions.gen_salt('bf')),-- <- CPF real (só números)
        'Nome da Matéria',                                         -- <- matéria que leciona
        false                                                      -- <- true se for do curso técnico
    )
    returning id
)
-- 3) Vincula o professor recém-criado às turmas que ele leciona
insert into professor_turmas (professor_id, turma_id)
select p.id, t.id
from professor_ins p, turmas t
where t.nome in ('1º A', '2º B');  -- <- mesmos nomes de turma do passo 1
