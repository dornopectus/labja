import { agoraSincronizado } from './horaServidor'
import { obterDataHoraBrasilia } from './fusoBrasilia'

// Referência para o cálculo das janelas quinzenais (Lab 2).
// Ajustar se o coordenador definir uma data de início oficial diferente.
const EPOCA_QUINZENAL = new Date(Date.UTC(2026, 0, 5)) // 5 de janeiro de 2026 (segunda-feira)

// Monta uma string 'YYYY-MM-DD' a partir de uma data UTC.
// Os cálculos usam UTC porque as datas aqui representam apenas calendário,
// evitando depender do fuso do dispositivo.
function paraISO(data) {
  const ano = data.getUTCFullYear()
  const mes = String(data.getUTCMonth() + 1).padStart(2, '0')
  const dia = String(data.getUTCDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

/**
 * Semana de referência dos laboratórios semanais.
 * Reset toda sexta-feira às 18:00: a partir desse horário (e no
 * sábado/domingo), já conta como a semana seguinte.
 */
export function periodoSemanalAtual(agora = agoraSincronizado()) {
  const brasilia = obterDataHoraBrasilia(agora)
  const diaSemana = brasilia.diaSemana // 0=domingo ... 5=sexta ... 6=sábado
  const horaAtual = brasilia.hora
  const jaResetou = diaSemana === 0 || diaSemana === 6 || (diaSemana === 5 && horaAtual >= 18)

  const diasDesdeSegunda = (diaSemana + 6) % 7 // segunda=0 ... domingo=6

  const segunda = new Date(Date.UTC(brasilia.ano, brasilia.mes - 1, brasilia.dia - diasDesdeSegunda + (jaResetou ? 7 : 0)))

  return paraISO(segunda)
}

/**
 * Janela quinzenal de referência (Lab 2), calculada a partir de
 * uma época fixa, em blocos de 14 dias (2 semanas cheias).
 * Usamos 14 em vez de 15 pra sempre alinhar numa segunda-feira —
 * 15 não é múltiplo de 7, então o início do período "escorregaria"
 * pros outros dias da semana a cada ciclo.
 *
 * Importante: calculamos a partir da segunda-feira da semana ATUAL
 * (já ajustada pelo reset de sexta 18h), não da data crua de "agora".
 * Isso evita um desalinhamento nos 3 dias finais de cada ciclo
 * (sexta 18h até domingo), onde a semana já teria resetado mas a
 * janela quinzenal ainda não.
 */
export function periodoQuinzenalAtual(agora = agoraSincronizado()) {
  const semanaAtualISO = periodoSemanalAtual(agora)
  const [ano, mes, dia] = semanaAtualISO.split('-').map(Number)
  const segundaAtual = new Date(Date.UTC(ano, mes - 1, dia))

  const diffDias = Math.round((segundaAtual - EPOCA_QUINZENAL) / (1000 * 60 * 60 * 24))
  const blocos = Math.floor(diffDias / 14)

  const inicioJanela = new Date(Date.UTC(2026, 0, 5 + blocos * 14))

  return paraISO(inicioJanela)
}
