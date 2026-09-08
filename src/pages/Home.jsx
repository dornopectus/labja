import { useEffect, useMemo, useState } from 'react'
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
  const [laboratorioPrioritarioQuinzenalId, setLaboratorioPrioritarioQuinzenalId] = useState(null)
  const [turmasDoProfessor, setTurmasDoProfessor] = useState([])
  const [reservas, setReservas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [agoraTick, setAgoraTick] = useState(0)

  const periodoSemanaAtual = useMemo(() => periodoSemanalAtual(), [agoraTick])
  const periodoQuinzenaAtual = useMemo(() => periodoQuinzenalAtual(), [agoraTick])

  useEffect(() => {
    const intervalo = setInterval(() => setAgoraTick((valor) => valor + 1), 30_000)
    return () => clearInterval(intervalo)
  }, [])

  async function carregarReservas() {
    if (!professor?.id) return
    const { data } = await supabase
      .from('agendamentos')
      .select(
        'id, turma_id, periodo_referencia, turmas(nome), laboratorios(nome), horarios(dia_semana, bloco, hora_inicio, hora_fim)'
      )
      .eq('professor_id', professor.id)
      .eq('status', 'confirmado')
      .in('periodo_referencia', [periodoSemanaAtual, periodoQuinzenaAtual])

    setReservas(data || [])
  }

  useEffect(() => {
    async function carregarBase() {
      await sincronizarHoraServidor()
      setAgoraTick((valor) => valor + 1)

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

      // Não mostra laboratórios onde a matéria do professor é proibida
      // (ex.: professor de Inglês nem vê o Lab 4 na lista).
      let labsPermitidos = labsVisiveis
      if (professor?.materia) {
        const { data: bloqueios } = await supabase
          .from('prioridades_laboratorio')
          .select('laboratorio_id')
          .eq('disciplina_id', professor?.disciplina_id)
          .eq('bloqueada', true)

        const idsBloqueados = new Set((bloqueios || []).map((b) => b.laboratorio_id))
        labsPermitidos = labsVisiveis.filter((l) => !idsBloqueados.has(l.id))
      }

      setLabsSemanais(labsPermitidos.filter((l) => l.tipo_agendamento === 'semanal'))
      const quinzenaisPermitidos = labsPermitidos.filter((l) => l.tipo_agendamento === 'quinzenal')
      setLabsQuinzenais(quinzenaisPermitidos)
      setHorarios(hrs || [])

      if (professor?.materia) {
        const { data: prioridade } = await supabase
          .from('vw_prioridade_professor')
          .select('laboratorio_id, ordem_prioridade')
          .ilike('materia', professor.materia)
          .order('ordem_prioridade', { ascending: true })
          .limit(1)
          .maybeSingle()

        if (prioridade) setLaboratorioPrioritarioId(prioridade.laboratorio_id)
      }

      // Prioridade do Lab 2 (quinzenal) usa o campo booleano
      // eh_desenvolvimento_sistemas, não comparação de texto na matéria.
      if (professor?.eh_desenvolvimento_sistemas && quinzenaisPermitidos.length > 0) {
        setLaboratorioPrioritarioQuinzenalId(quinzenaisPermitidos[0].id)
      }

      if (professor?.id) {
        const { data: turmas } = await supabase
          .from('professor_turmas')
          .select('turmas(id, nome)')
          .eq('professor_id', professor.id)

        setTurmasDoProfessor((turmas || []).map((t) => t.turmas).filter(Boolean))
      }

      setCarregando(false)
    }

    carregarBase()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [professor?.id, professor?.materia])

  // Quando chega a sexta-feira às 18h, os períodos mudam automaticamente.
  // Recarrega as reservas para acompanhar a nova semana/quinzena sem exigir F5.
  useEffect(() => {
    if (carregando || !professor?.id) return
    carregarReservas()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodoSemanaAtual, periodoQuinzenaAtual, carregando, professor?.id])

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
                  periodoReferencia={periodoQuinzenaAtual}
                  laboratorioPrioritarioId={laboratorioPrioritarioQuinzenalId}
                  semanaBaseExibicao={professor?.eh_desenvolvimento_sistemas ? periodoSemanaAtual : undefined}
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
                  periodoReferencia={periodoSemanaAtual}
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
                periodoReferencia={periodoSemanaAtual}
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
                        <span className="dash-reserva-turma">{r.turmas?.nome ?? 'Turma'}</span>
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
