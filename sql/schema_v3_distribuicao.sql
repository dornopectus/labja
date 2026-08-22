-- ============================================================
-- Schema v3: turmas e grade de aulas (base para o motor de
-- distribuição automática semanal)
-- ============================================================

create table if not exists turmas (
    id uuid primary key default gen_random_uuid(),
    nome text not null,
    curso text not null,               -- ex.: "Ensino Médio", "Técnico em Desenvolvimento de Sistemas"
    quantidade_estudantes integer not null,
    turno text not null check (turno in ('manhã', 'tarde', 'noite')),
    bloco text not null,                -- ex.: "prédio novo", "prédio antigo"
    ano_serie text
);

-- Grade fixa de aulas da escola: qual turma tem qual matéria,
-- com qual professor, em qual horário da semana.
create table if not exists aulas (
    id uuid primary key default gen_random_uuid(),
    turma_id uuid not null references turmas(id) on delete cascade,
    professor_id uuid not null references professores(id) on delete cascade,
    disciplina text not null,
    horario_id uuid not null references horarios(id) on delete cascade,
    unique (turma_id, horario_id)
);

-- O agendamento passa a poder referenciar a turma cadastrada
-- (reservas automáticas sempre terão isso; reservas manuais
-- antigas continuam funcionando só com o campo turma em texto).
alter table agendamentos add column if not exists turma_id uuid references turmas(id);
alter table agendamentos add column if not exists automatico boolean not null default false;

-- Localização de bloco/prédio do laboratório (usado na pontuação
-- de "mesmo bloco" / "deslocamento entre blocos"). Só o Lab 4
-- tem isso definido no documento oficial.
alter table laboratorios add column if not exists localizacao_bloco text;
update laboratorios set localizacao_bloco = 'prédio novo' where nome ilike '%chromebook%';

