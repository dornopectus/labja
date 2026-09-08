import { useEffect, useMemo, useState } from 'react'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabaseClient'
import { getProfessorLogado } from '../lib/auth'
import { IconBuilding, IconCalendar, IconGrid } from '../components/icons'
import './Admin.css'

const ABAS = [
  { id: 'resumo', label: 'Resumo' },
  { id: 'professores', label: 'Professores' },
  { id: 'turmas', label: 'Turmas' },
  { id: 'materias', label: 'Matérias' },
  { id: 'laboratorios', label: 'Laboratórios' },
  { id: 'horarios', label: 'Horários' },
  { id: 'reservas', label: 'Reservas' },
]

function estaNoModoAdmin(professor) {
  return Boolean(
    professor?.eh_admin ||
      professor?.is_admin ||
      professor?.administrador ||
      ['admin', 'administrador', 'coordenador'].includes(String(professor?.perfil ?? '').toLowerCase()) ||
      ['admin', 'administrador', 'coordenador'].includes(String(professor?.role ?? '').toLowerCase()) ||
      ['admin', 'administrador', 'coordenador'].includes(String(professor?.tipo_usuario ?? '').toLowerCase())
  )
}

function normalizarTexto(valor) {
  return String(valor ?? '').trim().toLocaleLowerCase('pt-BR')
}

