// Converte o getDay() do JS (0=domingo...6=sábado) para o padrão
// usado no banco (1=segunda...7=domingo).
export function diaSemanaSchema(data) {
  const d = data.getDay()
  return d === 0 ? 7 : d
}

export function ehFimDeSemana(data) {
  const d = data.getDay()
  return d === 0 || d === 6
}

export function mesmoDia(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function ehPassado(data, hoje = new Date()) {
  const d = new Date(data.getFullYear(), data.getMonth(), data.getDate())
  const h = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
  return d < h
}

/**
 * Gera a grade de dias de um mês para exibição em calendário,
 * com a semana começando no domingo.
 */
export function gerarDiasDoMes(ano, mes) {
  const primeiroDia = new Date(ano, mes, 1)
  const ultimoDia = new Date(ano, mes + 1, 0)
  const dias = []

  const deslocamentoInicial = primeiroDia.getDay() // 0=domingo já é o início
  for (let i = 0; i < deslocamentoInicial; i++) dias.push(null)

  for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
    dias.push(new Date(ano, mes, dia))
  }

  return dias
}

export const NOMES_MES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]
