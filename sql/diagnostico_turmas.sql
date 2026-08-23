-- Mostra o vínculo real: qual professor está ligado a qual turma
select p.nome as professor, p.login, t.nome as turma
from professor_turmas pt
join professores p on p.id = pt.professor_id
join turmas t on t.id = pt.turma_id
order by p.nome, t.nome;
