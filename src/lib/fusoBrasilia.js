const TIME_ZONE = 'America/Sao_Paulo'

function obterPartes(data) {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(data)

  return Object.fromEntries(partes.filter((p) => p.type !== 'literal').map((p) => [p.type, p.value]))
}

export function obterDataHoraBrasilia(data = new Date()) {
  const p = obterPartes(data)
  const diaSemana = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[p.weekday]

  return {
    ano: Number(p.year),
    mes: Number(p.month),
    dia: Number(p.day),
    diaSemana,
    hora: Number(p.hour),
    minuto: Number(p.minute),
  }
}

export const FUSO_BRASILIA = TIME_ZONE
