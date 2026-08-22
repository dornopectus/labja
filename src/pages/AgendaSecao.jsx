import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { getProfessorLogado } from '../lib/auth'

const NOMES_DIA = { 1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex' }

function formatarDataCurta(data) {
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

// A partir da data de início do período (string 'YYYY-MM-DD', sempre
// uma segunda-feira), calcula a data real de cada dia_semana (1=seg..5=sex).
function dataDoDiaSemana(periodoInicioISO, diaSemana) {
  const [ano, mes, dia] = periodoInicioISO.split('-').map(Number)
  const data = new Date(ano, mes - 1, dia)
  data.setDate(data.getDate() + (diaSemana - 1))
  return data
}

function adicionarDiasISO(iso, dias) {
  const [ano, mes, dia] = iso.split('-').map(Number)
  const data = new Date(ano, mes - 1, dia)
  data.setDate(data.getDate() + dias)
  return data.toISOString().slice(0, 10)
}

function ehPassado(data) {
  const hoje = new Date()
  const d = new Date(data.getFullYear(), data.getMonth(), data.getDate())
  const h = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
  return d < h
}

export default function AgendaSecao({
  titulo,
  tagClasse,
  tagTexto,
  laboratorios,
  horarios,
  periodoReferencia,
  laboratorioPrioritarioId,
  mostrarDatasReais,
  mostrarAbasSemana,
  colapsavel,
  abertaInicialmente = true,
  aoReservar,
}) {
  const professor = getProfessorLogado()
  const [laboratorioId, setLaboratorioId] = useState('')
  const [agendamentos, setAgendamentos] = useState([])
  const [abaAtiva, setAbaAtiva] = useState(0) // 0 = essa semana, 1 = semana que vem
  const [aberta, setAberta] = useState(abertaInicialmente)

  const periodoParaExibirDatas = mostrarAbasSemana
    ? adicionarDiasISO(periodoReferencia, abaAtiva * 7)
    : periodoReferencia

  useEffect(() => {
    if (laboratorios.length === 0) return
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
    if (!window.confirm('Cancelar essa reserva?')) return

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
      {colapsavel ? (
        <div className="agenda-colapsavel-topo" onClick={() => setAberta((a) => !a)}>
          <span className={'agenda-colapsavel-seta' + (aberta ? ' agenda-colapsavel-seta-aberta' : '')}>
            ▸
          </span>
          <h2 className="agenda-secao-titulo" style={{ marginBottom: 0 }}>
            {titulo}
            <span className={'agenda-secao-tag ' + tagClasse}>{tagTexto}</span>
          </h2>
        </div>
      ) : (
        <h2 className="agenda-secao-titulo">
          {titulo}
          <span className={'agenda-secao-tag ' + tagClasse}>{tagTexto}</span>
        </h2>
      )}

      {(!colapsavel || aberta) && (
        <>
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
        {!mostrarDatasReais && !mostrarAbasSemana && (
          <span className="agenda-periodo">Período de referência: {periodoReferencia}</span>
        )}
      </div>

      {mostrarAbasSemana && (
        <div className="agenda-abas-semana">
          <button
            className={'agenda-aba' + (abaAtiva === 0 ? ' agenda-aba-ativa' : '')}
            onClick={() => setAbaAtiva(0)}
          >
            Essa semana
          </button>
          <button
            className={'agenda-aba' + (abaAtiva === 1 ? ' agenda-aba-ativa' : '')}
            onClick={() => setAbaAtiva(1)}
          >
            Semana que vem
          </button>
        </div>
      )}

      <div className="agenda-tabela-wrap">
        <table className="agenda-tabela">
          <thead>
            <tr>
              <th>Horário</th>
              {diasComHorario.map((dia) => {
                const data =
                  mostrarDatasReais || mostrarAbasSemana
                    ? dataDoDiaSemana(periodoParaExibirDatas, dia)
                    : null
                return (
                  <th key={dia}>
                    {NOMES_DIA[dia]}
                    {data && <span style={{ fontWeight: 400 }}> {formatarDataCurta(data)}</span>}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {blocos.map((bloco) => (
              <tr key={bloco}>
                <td>{bloco}</td>
                {diasComHorario.map((dia) => {
                  const horario = horarios.find((h) => h.dia_semana === dia && h.bloco === bloco)
                  if (!horario) return <td key={dia}>—</td>

                  const dataColuna = mostrarDatasReais ? dataDoDiaSemana(periodoReferencia, dia) : null
                  const colunaPassada = dataColuna && ehPassado(dataColuna)

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
                      ) : colunaPassada ? (
                        <span style={{ color: 'var(--tinta-fraca)', fontSize: '0.78rem' }}>—</span>
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
        </>
      )}
    </div>
  )
}
