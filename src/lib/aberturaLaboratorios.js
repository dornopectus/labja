import { obterDataHoraBrasilia } from './fusoBrasilia'

// Liberação progressiva dos laboratórios semanais:
// sexta 18h -> prioridade 1
// sábado 00h -> prioridades 1 e 2
// domingo 00h -> todas as prioridades + matérias não prioritárias
export function limitePrioridadeLiberada(agora = new Date()) {
  const { diaSemana, hora } = obterDataHoraBrasilia(agora)

  if (diaSemana === 5 && hora >= 18) return 1
  if (diaSemana === 6) return 2
  if (diaSemana === 0) return Infinity
  // Segunda a sexta antes das 18h: ainda pertence à janela aberta no domingo.
  return Infinity
}

export function obterAberturaMateria({ materia, prioridades = [], agora = new Date() }) {
  if (!materia || prioridades.length === 0) return null

  const registro = prioridades.find(
    (item) => item.materia?.trim().toLocaleLowerCase() === materia.trim().toLocaleLowerCase()
  )

  const ordem = registro?.ordem_prioridade ?? null
  const limiteAtual = limitePrioridadeLiberada(agora)

  // Matéria cadastrada como bloqueada continua bloqueada pela regra existente.
  if (registro?.bloqueada) return { liberada: false, motivo: 'bloqueada' }

  // Matéria sem prioridade só entra quando todas as prioridades do laboratório forem liberadas.
  if (ordem == null) {
    const liberada = limiteAtual === Infinity
    return { liberada, inicio: 'domingo' }
  }

  const liberada = ordem <= limiteAtual
  const inicio = ordem <= 1 ? 'sexta-feira às 18:00' : ordem === 2 ? 'sábado' : 'domingo'
  return { liberada, ordem, inicio }
}

export function mensagemAberturaMateria(materia, abertura) {
  if (!abertura || abertura.liberada) return ''
  if (abertura.motivo === 'bloqueada') {
    return `A disciplina "${materia}" não pode ser reservada neste laboratório.`
  }
  return `A disciplina "${materia}" só poderá reservar a partir de ${abertura.inicio}.`
}
