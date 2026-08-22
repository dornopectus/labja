-- ============================================================
-- Hora do servidor — usada pelo site pra calcular a semana/período
-- atual sem depender do relógio do dispositivo de cada pessoa.
-- ============================================================

create or replace function hora_atual_servidor()
returns timestamptz
language sql
stable
as $$
    select now();
$$;
