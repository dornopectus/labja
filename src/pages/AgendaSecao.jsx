import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { getProfessorLogado } from '../lib/auth'
import { agoraSincronizado } from '../lib/horaServidor'
import { periodoSemanalAtual } from '../lib/periodos'
import { obterAberturaMateria, mensagemAberturaMateria } from '../lib/aberturaLaboratorios'

const NOMES_DIA = { 1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex' }

function formatarDataCurta(data) {
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}


function formatarHora(hora) {
  return hora ? hora.slice(0, 5) : ''
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
  const anoSaida = data.getFullYear()
  const mesSaida = String(data.getMonth() + 1).padStart(2, '0')
  const diaSaida = String(data.getDate()).padStart(2, '0')
  return `${anoSaida}-${mesSaida}-${diaSaida}`
}

function ehPassado(data) {
  const hoje = agoraSincronizado()
  const a = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(data)
  const b = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(hoje)
  return a < b
}

function dataISO(data) {
  if (!data) return null
  if (typeof data === 'string') return data.slice(0, 10)
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`
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
  semanaBaseExibicao,
  colapsavel,
  abertaInicialmente = true,
  turmasDoProfessor = [],
  diasDoProfessor = [],
  aoReservar,
}) {
  const professor = getProfessorLogado()
  const [laboratorioId, setLaboratorioId] = useState('')
  const [agendamentos, setAgendamentos] = useState([])

  // Uma reserva no quinzenal vale pro período inteiro (não é "só dessa
  // semana"), então as abas mostram intervalos de data reais em vez de
  // "essa semana"/"semana passada" — isso evitava dar a entender que uma
  // aba era só consulta quando na real dá pra reservar nela também.
  // Para o Lab 2/Desenvolvimento de Sistemas, a quinzena continua sendo
  // a referência de reserva, mas o calendário visual precisa acompanhar
  // a semana que está valendo agora (sexta 18h já aponta para a próxima).
  // Isso evita mostrar como "Essa Semana" os dias da semana que acabou.
  const semana0 = semanaBaseExibicao || periodoReferencia
  const semana1 = mostrarAbasSemana ? adicionarDiasISO(semana0, 7) : null
  const semanaAtualMonday = mostrarAbasSemana ? periodoSemanalAtual() : null
  const abaPadrao = mostrarAbasSemana && semanaAtualMonday === semana1 ? 1 : 0


  const [abaAtiva, setAbaAtiva] = useState(abaPadrao)
  const [aberta, setAberta] = useState(abertaInicialmente)
  const [horarioEmReserva, setHorarioEmReserva] = useState(null)
  const [dataAulaEmReserva, setDataAulaEmReserva] = useState(null)
  const [turmaEscolhida, setTurmaEscolhida] = useState('')
  const diasPermitidos = new Set((diasDoProfessor || []).map(Number).filter((dia) => dia >= 1 && dia <= 5))

  useEffect(() => {
    setAbaAtiva(abaPadrao)
  }, [abaPadrao])

  const periodoParaExibirDatas = mostrarAbasSemana
    ? adicionarDiasISO(semana0, abaAtiva * 7)
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
        .select('id, horario_id, turma_id, professor_id, data_aula, turmas(nome)')
        .eq('laboratorio_id', laboratorioId)
        .eq('periodo_referencia', periodoReferencia)
        .eq('status', 'confirmado')

      if (!error) setAgendamentos(data || [])
    }

    carregar()
  }, [laboratorioId, periodoReferencia])

  async function carregarPrioridadesLaboratorio() {
    const { data } = await supabase
      .from('vw_prioridade_professor')
      .select('materia, ordem_prioridade, bloqueada')
      .eq('laboratorio_id', laboratorioId)

    return data || []
  }

  async function abrirReserva(horarioId) {
    const horario = horarios.find((item) => item.id === horarioId)
    if (!horario) return

    if (!diasPermitidos.has(Number(horario.dia_semana))) {
      const nomeDia = NOMES_DIA[Number(horario.dia_semana)] || 'este dia'
      window.alert(`Você não pode reservar nesse dia, pois ${nomeDia.toLowerCase()} não está cadastrado como seu dia de aula.`)
      return
    }

    const laboratorio = laboratorios.find((lab) => lab.id === laboratorioId)

    if (laboratorio?.tipo_agendamento === 'semanal' && professor?.materia && laboratorioId) {
      const prioridadesAtuais = await carregarPrioridadesLaboratorio()
      const abertura = obterAberturaMateria({
        materia: professor.materia,
        prioridades: prioridadesAtuais,
        agora: agoraSincronizado(),
      })

      if (abertura && !abertura.liberada) {
        window.alert(mensagemAberturaMateria(professor.materia, abertura))
        return
      }
    }

    setTurmaEscolhida(turmasDoProfessor[0]?.id ?? '')
    setDataAulaEmReserva(dataDoDiaSemana(periodoParaExibirDatas, Number(horario.dia_semana)))
    setHorarioEmReserva(horarioId)
  }

  async function confirmarReserva() {
    if (!turmaEscolhida) return

    const horario = horarios.find((item) => item.id === horarioEmReserva)
    if (!horario || !diasPermitidos.has(Number(horario.dia_semana))) {
      window.alert('Você não pode reservar nesse dia, pois ele não está cadastrado como seu dia de aula.')
      setHorarioEmReserva(null)
      setDataAulaEmReserva(null)
      return
    }

    const laboratorio = laboratorios.find((lab) => lab.id === laboratorioId)

    if (laboratorio?.tipo_agendamento === 'semanal' && professor?.materia && laboratorioId) {
      const prioridadesAtuais = await carregarPrioridadesLaboratorio()
      const abertura = obterAberturaMateria({
        materia: professor.materia,
        prioridades: prioridadesAtuais,
        agora: agoraSincronizado(),
      })

      if (abertura && !abertura.liberada) {
        window.alert(mensagemAberturaMateria(professor.materia, abertura))
        setHorarioEmReserva(null)
        setDataAulaEmReserva(null)
        return
      }
    }

    // Regra obrigatória do documento: algumas matérias são proibidas
    // em determinados laboratórios (ex.: Inglês não pode no Lab 4).
    if (professor?.materia) {
      const { data: bloqueio } = await supabase
        .from('vw_prioridade_professor')
        .select('bloqueada')
        .eq('laboratorio_id', laboratorioId)
        .ilike('materia', professor.materia)
        .maybeSingle()

      if (bloqueio?.bloqueada) {
        const { data: alternativas } = await supabase
          .from('vw_prioridade_professor')
          .select('laboratorio_nome')
          .ilike('materia', professor.materia)
          .order('ordem_prioridade', { ascending: true })

        const nomesAlternativos = [...new Set((alternativas || []).map((a) => a.laboratorio_nome))]
        const sugestao =
          nomesAlternativos.length > 0
            ? `Laboratórios disponíveis para ${professor.materia}: ${nomesAlternativos.join(', ')}.`
            : ''

        window.alert(
          `A disciplina "${professor.materia}" não pode ser reservada neste laboratório.\n${sugestao}`
        )
        return
      }
    }

    if (!dataAulaEmReserva) {
      window.alert('Não foi possível determinar a data da aula. Feche a janela e tente novamente.')
      setHorarioEmReserva(null)
      setDataAulaEmReserva(null)
      return
    }

    const { data, error } = await supabase
      .from('agendamentos')
      .insert({
        laboratorio_id: laboratorioId,
        professor_id: professor?.id,
        horario_id: horarioEmReserva,
        turma_id: turmaEscolhida,
        data_aula: dataAulaEmReserva,
        periodo_referencia: periodoReferencia,
      })
      .select('id, horario_id, turma_id, professor_id, data_aula, turmas(nome)')
      .single()

    if (error) {
      window.alert('Não foi possível reservar: ' + error.message)
      return
    }

    setAgendamentos((atual) => [...atual, data])
    setHorarioEmReserva(null)
    setDataAulaEmReserva(null)
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

  const diasComHorario = [1, 2, 3, 4, 5].filter((dia) => horarios.some((h) => Number(h.dia_semana) === dia))
  const faixasHorario = [...new Map(
    horarios.map((h) => [
      `${h.hora_inicio}-${h.hora_fim}`,
      { hora_inicio: h.hora_inicio, hora_fim: h.hora_fim },
    ])
  ).values()].sort((a, b) => String(a.hora_inicio).localeCompare(String(b.hora_inicio)))
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
            {laboratorios.length > 1 ? (
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
            ) : (
              <span className="agenda-lab-unico">
                {laboratorios[0]?.id === laboratorioPrioritarioId ? '★ ' : ''}
                {laboratorios[0]?.nome}
              </span>
            )}
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
                Essa Semana
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
                {faixasHorario.map((faixa) => {
                  return (
                    <tr key={`${faixa.hora_inicio}-${faixa.hora_fim}`}>
                      <td>
                        {formatarHora(faixa.hora_inicio)} – {formatarHora(faixa.hora_fim)}
                      </td>
                      {diasComHorario.map((dia) => {
                        const horario = horarios.find(
                          (h) => Number(h.dia_semana) === Number(dia) &&
                            String(h.hora_inicio) === String(faixa.hora_inicio) &&
                            String(h.hora_fim) === String(faixa.hora_fim)
                        )
                        if (!horario) return <td key={dia}>—</td>

                        const dataColuna =
                          mostrarDatasReais
                            ? dataDoDiaSemana(periodoReferencia, dia)
                            : mostrarAbasSemana
                            ? dataDoDiaSemana(periodoParaExibirDatas, dia)
                            : null
                        const colunaPassada = dataColuna && ehPassado(dataColuna)

                        const dataColunaISO = dataISO(dataColuna)
                        const agendamento = agendamentos.find((a) => {
                          if (a.horario_id !== horario.id) return false
                          if (!a.data_aula) return true
                          return dataISO(a.data_aula) === dataColunaISO
                        })
                        const ehMinha = agendamento && agendamento.professor_id === professor?.id
                        const diaPermitido = diasPermitidos.has(Number(horario.dia_semana))

                        return (
                          <td key={dia}>
                            {agendamento ? (
                              ehMinha ? (
                                <span className="agenda-celula-minha">
                                  {agendamento.turmas?.nome}
                                  <button
                                    className="agenda-cancelar-btn"
                                    onClick={() => cancelar(agendamento.id)}
                                    title="Cancelar reserva"
                                  >
                                    ×
                                  </button>
                                </span>
                              ) : (
                                <span className="agenda-celula-ocupada">{agendamento.turmas?.nome}</span>
                              )
                            ) : colunaPassada || !diaPermitido ? (
                              <span style={{ color: 'var(--tinta-fraca)', fontSize: '0.78rem' }}>—</span>
                            ) : (
                              <button className="agenda-celula-livre" onClick={() => abrirReserva(horario.id)}>
                                Reservar
                              </button>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {horarioEmReserva && (
        <div className="agenda-reserva-overlay" onClick={() => { setHorarioEmReserva(null); setDataAulaEmReserva(null) }}>
          <div className="agenda-reserva-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="agenda-reserva-titulo">Reservar horário</h3>

            {turmasDoProfessor.length === 0 ? (
              <p className="agenda-reserva-aviso">
                Nenhuma turma vinculada ao seu cadastro ainda. Peça ao coordenador para vincular
                suas turmas no Supabase.
              </p>
            ) : (
              <>
                <label className="agenda-reserva-label" htmlFor="turma-reserva">
                  Turma
                </label>
                <select
                  id="turma-reserva"
                  className="agenda-select"
                  value={turmaEscolhida}
                  onChange={(e) => setTurmaEscolhida(e.target.value)}
                >
                  {turmasDoProfessor.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nome}
                    </option>
                  ))}
                </select>
              </>
            )}

            <div className="agenda-reserva-acoes">
              <button className="agenda-reserva-cancelar" onClick={() => { setHorarioEmReserva(null); setDataAulaEmReserva(null) }}>
                Voltar
              </button>
              <button
                className="agenda-reserva-confirmar"
                onClick={confirmarReserva}
                disabled={turmasDoProfessor.length === 0}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
