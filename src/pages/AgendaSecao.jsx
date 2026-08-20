import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { getProfessorLogado } from '../lib/auth'

const DIAS = { 1: 'Segunda', 2: 'Terça', 3: 'Quarta', 4: 'Quinta', 5: 'Sexta', 6: 'Sábado', 7: 'Domingo' }

export default function AgendaSecao({
  titulo,
  tagClasse,
  tagTexto,
  laboratorios,
  horarios,
  periodoReferencia,
  laboratorioPrioritarioId,
  aoReservar,
}) {
  const professor = getProfessorLogado()
  const [laboratorioId, setLaboratorioId] = useState('')
  const [agendamentos, setAgendamentos] = useState([])

  useEffect(() => {
    if (laboratorios.length === 0) return
    // Coloca o laboratório prioritário do professor primeiro, se houver.
    const prioritario = laboratorios.find((l) => l.id === laboratorioPrioritarioId)
    setLaboratorioId(prioritario ? prioritario.id : laboratorios[0].id)
  }, [laboratorios, laboratorioPrioritarioId])

  useEffect(() => {
    if (!laboratorioId) return

    async function carregar() {
      const { data, error } = await supabase
        .from('agendamentos')
        .select('id, horario_id, turma, professor_id')
        .eq('laboratorio_id', laboratorioId)
        .eq('periodo_referencia', periodoReferencia)
        .eq('status', 'confirmado')

      if (!error) setAgendamentos(data || [])
    }

    carregar()
  }, [laboratorioId, periodoReferencia])

  async function reservar(horarioId) {
    const turma = window.prompt('Nome da turma para essa reserva:')
    if (!turma) return

    const { data, error } = await supabase
      .from('agendamentos')
      .insert({
        laboratorio_id: laboratorioId,
        professor_id: professor?.id,
        horario_id: horarioId,
        turma,
        periodo_referencia: periodoReferencia,
      })
      .select()
      .single()

    if (error) {
      window.alert('Não foi possível reservar: ' + error.message)
      return
    }

    setAgendamentos((atual) => [...atual, data])
    aoReservar?.()
  }

  async function cancelar(agendamentoId) {
    const confirmar = window.confirm('Cancelar essa reserva?')
    if (!confirmar) return

    const { error } = await supabase.from('agendamentos').delete().eq('id', agendamentoId)

    if (error) {
      window.alert('Não foi possível cancelar: ' + error.message)
      return
    }

    setAgendamentos((atual) => atual.filter((a) => a.id !== agendamentoId))
    aoReservar?.()
  }

  if (laboratorios.length === 0) return null

  const diasComHorario = [...new Set(horarios.map((h) => h.dia_semana))].sort()
  const blocos = [...new Set(horarios.map((h) => h.bloco))]
  const ehPrioritario = laboratorioId === laboratorioPrioritarioId

  return (
    <div className="agenda-secao">
      <h2 className="agenda-secao-titulo">
        {titulo}
        <span className={'agenda-secao-tag ' + tagClasse}>{tagTexto}</span>
      </h2>

      <div className="agenda-filtro">
        <select
          className="agenda-select"
          value={laboratorioId}
          onChange={(e) => setLaboratorioId(e.target.value)}
        >
          {laboratorios.map((lab) => (
            <option key={lab.id} value={lab.id}>
              {lab.id === laboratorioPrioritarioId ? '★ ' : ''}
              {lab.nome}
            </option>
          ))}
        </select>
        {ehPrioritario && (
          <span className="agenda-selo-prioridade">★ Prioritário para sua matéria</span>
        )}
        <span className="agenda-periodo">Período de referência: {periodoReferencia}</span>
      </div>

      <div className="agenda-tabela-wrap">
        <table className="agenda-tabela">
          <thead>
            <tr>
              <th>Horário</th>
              {diasComHorario.map((dia) => (
                <th key={dia}>{DIAS[dia]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {blocos.map((bloco) => (
              <tr key={bloco}>
                <td>{bloco}</td>
                {diasComHorario.map((dia) => {
                  const horario = horarios.find((h) => h.dia_semana === dia && h.bloco === bloco)
                  if (!horario) return <td key={dia}>—</td>

                  const agendamento = agendamentos.find((a) => a.horario_id === horario.id)
                  const ehMinha = agendamento && agendamento.professor_id === professor?.id

                  return (
                    <td key={dia}>
                      {agendamento ? (
                        ehMinha ? (
                          <span className="agenda-celula-minha">
                            {agendamento.turma}
                            <button
                              className="agenda-cancelar-btn"
                              onClick={() => cancelar(agendamento.id)}
                              title="Cancelar reserva"
                            >
                              ×
                            </button>
                          </span>
                        ) : (
                          <span className="agenda-celula-ocupada">{agendamento.turma}</span>
                        )
                      ) : (
                        <button className="agenda-celula-livre" onClick={() => reservar(horario.id)}>
                          Reservar
                        </button>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
