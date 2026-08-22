-- ============================================================
-- Turmas + vínculo professor-turmas
-- (Independente do schema_v3_distribuicao.sql / motor automático —
-- essa parte serve só pra alimentar o seletor de turma na reserva
-- manual do professor.)
-- ============================================================

create table if not exists turmas (
    id uuid primary key default gen_random_uuid(),
    nome text not null unique,
    curso text,
    quantidade_estudantes integer,
    turno text check (turno in ('manhã', 'tarde', 'noite')),
    bloco text,
    ano_serie text,
    ativo boolean not null default true
);

-- Quais turmas cada professor leciona (um professor pode ter várias).
create table if not exists professor_turmas (
    id uuid primary key default gen_random_uuid(),
    professor_id uuid not null references professores(id) on delete cascade,
    turma_id uuid not null references turmas(id) on delete cascade,
    unique (professor_id, turma_id)
);

alter table turmas enable row level security;
alter table professor_turmas enable row level security;

create policy "temp_allow_all_turmas" on turmas
    for all using (true) with check (true);

create policy "temp_allow_all_professor_turmas" on professor_turmas
    for all using (true) with check (true);