function formatarDataHora(valor) {
  if (!valor) return '—'
  const data = new Date(valor)
  if (Number.isNaN(data.getTime())) return String(valor)
  return data.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export default function Admin() {
  const professorLogado = getProfessorLogado()
  const [aba, setAba] = useState('resumo')
  const [dados, setDados] = useState({
    professores: [],
    turmas: [],
    prioridades: [],
    laboratorios: [],
    horarios: [],
    reservas: [],
  })
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [busca, setBusca] = useState('')
  const [editor, setEditor] = useState(null)
  const [salvando, setSalvando] = useState(false)

  const ehAdmin = estaNoModoAdmin(professorLogado)

  async function carregarDados() {
    setCarregando(true)
    setErro('')

    const [professores, turmas, prioridades, laboratorios, horarios, reservas] = await Promise.all([
      supabase.from('professores').select('id, nome, login, materia, curso_tecnico, eh_desenvolvimento_sistemas').order('nome'),
      supabase.from('turmas').select('id, nome').order('nome'),
      supabase.from('prioridades_laboratorio').select('id, laboratorio_id, materia, ordem_prioridade, bloqueada').order('laboratorio_id').order('ordem_prioridade'),
      supabase.from('laboratorios').select('id, nome, tipo_agendamento, exclusivo_curso_tecnico, ativo').order('nome'),
      supabase.from('horarios').select('id, dia_semana, bloco, hora_inicio, hora_fim').order('dia_semana').order('hora_inicio'),
      supabase.from('agendamentos').select('id, turma, professor_id, laboratorio_id, horario_id, periodo_referencia, status').order('id', { ascending: false }).limit(300),
    ])

    const erros = [professores, turmas, prioridades, laboratorios, horarios, reservas]
      .map((r) => r.error)
      .filter(Boolean)

    if (erros.length > 0) {
      setErro(erros[0].message || 'Não foi possível carregar os dados administrativos.')
    }

    setDados({
      professores: professores.data || [],
      turmas: turmas.data || [],
      prioridades: prioridades.data || [],
      laboratorios: laboratorios.data || [],
      horarios: horarios.data || [],
      reservas: reservas.data || [],
    })
    setCarregando(false)
  }

  useEffect(() => {
    if (ehAdmin) carregarDados()
    else setCarregando(false)
  }, [ehAdmin])

  const materias = useMemo(() => {
    const mapa = new Map()
    for (const professor of dados.professores) {
      const nome = String(professor.materia ?? '').trim()
      if (!nome) continue
      const chave = normalizarTexto(nome)
      const atual = mapa.get(chave) || { nome, professores: 0 }
      atual.professores += 1
      mapa.set(chave, atual)
    }
    for (const prioridade of dados.prioridades) {
      const nome = String(prioridade.materia ?? '').trim()
      if (!nome) continue
      const chave = normalizarTexto(nome)
      const atual = mapa.get(chave) || { nome, professores: 0 }
      if (!atual.nome) atual.nome = nome
      mapa.set(chave, atual)
    }
    return [...mapa.values()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  }, [dados.professores, dados.prioridades])

  const professoresFiltrados = dados.professores.filter((item) => {
    const texto = `${item.nome} ${item.login} ${item.materia}`
    return normalizarTexto(texto).includes(normalizarTexto(busca))
  })

  const turmasFiltradas = dados.turmas.filter((item) => normalizarTexto(item.nome).includes(normalizarTexto(busca)))
  const materiasFiltradas = materias.filter((item) => normalizarTexto(item.nome).includes(normalizarTexto(busca)))

  function abrirNovoProfessor() {
    setEditor({ tipo: 'professor', modo: 'novo', dados: { nome: '', login: '', senha: '', materia: '', curso_tecnico: false, eh_desenvolvimento_sistemas: false } })
  }

  function abrirEditarProfessor(item) {
    setEditor({ tipo: 'professor', modo: 'editar', dados: { ...item, senha: '' } })
  }

  function abrirNovaTurma() {
    setEditor({ tipo: 'turma', modo: 'novo', dados: { nome: '' } })
  }

  function abrirEditarTurma(item) {
    setEditor({ tipo: 'turma', modo: 'editar', dados: { ...item } })
  }

  async function salvarEditor(e) {
    e.preventDefault()
    if (!editor) return
    setSalvando(true)
    setErro('')

    try {
      if (editor.tipo === 'professor') {
        const payload = {
          nome: editor.dados.nome?.trim(),
          login: editor.dados.login?.trim(),
          materia: editor.dados.materia?.trim(),
          curso_tecnico: Boolean(editor.dados.curso_tecnico),
          eh_desenvolvimento_sistemas: Boolean(editor.dados.eh_desenvolvimento_sistemas),
        }
        if (!payload.nome || !payload.login) throw new Error('Nome e login são obrigatórios.')
        if (editor.dados.senha?.trim()) payload.senha = editor.dados.senha.trim()

        const consulta = editor.modo === 'novo'
          ? await supabase.from('professores').insert(payload).select('id, nome, login, materia, curso_tecnico, eh_desenvolvimento_sistemas').single()
          : await supabase.from('professores').update(payload).eq('id', editor.dados.id).select('id, nome, login, materia, curso_tecnico, eh_desenvolvimento_sistemas').single()

        if (consulta.error) throw consulta.error
      }

      if (editor.tipo === 'turma') {
        const payload = { nome: editor.dados.nome?.trim() }
        if (!payload.nome) throw new Error('Nome da turma é obrigatório.')

        const consulta = editor.modo === 'novo'
          ? await supabase.from('turmas').insert(payload).select('id, nome').single()
          : await supabase.from('turmas').update(payload).eq('id', editor.dados.id).select('id, nome').single()

        if (consulta.error) throw consulta.error
      }

      setEditor(null)
      await carregarDados()
    } catch (err) {
      setErro(err.message || 'Não foi possível salvar.')
    } finally {
      setSalvando(false)
    }
  }

  async function excluirRegistro(tipo, id, rotulo) {
    const mensagem = `Excluir ${rotulo}? Essa ação não pode ser desfeita.`
    if (!window.confirm(mensagem)) return

    const tabela = tipo === 'professor' ? 'professores' : 'turmas'
    const { error } = await supabase.from(tabela).delete().eq('id', id)
    if (error) {
      setErro(`Não foi possível excluir: ${error.message}`)
      return
    }
    await carregarDados()
  }

  if (!ehAdmin) {
    return (
      <Layout>
        <main className="admin-pagina">
          <div className="admin-erro-acesso">
            <h1>Acesso restrito</h1>
            <p>Esta área é exclusiva para administradores e coordenação.</p>
          </div>
        </main>
      </Layout>
    )
  }

  return (
    <Layout>
      <main className="admin-pagina">
        <header className="admin-cabecalho">
          <div>
            <p className="admin-kicker">Administração</p>
            <h1>Central de gestão</h1>
            <p>Cadastre, consulte e mantenha os dados do LabJá em um único lugar.</p>
          </div>
          <button className="admin-botao-secundario" onClick={carregarDados} disabled={carregando}>
            {carregando ? 'Atualizando...' : 'Atualizar dados'}
          </button>
        </header>

        <nav className="admin-abas" aria-label="Seções administrativas">
          {ABAS.map((item) => (
            <button
              key={item.id}
              className={aba === item.id ? 'admin-aba admin-aba-ativa' : 'admin-aba'}
              onClick={() => { setAba(item.id); setBusca('') }}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {erro && <div className="admin-alerta">{erro}</div>}

        {carregando ? (
          <div className="admin-carregando">Carregando dados...</div>
        ) : (
          <>
            {aba !== 'resumo' && (
              <div className="admin-toolbar">
                <input
                  className="admin-busca"
                  type="search"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder={`Buscar em ${ABAS.find((x) => x.id === aba)?.label.toLowerCase() ?? 'dados'}...`}
                />
                {aba === 'professores' && <button className="admin-botao-principal" onClick={abrirNovoProfessor}>Novo professor</button>}
                {aba === 'turmas' && <button className="admin-botao-principal" onClick={abrirNovaTurma}>Nova turma</button>}
              </div>
            )}

            {aba === 'resumo' && (
              <section className="admin-cards">
                <ResumoCard titulo="Professores" valor={dados.professores.length} />
                <ResumoCard titulo="Turmas" valor={dados.turmas.length} />
                <ResumoCard titulo="Matérias" valor={materias.length} />
                <ResumoCard titulo="Laboratórios" valor={dados.laboratorios.length} icone={<IconBuilding size={20} />} />
                <ResumoCard titulo="Horários" valor={dados.horarios.length} icone={<IconCalendar size={20} />} />
                <ResumoCard titulo="Reservas carregadas" valor={dados.reservas.length} icone={<IconGrid size={20} />} />
              </section>
            )}

            {aba === 'professores' && (
              <Tabela titulo="Professores" colunas={['Nome', 'Login', 'Matéria', 'Técnico', 'DS', 'Ações']}>
                {professoresFiltrados.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.nome}</strong></td>
                    <td>{item.login || '—'}</td>
                    <td>{item.materia || '—'}</td>
                    <td><StatusSimNao valor={item.curso_tecnico} /></td>
                    <td><StatusSimNao valor={item.eh_desenvolvimento_sistemas} /></td>
                    <td className="admin-acoes">
                      <button onClick={() => abrirEditarProfessor(item)}>Editar</button>
                      <button className="admin-acao-perigo" onClick={() => excluirRegistro('professor', item.id, `o professor ${item.nome}`)}>Excluir</button>
                    </td>
                  </tr>
                ))}
              </Tabela>
            )}

            {aba === 'turmas' && (
              <Tabela titulo="Turmas" colunas={['Nome', 'Ações']}>
                {turmasFiltradas.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.nome}</strong></td>
                    <td className="admin-acoes">
                      <button onClick={() => abrirEditarTurma(item)}>Editar</button>
                      <button className="admin-acao-perigo" onClick={() => excluirRegistro('turma', item.id, `a turma ${item.nome}`)}>Excluir</button>
                    </td>
                  </tr>
                ))}
              </Tabela>
            )}

            {aba === 'materias' && (
              <Tabela titulo="Matérias encontradas no cadastro" colunas={['Matéria', 'Professores', 'Prioridades configuradas']}>
                {materiasFiltradas.map((item) => {
                  const prioridades = dados.prioridades.filter((p) => normalizarTexto(p.materia) === normalizarTexto(item.nome))
                  return (
                    <tr key={item.nome}>
                      <td><strong>{item.nome}</strong></td>
                      <td>{item.professores}</td>
                      <td>{prioridades.length}</td>
                    </tr>
                  )
                })}
              </Tabela>
            )}

            {aba === 'laboratorios' && (
              <Tabela titulo="Laboratórios" colunas={['Nome', 'Agendamento', 'Exclusivo técnico', 'Ativo']}>
                {dados.laboratorios.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.nome}</strong></td>
                    <td>{item.tipo_agendamento || '—'}</td>
                    <td><StatusSimNao valor={item.exclusivo_curso_tecnico} /></td>
                    <td><StatusSimNao valor={item.ativo} /></td>
                  </tr>
                ))}
              </Tabela>
            )}

            {aba === 'horarios' && (
              <Tabela titulo="Horários" colunas={['Dia', 'Bloco', 'Início', 'Fim']}>
                {dados.horarios.map((item) => (
                  <tr key={item.id}>
                    <td>{item.dia_semana}</td>
                    <td>{item.bloco}</td>
                    <td>{item.hora_inicio?.slice(0, 5) ?? '—'}</td>
                    <td>{item.hora_fim?.slice(0, 5) ?? '—'}</td>
                  </tr>
                ))}
              </Tabela>
            )}

            {aba === 'reservas' && (
              <Tabela titulo="Reservas recentes" colunas={['Turma', 'Professor ID', 'Lab ID', 'Horário ID', 'Período', 'Status']}>
                {dados.reservas.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.turma || '—'}</strong></td>
                    <td>{item.professor_id || '—'}</td>
                    <td>{item.laboratorio_id || '—'}</td>
                    <td>{item.horario_id || '—'}</td>
                    <td>{item.periodo_referencia || '—'}</td>
                    <td>{item.status || '—'}</td>
                  </tr>
                ))}
              </Tabela>
            )}
          </>
        )}

        {editor && (
          <div className="admin-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setEditor(null)}>
            <form className="admin-modal" onSubmit={salvarEditor}>
              <div className="admin-modal-cabecalho">
                <div>
                  <p className="admin-kicker">Cadastro</p>
                  <h2>{editor.modo === 'novo' ? 'Novo' : 'Editar'} {editor.tipo === 'professor' ? 'professor' : 'turma'}</h2>
                </div>
                <button type="button" className="admin-modal-fechar" onClick={() => setEditor(null)}>×</button>
              </div>

              {editor.tipo === 'professor' ? (
                <div className="admin-form-grid">
                  <label>Nome<input required value={editor.dados.nome ?? ''} onChange={(e) => setEditor((atual) => ({ ...atual, dados: { ...atual.dados, nome: e.target.value } }))} /></label>
                  <label>Login<input required value={editor.dados.login ?? ''} onChange={(e) => setEditor((atual) => ({ ...atual, dados: { ...atual.dados, login: e.target.value } }))} /></label>
                  <label>Matéria<input value={editor.dados.materia ?? ''} onChange={(e) => setEditor((atual) => ({ ...atual, dados: { ...atual.dados, materia: e.target.value } }))} /></label>
                  <label>Senha {editor.modo === 'editar' && <span className="admin-ajuda">(deixe vazia para manter)</span>}<input type="password" value={editor.dados.senha ?? ''} onChange={(e) => setEditor((atual) => ({ ...atual, dados: { ...atual.dados, senha: e.target.value } }))} /></label>
                  <label className="admin-check"><input type="checkbox" checked={Boolean(editor.dados.curso_tecnico)} onChange={(e) => setEditor((atual) => ({ ...atual, dados: { ...atual.dados, curso_tecnico: e.target.checked } }))} /> Curso técnico</label>
                  <label className="admin-check"><input type="checkbox" checked={Boolean(editor.dados.eh_desenvolvimento_sistemas)} onChange={(e) => setEditor((atual) => ({ ...atual, dados: { ...atual.dados, eh_desenvolvimento_sistemas: e.target.checked } }))} /> Desenvolvimento de Sistemas</label>
                </div>
              ) : (
                <label className="admin-campo-unico">Nome da turma<input required value={editor.dados.nome ?? ''} onChange={(e) => setEditor((atual) => ({ ...atual, dados: { ...atual.dados, nome: e.target.value } }))} /></label>
              )}

              <div className="admin-modal-acoes">
                <button type="button" className="admin-botao-secundario" onClick={() => setEditor(null)}>Cancelar</button>
                <button type="submit" className="admin-botao-principal" disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</button>
              </div>
            </form>
          </div>
        )}
      </main>
    </Layout>
  )
}

function ResumoCard({ titulo, valor, icone }) {
  return <article className="admin-resumo-card"><div className="admin-resumo-icone">{icone}</div><span>{titulo}</span><strong>{valor}</strong></article>
}

function StatusSimNao({ valor }) {
  return <span className={valor ? 'admin-status admin-status-sim' : 'admin-status'}>{valor ? 'Sim' : 'Não'}</span>
}

function Tabela({ titulo, colunas, children }) {
  return <section className="admin-bloco"><div className="admin-bloco-titulo"><h2>{titulo}</h2></div><div className="admin-tabela-wrap"><table className="admin-tabela"><thead><tr>{colunas.map((c) => <th key={c}>{c}</th>)}</tr></thead><tbody>{children}</tbody></table></div></section>
}
