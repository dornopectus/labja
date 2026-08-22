import { agoraSincronizado } from './horaServidor'

// Referência para o cálculo das janelas quinzenais (Lab 2).
// Ajustar se o coordenador definir uma data de início oficial diferente.
const EPOCA_QUINZENAL = new Date(2026, 0, 5) // 5 de janeiro de 2026 (segunda-feira)

// Monta a string 'YYYY-MM-DD' a partir dos componentes LOCAIS da data,
// sem passar por toISOString() (que converte para UTC e pode empurrar
// a data em 1 dia dependendo do fuso horário/horário do dia).
function paraISO(data) {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

/**
 * Semana de referência dos laboratórios semanais.
 * Reset toda sexta-feira às 18:00: a partir desse horário (e no
 * sábado/domingo), já conta como a semana seguinte.
 */
export function periodoSemanalAtual(agora = agoraSincronizado()) {
  const diaSemana = agora.getDay() // 0=domingo ... 5=sexta ... 6=sábado
  const horaAtual = agora.getHours()
  const jaResetou = diaSemana === 0 || diaSemana === 6 || (diaSemana === 5 && horaAtual >= 18)

  const diasDesdeSegunda = (diaSemana + 6) % 7 // segunda=0 ... domingo=6

  const segunda = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate())
  segunda.setDate(segunda.getDate() - diasDesdeSegunda + (jaResetou ? 7 : 0))

  return paraISO(segunda)
}

/**
 * Janela quinzenal de referência (Lab 2), calculada a partir de
 * uma época fixa, em blocos de 14 dias (2 semanas cheias).
 * Usamos 14 em vez de 15 pra sempre alinhar numa segunda-feira —
 * 15 não é múltiplo de 7, então o início do período "escorregaria"
 * pros outros dias da semana a cada ciclo.
 */
export function periodoQuinzenalAtual(agora = agoraSincronizado()) {
  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate())
  const diffDias = Math.round((hoje - EPOCA_QUINZENAL) / (1000 * 60 * 60 * 24))
  const blocos = Math.floor(diffDias / 14)

  const inicioJanela = new Date(EPOCA_QUINZENAL)
  inicioJanela.setDate(inicioJanela.getDate() + blocos * 14)

  return paraISO(inicioJanela)
}
