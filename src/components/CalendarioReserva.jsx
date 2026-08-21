import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { getProfessorLogado } from '../lib/auth'
import { periodoSemanalAtual, periodoQuinzenalAtual } from '../lib/periodos'
import {
  gerarDiasDoMes,
  diaSemanaSchema,
  ehFimDeSemana,
  mesmoDia,
  ehPassado,
  NOMES_MES,
} from '../lib/calendario'

const DIAS_SEMANA_HEADER = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export default function CalendarioReserva({
  laboratoriosSemanais,
  laboratoriosQuinzenais,
  horarios,
  laboratorioPrioritarioId,
  aoReservar,
}) {
  const professor = getProfessorLogado()
  const todosLabs = [...laboratoriosSemanais, ...laboratoriosQuinzenais]

  const hoje = new Date()
  const [mesAtual, setMesAtual] = useState(new Date(hoje.getFullYear(), hoje.getMonth(), 1))
  const [laboratorioId, setLaboratorioId] = useState('')
  const [diaSelecionado, setDiaSelecionado] = useState(null)
  const [agendamentosDoDia, setAgendamentosDoDia] = useState([])

  const diasDiaSemanaComHorario = new Set(horarios.map((h) => h.dia_semana))

  useEffect(() => {
    if (todosLabs.length === 0) return
    const prioritario = todosLabs.find((l) => l.id === laboratorioPrioritarioId)
    setLaboratorioId(prioritario ? prioritario.id : todosLabs[0].id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [laboratoriosSemanais.length, laboratoriosQuinzenais.length, laboratorioPrioritarioId])

  const labSelecionado = todosLabs.find((l) => l.id === laboratorioId)

  async function carregarDia(dia, labId) {
    if (!dia || !labId) {
      setAgendamentosDoDia([])
      return
    }

    const lab = todosLabs.find((l) => l.id === labId)
    const periodoReferencia =
      lab?.tipo_agendamento === 'semanal' ? periodoSemanalAtual(dia) : periodoQuinzenalAtual(dia)
    const diaSemana = diaSemanaSchema(dia)
    const horariosDoDia = horarios.filter((h) => h.dia_semana === diaSemana)

    if (horariosDoDia.length === 0) {
      setAgendamentosDoDia([])
      return
    }

    const { data } = await supabase
      .from('agendamentos')
      .select('id, horario_id, turma, professor_id')
      .eq('laboratorio_id', labId)
      .eq('periodo_referencia', periodoReferencia)
      .eq('status', 'confirmado')
      .in('horario_id', horariosDoDia.map((h) => h.id))

    setAgendamentosDoDia(data || [])
  }

  useEffect(() => {
    carregarDia(diaSelecionado, laboratorioId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diaSelecionado, laboratorioId])

  function selecionarDia(dia) {
    if (!dia) return
    if (ehFimDeSemana(dia)) return
    if (ehPassado(dia, hoje) && !mesmoDia(dia, hoje)) return
    if (!diasDiaSemanaComHorario.has(diaSemanaSchema(dia))) return
    setDiaSelecionado(dia)
  }

  function mudarMes(delta) {
    setDiaSelecionado(null)
    setMesAtual((atual) => new Date(atual.getFullYear(), atual.getMonth() + delta, 1))
  }

  async function reservar(horarioId) {
    const turma = window.prompt('Nome da turma para essa reserva:')
    if (!turma) return

    const lab = todosLabs.find((l) => l.id === laboratorioId)
    const periodoReferencia =
      lab?.tipo_agendamento === 'semanal'
        ? periodoSemanalAtual(diaSelecionado)
        : periodoQuinzenalAtual(diaSelecionado)

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

    setAgendamentosDoDia((atual) => [...atual, data])
    aoReservar?.()
  }

  async function cancelar(agendamentoId) {
    if (!window.confirm('Cancelar essa reserva?')) return

    const { error } = await supabase.from('agendamentos').delete().eq('id', agendamentoId)

    if (error) {
      window.alert('Não foi possível cancelar: ' + error.message)
      return
    }

    setAgendamentosDoDia((atual) => atual.filter((a) => a.id !== agendamentoId))
    aoReservar?.()
  }

  const dias = gerarDiasDoMes(mesAtual.getFullYear(), mesAtual.getMonth())
  const horariosDoDiaSelecionado = diaSelecionado
    ? horarios
        .filter((h) => h.dia_semana === diaSemanaSchema(diaSelecionado))
        .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
    : []

  if (todosLabs.length === 0) return null

  return (
    <div className="agenda-secao">
      <div className="agenda-filtro">
        <select
          className="agenda-select"
          value={laboratorioId}
          onChange={(e) => setLaboratorioId(e.target.value)}
        >
          <optgroup label="Semanais">
            {laboratoriosSemanais.map((lab) => (
              <option key={lab.id} value={lab.id}>
                {lab.id === laboratorioPrioritarioId ? '★ ' : ''}
                {lab.nome}
              </option>
            ))}
          </optgroup>
          {laboratoriosQuinzenais.length > 0 && (
            <optgroup label="Quinzenal">
              {laboratoriosQuinzenais.map((lab) => (
                <option key={lab.id} value={lab.id}>
                  {lab.id === laboratorioPrioritarioId ? '★ ' : ''}
                  {lab.nome}
                </option>
              ))}
            </optgroup>
          )}
        </select>
        {laboratorioId === laboratorioPrioritarioId && (
          <span className="agenda-selo-prioridade">★ Prioritário para sua matéria</span>
        )}
      </div>

      <div className="cal-topo">
        <div className="cal-navegacao">
          <button className="cal-nav-btn" onClick={() => mudarMes(-1)}>
            ‹
          </button>
          <span className="cal-mes-nome">
            {NOMES_MES[mesAtual.getMonth()]} {mesAtual.getFullYear()}
          </span>
          <button className="cal-nav-btn" onClick={() => mudarMes(1)}>
            ›
          </button>
        </div>
      </div>

      <div className="cal-grid">
        {DIAS_SEMANA_HEADER.map((d) => (
          <div key={d} className="cal-dia-semana-header">
            {d}
          </div>
        ))}

        {dias.map((dia, i) => {
          if (!dia) return <div key={i} className="cal-dia cal-dia-vazio" />

          const fimDeSemana = ehFimDeSemana(dia)
          const passado = ehPassado(dia, hoje) && !mesmoDia(dia, hoje)
          const semHorarioNesseDia = !diasDiaSemanaComHorario.has(diaSemanaSchema(dia))
          const desabilitado = fimDeSemana || passado || semHorarioNesseDia
          const ehHoje = mesmoDia(dia, hoje)
          const ehSelecionado = diaSelecionado && mesmoDia(dia, diaSelecionado)

          return (
            <button
              key={i}
              className={
                'cal-dia' +
                (fimDeSemana ? ' cal-dia-fim-semana' : desabilitado ? ' cal-dia-desabilitado' : '') +
                (ehHoje ? ' cal-dia-hoje' : '') +
                (ehSelecionado ? ' cal-dia-selecionado' : '')
              }
              onClick={() => selecionarDia(dia)}
              disabled={desabilitado}
            >
              {dia.getDate()}
            </button>
          )
        })}
      </div>

      {diaSelecionado && (
        <div className="cal-modal-overlay" onClick={() => setDiaSelecionado(null)}>
          <div className="cal-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cal-modal-topo">
              <h3 className="cal-painel-titulo">
                {labSelecionado?.nome} — {diaSelecionado.toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  day: '2-digit',
                  month: 'long',
                })}
              </h3>
              <button className="cal-modal-fechar" onClick={() => setDiaSelecionado(null)}>
                ×
              </button>
            </div>

            <div className="cal-horarios-lista">
              {horariosDoDiaSelecionado.map((horario) => {
                const agendamento = agendamentosDoDia.find((a) => a.horario_id === horario.id)
                const ehMinha = agendamento && agendamento.professor_id === professor?.id

                return (
                  <div key={horario.id} className="cal-horario-item">
                    <div>
                      <div className="cal-horario-bloco">{horario.bloco}</div>
                      <div className="cal-horario-hora">
                        {horario.hora_inicio?.slice(0, 5)} – {horario.hora_fim?.slice(0, 5)}
                      </div>
                    </div>

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
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
