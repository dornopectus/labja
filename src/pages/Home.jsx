import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import AgendaSecao from './AgendaSecao'
import { supabase } from '../lib/supabaseClient'
import { getProfessorLogado } from '../lib/auth'
import { periodoSemanalAtual, periodoQuinzenalAtual } from '../lib/periodos'
import { sincronizarHoraServidor } from '../lib/horaServidor'
import './Dashboard.css'
import './Agenda.css'

const DIAS = { 1: 'Segunda', 2: 'Terça', 3: 'Quarta', 4: 'Quinta', 5: 'Sexta', 6: 'Sábado', 7: 'Domingo' }

export default function Home() {
  const professor = getProfessorLogado()
  const [labsSemanais, setLabsSemanais] = useState([])
  const [labsQuinzenais, setLabsQuinzenais] = useState([])
  const [horarios, setHorarios] = useState([])
  const [laboratorioPrioritarioId, setLaboratorioPrioritarioId] = useState(null)
  const [turmasDoProfessor, setTurmasDoProfessor] = useState([])
  const [reservas, setReservas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  async function carregarReservas() {
    if (!professor?.id) return
    const { data } = await supabase
      .from('agendamentos')
      .select(
        'id, turma, periodo_referencia, laboratorios(nome), horarios(dia_semana, bloco, hora_inicio, hora_fim)'
      )
      .eq('professor_id', professor.id)
      .eq('status', 'confirmado')
      .in('periodo_referencia', [periodoSemanalAtual(), periodoQuinzenalAtual()])

    setReservas(data || [])
  }

  useEffect(() => {
    async function carregarBase() {
      await sincronizarHoraServidor()

      const [{ data: labs, error: erroLabs }, { data: hrs, error: erroHrs }] = await Promise.all([
        supabase
          .from('laboratorios')
          .select('id, nome, tipo_agendamento, exclusivo_curso_tecnico')
          .eq('ativo', true)
          .order('nome'),
        supabase
          .from('horarios')
          .select('id, dia_semana, bloco, hora_inicio, hora_fim')
          .order('dia_semana')
          .order('hora_inicio'),
      ])

      if (erroLabs || erroHrs) {
        setErro('Não foi possível carregar a agenda.')
        setCarregando(false)
        return
      }

      const labsVisiveis = (labs || []).filter(
        (l) => !l.exclusivo_curso_tecnico || professor?.curso_tecnico
      )

      setLabsSemanais(labsVisiveis.filter((l) => l.tipo_agendamento === 'semanal'))
      setLabsQuinzenais(labsVisiveis.filter((l) => l.tipo_agendamento === 'quinzenal'))
      setHorarios(hrs || [])

      if (professor?.materia) {
        const { data: prioridade } = await supabase
          .from('vw_prioridade_professor')
          .select('laboratorio_id, ordem_prioridade')
          .eq('materia', professor.materia)
          .order('ordem_prioridade', { ascending: true })
          .limit(1)
          .maybeSingle()

        if (prioridade) setLaboratorioPrioritarioId(prioridade.laboratorio_id)
      }

      if (professor?.id) {
        const { data: turmas } = await supabase
          .from('professor_turmas')
          .select('turmas(id, nome)')
          .eq('professor_id', professor.id)

        setTurmasDoProfessor((turmas || []).map((t) => t.turmas).filter(Boolean))
      }

      await carregarReservas()
      setCarregando(false)
    }

    carregarBase()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [professor?.id, professor?.materia])

  return (
    <Layout>
      <div className="dash-topo">
        <h1 className="dash-titulo">Olá, {professor?.nome?.split(' ')[0] ?? 'professor'}</h1>
        <p className="dash-subtitulo">Reserve um laboratório para sua aula</p>
      </div>

      <div className="dash-conteudo">
        {carregando && <p className="dash-mensagem">Carregando...</p>}
        {erro && <p className="dash-erro">{erro}</p>}

        {!carregando && !erro && (
          <>
            {professor?.curso_tecnico ? (
              <>
                <AgendaSecao
                  titulo="Laboratório quinzenal"
                  tagClasse="agenda-secao-tag-quinzenal"
                  tagTexto="Quinzenal"
                  laboratorios={labsQuinzenais}
                  horarios={horarios}
                  periodoReferencia={periodoQuinzenalAtual()}
                  laboratorioPrioritarioId={laboratorioPrioritarioId}
                  mostrarAbasSemana
                  aoReservar={carregarReservas}
                  turmasDoProfessor={turmasDoProfessor}
                />

                <AgendaSecao
                  titulo="Laboratórios semanais"
                  tagClasse="agenda-secao-tag-semanal"
                  tagTexto="Semanal"
                  laboratorios={labsSemanais}
                  horarios={horarios}
                  periodoReferencia={periodoSemanalAtual()}
                  laboratorioPrioritarioId={laboratorioPrioritarioId}
                  mostrarDatasReais
                  colapsavel
                  abertaInicialmente={false}
                  aoReservar={carregarReservas}
                  turmasDoProfessor={turmasDoProfessor}
                />
              </>
            ) : (
              <AgendaSecao
                titulo="Laboratórios semanais"
                tagClasse="agenda-secao-tag-semanal"
                tagTexto="Semanal"
                laboratorios={labsSemanais}
                horarios={horarios}
                periodoReferencia={periodoSemanalAtual()}
                laboratorioPrioritarioId={laboratorioPrioritarioId}
                mostrarDatasReais
                aoReservar={carregarReservas}
                turmasDoProfessor={turmasDoProfessor}
              />
            )}

            <div className="agenda-secao">
              <h2 className="agenda-secao-titulo">Minhas reservas</h2>

              {reservas.length === 0 ? (
                <p className="dash-mensagem">Você ainda não tem reservas neste período.</p>
              ) : (
                <div className="dash-lista-reservas">
                  {reservas.map((r) => (
                    <div key={r.id} className="dash-reserva-item">
                      <div className="dash-reserva-info">
                        <span className="dash-reserva-turma">{r.turma}</span>
                        <span className="dash-reserva-detalhe">{r.laboratorios?.nome}</span>
                      </div>
                      <span className="dash-reserva-quando">
                        {DIAS[r.horarios?.dia_semana]} · {r.horarios?.bloco}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}
