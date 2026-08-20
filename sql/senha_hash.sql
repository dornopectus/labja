-- ============================================================
-- Autenticação com senha em hash (bcrypt via pgcrypto)
-- ============================================================

create extension if not exists pgcrypto with schema extensions;

-- Função que confere login + senha (CPF) comparando o hash.
-- SECURITY DEFINER para poder ler a tabela mesmo com RLS restrito no futuro.
create or replace function verificar_login(p_login text, p_senha text)
returns table (
    id uuid,
    nome text,
    materia text,
    curso_tecnico boolean
)
language sql
security definer
set search_path = public, extensions
as $$
    select p.id, p.nome, p.materia, p.curso_tecnico
    from professores p
    where p.login = p_login
      and p.ativo = true
      and p.senha_hash = extensions.crypt(p_senha, p.senha_hash)
$$;

-- Migra as senhas de teste já cadastradas em texto puro para hash.
-- Mantém a mesma senha "123456" para continuar testando.
update professores
set senha_hash = extensions.crypt('123456', extensions.gen_salt('bf'))
where senha_hash = '123456';
