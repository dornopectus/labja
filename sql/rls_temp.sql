-- ============================================================
-- RLS - fase de testes (políticas permissivas)
-- Depois de integrar autenticação de verdade, trocar estas
-- políticas por regras baseadas no usuário logado.
-- ============================================================

alter table professores enable row level security;
alter table professor_dias_aula enable row level security;
alter table laboratorios enable row level security;
alter table prioridades_laboratorio enable row level security;
alter table horarios enable row level security;
alter table agendamentos enable row level security;

-- Políticas temporárias: liberam leitura e escrita pra chave anon/publishable.
-- TODO: restringir por professor autenticado quando o login real estiver pronto.

create policy "temp_allow_all_professores" on professores
    for all using (true) with check (true);

create policy "temp_allow_all_professor_dias_aula" on professor_dias_aula
    for all using (true) with check (true);

create policy "temp_allow_all_laboratorios" on laboratorios
    for all using (true) with check (true);

create policy "temp_allow_all_prioridades_laboratorio" on prioridades_laboratorio
    for all using (true) with check (true);

create policy "temp_allow_all_horarios" on horarios
    for all using (true) with check (true);

create policy "temp_allow_all_agendamentos" on agendamentos
    for all using (true) with check (true);
