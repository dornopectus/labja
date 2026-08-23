insert into professor_turmas (professor_id, turma_id)
select p.id, 'c73c1b44-6967-420b-8e53-e8bad8ba7848'::uuid
from professores p
where p.login in ('matematica@escola.com', 'portugues@escola.com', 'ingles@escola.com')
on conflict (professor_id, turma_id) do nothing;
