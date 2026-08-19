import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabaseClient'
import { getProfessorLogado } from '../lib/auth'
import './Dashboard.css'
import './Agenda.css'

const DIAS = { 1: 'Segunda', 2: 'Terça', 3: 'Quarta', 4: 'Quinta', 5: 'Sexta', 6: 'Sábado', 7: 'Domingo' }

function segundaFeiraDaSemana(data = new Date()) {
  const d = new Date(data)
  const diaSemana = d.getDay() // 0 = domingo
  const deslocamento = diaSemana === 0 ? -6 : 1 - diaSemana
  d.setDate(d.getDate() + deslocamento)
  return d.toISOString().slice(0, 10)
}

export default function Agenda() {
  const professor = getProfessorLogado()
  const [laboratorios, setLaboratorios] = useState([])
  const [laboratorioId, setLaboratorioId] = useState('')
  const [horarios, setHorarios] = useState([])
  const [agendamentos, setAgendamentos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const periodoReferencia = segundaFeiraDaSemana()

  useEffect(() => {
    async function carregarBase() {
      const [{ data: labs, error: erroLabs }, { data: hrs, error: erroHrs }] = await Promise.all([
        supabase.from('laboratorios').select('id, nome').eq('ativo', true).order('nome'),
        supabase.from('horarios').select('id, dia_semana, bloco, hora_inicio, hora_fim').order('dia_semana').order('hora_inicio'),
      ])

      if (erroLabs || erroHrs) {
        setErro('Não foi possível carregar a agenda.')
        setCarregando(false)
        return
      }

      setLaboratorios(labs || [])
      setHorarios(hrs || [])
      if (labs && labs.length > 0) setLaboratorioId(labs[0].id)
      setCarregando(false)
    }

    carregarBase()
  }, [])

  useEffect(() => {
    if (!laboratorioId) return

    async function carregarAgendamentos() {
      const { data, error } = await supabase
        .from('agendamentos')
        .select('id, horario_id, turma, professor_id')
        .eq('laboratorio_id', laboratorioId)
        .eq('periodo_referencia', periodoReferencia)
        .eq('status', 'confirmado')

      if (!error) setAgendamentos(data || [])
    }

    carregarAgendamentos()
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
  }

  const diasComHorario = [...new Set(horarios.map((h) => h.dia_semana))].sort()

  return (
    <Layout>
      <div className="dash-topo">
        <h1 className="dash-titulo">Agenda</h1>
        <p className="dash-subtitulo">Reserva de horários por laboratório</p>
      </div>

      <div className="dash-conteudo">
        {carregando && <p className="dash-mensagem">Carregando agenda...</p>}
        {erro && <p className="dash-erro">{erro}</p>}

        {!carregando && !erro && (
          <>
            <div className="agenda-filtro">
              <select
                className="agenda-select"
                value={laboratorioId}
                onChange={(e) => setLaboratorioId(e.target.value)}
              >
                {laboratorios.map((lab) => (
                  <option key={lab.id} value={lab.id}>
                    {lab.nome}
                  </option>
                ))}
              </select>
              <span className="agenda-periodo">Semana de referência: {periodoReferencia}</span>
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
                  {[...new Set(horarios.map((h) => h.bloco))].map((bloco) => (
                    <tr key={bloco}>
                      <td>{bloco}</td>
                      {diasComHorario.map((dia) => {
                        const horario = horarios.find((h) => h.dia_semana === dia && h.bloco === bloco)
                        if (!horario) return <td key={dia}>—</td>

                        const agendamento = agendamentos.find((a) => a.horario_id === horario.id)

                        return (
                          <td key={dia}>
                            {agendamento ? (
                              <span className="agenda-celula-ocupada">{agendamento.turma}</span>
                            ) : (
                              <button
                                className="agenda-celula-livre"
                                onClick={() => reservar(horario.id)}
                              >
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
    </Layout>
  )
}
