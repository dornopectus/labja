# LabJá

Sistema web de gestão e reserva dos laboratórios do Colégio Suplicy.

## Desenvolvimento

```bash
npm install
npm run dev
```

Crie `.env` a partir de `.env.example`.

## Banco

O schema limpo está em `supabase/schema_limpo.sql`.
Ele recria a estrutura atual e adiciona a tabela `administradores` para definir quais professores têm acesso à central administrativa.

## Rotas

- `/` — login
- `/home` — agenda do professor
- `/admin` — central administrativa (somente administradores)
