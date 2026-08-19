-- ============================================================
-- LabJá - Schema v2 (Supabase / PostgreSQL)
-- Sistema de Gestão dos Laboratórios Suplicy
-- ============================================================

-- 1) PROFESSORES
create table if not exists professores (
    id uuid primary key default gen_random_uuid(),
    nome text not null,
    login text not null unique,          -- formato: usuario@escola
    senha_hash text not null,            -- hash do CPF (nunca texto puro)
    materia text not null,
    curso_tecnico boolean not null default false,
    ativo boolean not null default true,
    criado_em timestamptz not null default now()
);

-- 2) PROFESSOR_DIAS_AULA
create table if not exists professor_dias_aula (
    id uuid primary key default gen_random_uuid(),
    professor_id uuid not null references professores(id) on delete cascade,
    dia_semana smallint not null check (dia_semana between 1 and 7), -- 1=segunda ... 7=domingo
    unique (professor_id, dia_semana)
);

-- 3) LABORATORIOS
create table if not exists laboratorios (
    id uuid primary key default gen_random_uuid(),
    nome text not null,                   -- Lab 1, Lab 2 (Notebooks), Lab 3, Lab 4 (Chromebooks), Lab 5 (Tablets)
    tipo_agendamento text not null check (tipo_agendamento in ('semanal', 'quinzenal')),
    capacidade integer not null,
    tipo_equipamento text not null,       -- desktop, notebook, chromebook, tablet
    exclusivo_curso_tecnico boolean not null default false,
    ativo boolean not null default true
);

-- 4) PRIORIDADES_LABORATORIO
-- Unifica prioridade e bloqueio por matéria em uma tabela só (schema v2)
create table if not exists prioridades_laboratorio (
    id uuid primary key default gen_random_uuid(),
    laboratorio_id uuid not null references laboratorios(id) on delete cascade,
    materia text not null,
    ordem_prioridade integer,             -- menor número = maior prioridade; null se não prioritária
    bloqueada boolean not null default false, -- ex.: Inglês bloqueado no Lab 4
    unique (laboratorio_id, materia)
);

-- 5) HORARIOS
create table if not exists horarios (
    id uuid primary key default gen_random_uuid(),
    dia_semana smallint not null check (dia_semana between 1 and 7),
    bloco text not null,                  -- ex.: "1º horário", "manhã-bloco2"
    hora_inicio time not null,
    hora_fim time not null
);

-- 6) AGENDAMENTOS
create table if not exists agendamentos (
    id uuid primary key default gen_random_uuid(),
    laboratorio_id uuid not null references laboratorios(id) on delete cascade,
    professor_id uuid not null references professores(id) on delete cascade,
    horario_id uuid not null references horarios(id) on delete cascade,
    turma text not null,
    periodo_referencia date not null,     -- data de início da semana/quinzena de reset
    status text not null default 'confirmado' check (status in ('confirmado', 'pendente', 'cancelado')),
    criado_em timestamptz not null default now(),
    unique (laboratorio_id, horario_id, periodo_referencia)
);

-- ============================================================
-- VIEW: laboratório prioritário por professor (via matéria)
-- ============================================================
create or replace view vw_prioridade_professor as
select
    p.id as professor_id,
    p.nome as professor_nome,
    p.materia,
    l.id as laboratorio_id,
    l.nome as laboratorio_nome,
    pl.ordem_prioridade,
    pl.bloqueada
from professores p
join prioridades_laboratorio pl on pl.materia = p.materia
join laboratorios l on l.id = pl.laboratorio_id
where pl.bloqueada = false
order by p.id, pl.ordem_prioridade nulls last;
