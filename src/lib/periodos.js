// Referência para o cálculo das janelas quinzenais (Lab 2).
// Ajustar se o coordenador definir uma data de início oficial diferente.
const EPOCA_QUINZENAL = new Date('2026-01-05T00:00:00')

function paraISO(data) {
  return data.toISOString().slice(0, 10)
}

/**
 * Semana de referência dos laboratórios semanais.
 * Reset toda sexta-feira às 18:00: a partir desse horário, já
 * conta como a semana seguinte.
 */
export function periodoSemanalAtual(agora = new Date()) {
  const d = new Date(agora)
  const diaSemana = d.getDay() // 0=domingo ... 5=sexta ... 6=sábado
  const horaAtual = d.getHours()

  const jaResetou = diaSemana > 5 || (diaSemana === 5 && horaAtual >= 18)

  // segunda-feira da semana "efetiva"
  let deslocamentoParaSegunda
  if (diaSemana === 0) {
    deslocamentoParaSegunda = jaResetou ? 1 : -6
  } else {
    deslocamentoParaSegunda = 1 - diaSemana
  }

  const segunda = new Date(d)
  segunda.setDate(d.getDate() + deslocamentoParaSegunda + (jaResetou && diaSemana !== 0 ? 7 : 0))
  segunda.setHours(0, 0, 0, 0)

  return paraISO(segunda)
}

/**
 * Janela quinzenal de referência (Lab 2), calculada a partir de
 * uma época fixa, em blocos de 15 dias.
 */
export function periodoQuinzenalAtual(agora = new Date()) {
  const diffDias = Math.floor((agora - EPOCA_QUINZENAL) / (1000 * 60 * 60 * 24))
  const blocos = Math.floor(diffDias / 15)
  const inicioJanela = new Date(EPOCA_QUINZENAL)
  inicioJanela.setDate(inicioJanela.getDate() + blocos * 15)
  return paraISO(inicioJanela)
}
