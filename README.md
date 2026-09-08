# LabJá

Sistema web de gestão e reserva dos laboratórios.

## Desenvolvimento

```bash
npm install
npm run dev
```

A aplicação usa Supabase e calcula as janelas de calendário pelo fuso `America/Sao_Paulo`.

## Administração

Administradores são contas separadas dos professores e entram em `/admin`. A criação de administradores permanece manual no banco; professores, turmas, disciplinas, laboratórios, horários, prioridades e reservas são administrados pela interface web.
