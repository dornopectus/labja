-- ============================================================
-- Coluna booleana pra identificar professor de Desenvolvimento
-- de Sistemas, em vez de comparar texto livre no campo matéria
-- (que já vimos ser frágil - problema de maiúscula/acento/espaço).
-- ============================================================

alter table professores
    add column if not exists eh_desenvolvimento_sistemas boolean not null default false;

-- Atualiza a função de login pra também devolver essa informação
create or replace function verificar_login(p_login text, p_senha text)
returns table (
    id uuid,
    nome text,
    materia text,
    curso_tecnico boolean,
    eh_desenvolvimento_sistemas boolean
)
language sql
security definer
set search_path = public, extensions
as $$
    select p.id, p.nome, p.materia, p.curso_tecnico, p.eh_desenvolvimento_sistemas
    from professores p
    where p.login = p_login
      and p.ativo = true
      and p.senha_hash = extensions.crypt(p_senha, p.senha_hash)
$$;

-- Exemplo: marcar um professor já existente como DS
-- update professores set eh_desenvolvimento_sistemas = true where login = 'seu-login@escola.com';
