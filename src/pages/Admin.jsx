import { useCallback, useEffect, useMemo, useState } from 'react'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabaseClient'
import { getProfessorLogado } from '../lib/auth'
import './Admin.css'

const TABS = [
  ['visao', 'Visão geral'],
  ['professores', 'Professores'],
  ['turmas', 'Turmas'],
  ['disciplinas', 'Disciplinas'],
  ['laboratorios', 'Laboratórios'],
  ['prioridades', 'Prioridades'],
  ['horarios', 'Horários'],
  ['agendamentos', 'Reservas'],
]

const dias = [
  [1, 'Segunda'],
  [2, 'Terça'],
  [3, 'Quarta'],
  [4, 'Quinta'],
  [5, 'Sexta'],
  [6, 'Sábado'],
  [7, 'Domingo'],
]

const vazio = (nome) => ({ ativo: true, nome })

function AdminPage() {
  const professor = getProfessorLogado()
  const [aba, setAba] = useState('visao')
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')
  const [busca, setBusca] = useState('')
  const [dados, setDados] = useState({ professores: [], turmas: [], disciplinas: [], laboratorios: [], prioridades: [], horarios: [], agendamentos: [], professorDias: [], professorTurmas: [] })
  const [carregando, setCarregando] = useState(true)
  const [modal, setModal] = useState(null)

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro('')
    const consultas = await Promise.all([
      supabase.from('professores').select('id,nome,login,disciplina_id,ativo,criado_em,disciplinas(id,nome)').order('nome'),
      supabase.from('professor_dias_aula').select('id,professor_id,dia_semana').order('dia_semana'),
      supabase.from('professor_turmas').select('id,professor_id,turma_id').order('turma_id'),
      supabase.from('turmas').select('id,nome,curso,quantidade_estudantes,turno,bloco,ano_serie,ativo').order('nome'),
      supabase.from('disciplinas').select('id,nome,eh_curso_tecnico,eh_desenvolvimento_sistemas').order('nome'),
      supabase.from('laboratorios').select('id,nome,tipo_agendamento,capacidade,tipo_equipamento,exclusivo_curso_tecnico,ativo').order('nome'),
      supabase.from('prioridades_laboratorio').select('id,laboratorio_id,disciplina_id,ordem_prioridade,bloqueada,laboratorios(nome),disciplinas(nome)').order('laboratorio_id').order('ordem_prioridade'),
      supabase.from('horarios').select('id,dia_semana,bloco,hora_inicio,hora_fim').order('dia_semana').order('hora_inicio'),
      supabase.from('agendamentos').select('id,laboratorio_id,professor_id,horario_id,turma_id,periodo_referencia,status,criado_em,laboratorios(nome),professores(nome),turmas(nome),horarios(dia_semana,bloco,hora_inicio,hora_fim)').order('periodo_referencia', { ascending: false }),
    ]))

    const erroConsulta = consultas.find((item) => item.error)?.error
    if (erroConsulta) setErro(erroConsulta.message)

    setDados({
      professores: consultas[0].data || [],
      turmas: consultas[3].data || [],
      disciplinas: consultas[4].data || [],
      laboratorios: consultas[5].data || [],
      prioridades: consultas[6].data || [],
      horarios: consultas[7].data || [],
      agendamentos: consultas[8].data || [],
      professorDias: consultas[1].data || [],
      professorTurmas: consultas[2].data || [],
    })
    setCarregando(false)
  }, [])

  useEffect(() => { carregar() }, [carregar])

  function feedback(texto) {
    setErro('')
    setMensagem(texto)
    window.setTimeout(() => setMensagem(''), 3500)
  }

  async function executar(operacao, tabela, payload, filtro) {
    let query = supabase.from(tabela)
    if (operacao === 'insert') query = query.insert(payload)
    if (operacao === 'update') query = query.update(payload).eq('id', filtro)
    if (operacao === 'delete') query = query.delete().eq('id', filtro)
    const { error } = await query
    if (error) { setErro(error.message); return false }
    await carregar()
    return true
  }

  const filtrados = useMemo(() => {
    const q = busca.trim().toLocaleLowerCase()
    if (aba === 'professores') return dados.professores.filter((x) => !q || `${x.nome} ${x.login} ${x.disciplinas?.nome || ''}`.toLocaleLowerCase().includes(q))
    if (aba === 'turmas') return dados.turmas.filter((x) => !q || `${x.nome} ${x.curso || ''} ${x.bloco || ''}`.toLocaleLowerCase().includes(q))
    if (aba === 'disciplinas') return dados.disciplinas.filter((x) => !q || x.nome.toLocaleLowerCase().includes(q))
    if (aba === 'laboratorios') return dados.laboratorios.filter((x) => !q || x.nome.toLocaleLowerCase().includes(q))
    if (aba === 'prioridades') return dados.prioridades.filter((x) => !q || `${x.laboratorios?.nome || ''} ${x.disciplinas?.nome || ''}`.toLocaleLowerCase().includes(q))
    return []
  }, [aba, busca, dados])

  function abrirNovo(tipo) {
    setModal({ tipo, modo: 'novo', item: tipo === 'professor' ? { diasSelecionados: [], turmasSelecionadas: [] } : vazio('') })
  }

  function abrirEditar(tipo, item) {
    if (tipo === 'professor') {
      const diasSelecionados = dados.professorDias.filter((x) => x.professor_id === item.id).map((x) => x.dia_semana)
      const turmasSelecionadas = dados.professorTurmas.filter((x) => x.professor_id === item.id).map((x) => x.turma_id)
      setModal({ tipo, modo: 'editar', item: { ...item, diasSelecionados, turmasSelecionadas } })
      return
    }
    setModal({ tipo, modo: 'editar', item: { ...item } })
  }

  async function salvarModal(event) {
    event.preventDefault()
    const { tipo, modo, item } = modal
    setErro('')

    try {
      if (tipo === 'professor') {
        if (!item.nome?.trim() || !item.login?.trim() || !item.disciplina_id) throw new Error('Preencha nome, login e disciplina.')
        if (modo === 'novo' && !item.senha) throw new Error('Informe uma senha inicial para o professor.')
        const payload = { nome: item.nome.trim(), login: item.login.trim(), disciplina_id: item.disciplina_id, ativo: item.ativo !== false }
        if (item.senha) {
          const { data: hash, error: hashError } = await supabase.rpc('gerar_hash_senha', { p_senha: item.senha })
          if (hashError || !hash) throw new Error(hashError?.message || 'Não foi possível preparar a senha.')
          payload.senha_hash = hash
        }
        const { data: professorSalvo, error: professorErro } = modo === 'novo'
          ? await supabase.from('professores').insert(payload).select('id').single()
          : await supabase.from('professores').update(payload).eq('id', item.id).select('id').single()
        if (professorErro || !professorSalvo) throw new Error(professorErro?.message || 'Não foi possível salvar o professor.')
        const professorId = professorSalvo.id
        await supabase.from('professor_dias_aula').delete().eq('professor_id', professorId)
        await supabase.from('professor_turmas').delete().eq('professor_id', professorId)
        const diasSelecionados = (item.diasSelecionados || []).map(Number).filter(Boolean)
        const turmasSelecionadas = item.turmasSelecionadas || []
        if (diasSelecionados.length) {
          const { error } = await supabase.from('professor_dias_aula').insert(diasSelecionados.map((dia_semana) => ({ professor_id: professorId, dia_semana })))
          if (error) throw new Error(error.message)
        }
        if (turmasSelecionadas.length) {
          const { error } = await supabase.from('professor_turmas').insert(turmasSelecionadas.map((turma_id) => ({ professor_id: professorId, turma_id })))
          if (error) throw new Error(error.message)
        }
        await carregar()
        setModal(null)
        feedback('Professor salvo.')
        return
      }

      if (tipo === 'turma') {
        if (!item.nome?.trim()) throw new Error('Informe o nome da turma.')
        const payload = {
          nome: item.nome.trim(), curso: item.curso || null, quantidade_estudantes: item.quantidade_estudantes ? Number(item.quantidade_estudantes) : null,
          turno: item.turno || null, bloco: item.bloco || null, ano_serie: item.ano_serie || null, ativo: item.ativo !== false,
        }
        const ok = await executar(modo === 'novo' ? 'insert' : 'update', 'turmas', payload, item.id)
        if (ok) { setModal(null); feedback('Turma salva.') }
        return
      }

      if (tipo === 'disciplina') {
        if (!item.nome?.trim()) throw new Error('Informe o nome da disciplina.')
        const payload = { nome: item.nome.trim(), eh_curso_tecnico: !!item.eh_curso_tecnico, eh_desenvolvimento_sistemas: !!item.eh_desenvolvimento_sistemas }
        const ok = await executar(modo === 'novo' ? 'insert' : 'update', 'disciplinas', payload, item.id)
        if (ok) { setModal(null); feedback('Disciplina salva.') }
        return
      }

      if (tipo === 'laboratorio') {
        if (!item.nome?.trim()) throw new Error('Informe o nome do laboratório.')
        const payload = { nome: item.nome.trim(), tipo_agendamento: item.tipo_agendamento || 'semanal', capacidade: Number(item.capacidade || 0), tipo_equipamento: item.tipo_equipamento || '', exclusivo_curso_tecnico: !!item.exclusivo_curso_tecnico, ativo: item.ativo !== false }
        const ok = await executar(modo === 'novo' ? 'insert' : 'update', 'laboratorios', payload, item.id)
        if (ok) { setModal(null); feedback('Laboratório salvo.') }
        return
      }

      if (tipo === 'prioridade') {
        if (!item.laboratorio_id || !item.disciplina_id) throw new Error('Selecione laboratório e disciplina.')
        const payload = { laboratorio_id: item.laboratorio_id, disciplina_id: item.disciplina_id, ordem_prioridade: item.ordem_prioridade ? Number(item.ordem_prioridade) : null, bloqueada: !!item.bloqueada }
        const ok = await executar(modo === 'novo' ? 'insert' : 'update', 'prioridades_laboratorio', payload, item.id)
        if (ok) { setModal(null); feedback('Prioridade salva.') }
        return
      }

      if (tipo === 'horario') {
        const payload = { dia_semana: Number(item.dia_semana), bloco: item.bloco || '', hora_inicio: item.hora_inicio, hora_fim: item.hora_fim }
        const ok = await executar(modo === 'novo' ? 'insert' : 'update', 'horarios', payload, item.id)
        if (ok) { setModal(null); feedback('Horário salvo.') }
      }
    } catch (err) {
      setErro(err.message)
    }
  }

  async function excluir(tabela, item, descricao) {
    if (!window.confirm(`Excluir ${descricao}? Esta ação não pode ser desfeita.`)) return
    const ok = await executar('delete', tabela, null, item.id)
    if (ok) feedback(`${descricao[0].toUpperCase()}${descricao.slice(1)} excluído(a).`)
  }

  async function alterarStatus(tabela, item) {
    const ok = await executar('update', tabela, { ativo: !item.ativo }, item.id)
    if (ok) feedback(item.ativo ? 'Item desativado.' : 'Item ativado.')
  }

  async function atualizarStatusAgendamento(item, status) {
    const { error } = await supabase.from('agendamentos').update({ status }).eq('id', item.id)
    if (error) setErro(error.message)
    else { await carregar(); feedback('Reserva atualizada.') }
  }

  const cards = [
    ['Professores', dados.professores.length],
    ['Turmas', dados.turmas.length],
    ['Disciplinas', dados.disciplinas.length],
    ['Laboratórios', dados.laboratorios.length],
    ['Horários', dados.horarios.length],
    ['Reservas', dados.agendamentos.length],
  ]

  return (
    <Layout>
      <div className="admin-pagina">
        <div className="admin-topo">
          <div>
            <p className="admin-kicker">Central de coordenação</p>
            <h1>Administração</h1>
            <p>Gerencie os cadastros e acompanhe a operação do LabJá.</p>
          </div>
          <div className="admin-topo-usuario">{professor?.nome}</div>
        </div>

        {erro && <div className="admin-alerta admin-alerta-erro">{erro}</div>}
        {mensagem && <div className="admin-alerta admin-alerta-ok">{mensagem}</div>}

        <div className="admin-abas">
          {TABS.map(([id, label]) => (
            <button key={id} className={'admin-aba' + (aba === id ? ' admin-aba-ativa' : '')} onClick={() => { setAba(id); setBusca('') }}>
              {label}
            </button>
          ))}
        </div>

        {carregando ? (
          <div className="admin-card admin-vazio">Carregando dados...</div>
        ) : (
          <>
            {aba === 'visao' && (
              <div className="admin-resumo-grid">
                {cards.map(([label, valor]) => <div className="admin-resumo-card" key={label}><span>{label}</span><strong>{valor}</strong></div>)}
                <div className="admin-card admin-resumo-detalhes">
                  <div><strong>{dados.professores.filter((p) => p.ativo).length}</strong><span>professores ativos</span></div>
                  <div><strong>{dados.turmas.filter((t) => t.ativo).length}</strong><span>turmas ativas</span></div>
                  <div><strong>{dados.laboratorios.filter((l) => l.ativo).length}</strong><span>laboratórios ativos</span></div>
                  <div><strong>{dados.agendamentos.filter((a) => a.status === 'pendente').length}</strong><span>reservas pendentes</span></div>
                </div>
              </div>
            )}

            {['professores','turmas','disciplinas','laboratorios','prioridades'].includes(aba) && (
              <div className="admin-card">
                <div className="admin-tabela-topo">
                  <div className="admin-busca"><input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Pesquisar..." /></div>
                  <button className="admin-botao admin-botao-primario" onClick={() => abrirNovo(aba === 'professores' ? 'professor' : aba === 'turmas' ? 'turma' : aba === 'disciplinas' ? 'disciplina' : aba === 'laboratorios' ? 'laboratorio' : 'prioridade')}>+ Novo</button>
                </div>
                {aba === 'professores' && <TabelaProfessores itens={filtrados} onEdit={abrirEditar} onDelete={(x) => excluir('professores', x, 'professor')} onToggle={(x) => alterarStatus('professores', x)} />}
                {aba === 'turmas' && <TabelaTurmas itens={filtrados} onEdit={abrirEditar} onDelete={(x) => excluir('turmas', x, 'turma')} onToggle={(x) => alterarStatus('turmas', x)} />}
                {aba === 'disciplinas' && <TabelaDisciplinas itens={filtrados} onEdit={abrirEditar} onDelete={(x) => excluir('disciplinas', x, 'disciplina')} />}
                {aba === 'laboratorios' && <TabelaLabs itens={filtrados} onEdit={abrirEditar} onDelete={(x) => excluir('laboratorios', x, 'laboratório')} onToggle={(x) => alterarStatus('laboratorios', x)} />}
                {aba === 'prioridades' && <TabelaPrioridades itens={filtrados} onEdit={abrirEditar} onDelete={(x) => excluir('prioridades_laboratorio', x, 'prioridade')} />}
              </div>
            )}

            {aba === 'horarios' && <HorariosView itens={dados.horarios} onNovo={() => abrirNovo('horario')} onEdit={(x) => abrirEditar('horario', x)} onDelete={(x) => excluir('horarios', x, 'horário')} />}
            {aba === 'agendamentos' && <AgendamentosView itens={dados.agendamentos} onStatus={atualizarStatusAgendamento} />}
          </>
        )}

        {modal && (
          <Modal titulo={(modal.modo === 'novo' ? 'Novo ' : 'Editar ') + ({ professor: 'professor', turma: 'turma', disciplina: 'disciplina', laboratorio: 'laboratório', prioridade: 'prioridade', horario: 'horário' }[modal.tipo])} onClose={() => setModal(null)}>
            <FormModal modal={modal} setModal={setModal} onSubmit={salvarModal} dados={dados} />
          </Modal>
        )}
      </div>
    </Layout>
  )
}

function Acoes({ children }) { return <div className="admin-acoes">{children}</div> }
function Botao({ children, onClick, danger = false }) { return <button className={'admin-botao admin-botao-secundario' + (danger ? ' admin-botao-perigo' : '')} onClick={onClick}>{children}</button> }
function Toggle({ ativo }) { return <span className={'admin-status ' + (ativo ? 'admin-status-ok' : 'admin-status-off')}>{ativo ? 'Ativo' : 'Inativo'}</span> }

function TabelaProfessores({ itens, onEdit, onDelete, onToggle }) {
  return <Tabela headers={['Nome','Login','Disciplina','Status','Ações']} rows={itens.map((x) => [x.nome,x.login,x.disciplinas?.nome || '—',<Toggle ativo={x.ativo}/>,<Acoes><Botao onClick={() => onEdit('professor', x)}>Editar</Botao><Botao onClick={() => onToggle(x)}>{x.ativo ? 'Desativar' : 'Ativar'}</Botao><Botao danger onClick={() => onDelete(x)}>Excluir</Botao></Acoes>])} empty="Nenhum professor encontrado." />
}
function TabelaTurmas({ itens, onEdit, onDelete, onToggle }) {
  return <Tabela headers={['Turma','Curso','Alunos','Turno','Bloco','Status','Ações']} rows={itens.map((x) => [x.nome,x.curso || '—',x.quantidade_estudantes ?? '—',x.turno || '—',x.bloco || '—',<Toggle ativo={x.ativo}/>,<Acoes><Botao onClick={() => onEdit('turma', x)}>Editar</Botao><Botao onClick={() => onToggle(x)}>{x.ativo ? 'Desativar' : 'Ativar'}</Botao><Botao danger onClick={() => onDelete(x)}>Excluir</Botao></Acoes>])} empty="Nenhuma turma encontrada." />
}
function TabelaDisciplinas({ itens, onEdit, onDelete }) {
  return <Tabela headers={['Disciplina','Curso técnico','Desenv. Sistemas','Ações']} rows={itens.map((x) => [x.nome,x.eh_curso_tecnico ? 'Sim':'Não',x.eh_desenvolvimento_sistemas ? 'Sim':'Não',<Acoes><Botao onClick={() => onEdit('disciplina', x)}>Editar</Botao><Botao danger onClick={() => onDelete(x)}>Excluir</Botao></Acoes>])} empty="Nenhuma disciplina encontrada." />
}
function TabelaLabs({ itens, onEdit, onDelete, onToggle }) {
  return <Tabela headers={['Laboratório','Tipo','Capacidade','Equipamento','Status','Ações']} rows={itens.map((x) => [x.nome,x.tipo_agendamento,x.capacidade,x.tipo_equipamento || '—',<Toggle ativo={x.ativo}/>,<Acoes><Botao onClick={() => onEdit('laboratorio', x)}>Editar</Botao><Botao onClick={() => onToggle(x)}>{x.ativo ? 'Desativar' : 'Ativar'}</Botao><Botao danger onClick={() => onDelete(x)}>Excluir</Botao></Acoes>])} empty="Nenhum laboratório encontrado." />
}
function TabelaPrioridades({ itens, onEdit, onDelete }) {
  return <Tabela headers={['Laboratório','Disciplina','Ordem','Bloqueada','Ações']} rows={itens.map((x) => [x.laboratorios?.nome || '—',x.disciplinas?.nome || '—',x.ordem_prioridade ?? '—',x.bloqueada ? 'Sim':'Não',<Acoes><Botao onClick={() => onEdit('prioridade', x)}>Editar</Botao><Botao danger onClick={() => onDelete(x)}>Excluir</Botao></Acoes>])} empty="Nenhuma prioridade cadastrada." />
}
function HorariosView({ itens, onNovo, onEdit, onDelete }) {
  return <div className="admin-card"><div className="admin-tabela-topo"><h2>Horários</h2><button className="admin-botao admin-botao-primario" onClick={onNovo}>+ Novo</button></div><Tabela headers={['Dia','Bloco','Início','Fim','Ações']} rows={itens.map((x) => [dias.find((d) => d[0] === x.dia_semana)?.[1] || x.dia_semana,x.bloco,x.hora_inicio?.slice(0,5),x.hora_fim?.slice(0,5),<Acoes><Botao onClick={() => onEdit('horario', x)}>Editar</Botao><Botao danger onClick={() => onDelete(x)}>Excluir</Botao></Acoes>])} empty="Nenhum horário encontrado." /></div>
}
function AgendamentosView({ itens, onStatus }) {
  return <div className="admin-card"><div className="admin-tabela-topo"><h2>Reservas e agendamentos</h2></div><Tabela headers={['Período','Laboratório','Professor','Turma','Horário','Status','Ações']} rows={itens.map((x) => [x.periodo_referencia,x.laboratorios?.nome || '—',x.professores?.nome || '—',x.turmas?.nome || '—',x.horarios ? `${dias.find((d) => d[0] === x.horarios.dia_semana)?.[1] || ''} · ${x.horarios.bloco}` : '—',x.status,<Acoes>{x.status === 'pendente' && <><Botao onClick={() => onStatus(x,'confirmado')}>Confirmar</Botao><Botao danger onClick={() => onStatus(x,'cancelado')}>Recusar</Botao></>}{x.status === 'confirmado' && <Botao danger onClick={() => onStatus(x,'cancelado')}>Cancelar</Botao>}</Acoes>])} empty="Nenhuma reserva encontrada." /></div>
}
function Tabela({ headers, rows, empty }) { return rows.length ? <div className="admin-tabela-wrap"><table className="admin-tabela"><thead><tr>{headers.map((x) => <th key={x}>{x}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody></table></div> : <div className="admin-vazio">{empty}</div> }
function Modal({ titulo, children, onClose }) { return <div className="admin-modal-backdrop" role="presentation"><div className="admin-modal"><div className="admin-modal-topo"><h2>{titulo}</h2><button className="admin-modal-fechar" onClick={onClose}>×</button></div>{children}</div></div> }

function FormModal({ modal, setModal, onSubmit, dados }) {
  const item = modal.item
  const update = (campo, valor) => setModal((m) => ({ ...m, item: { ...m.item, [campo]: valor } }))
  if (modal.tipo === 'professor') return <form className="admin-form" onSubmit={onSubmit}><Campo label="Nome"><input value={item.nome || ''} onChange={(e) => update('nome', e.target.value)} required /></Campo><Campo label="Login"><input value={item.login || ''} onChange={(e) => update('login', e.target.value)} required /></Campo><Campo label="Disciplina"><select value={item.disciplina_id || ''} onChange={(e) => update('disciplina_id', e.target.value)} required><option value="">Selecione...</option>{dados.disciplinas.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}</select></Campo><Campo label={modal.modo === 'novo' ? 'Senha inicial' : 'Nova senha (opcional)'}><input type="password" value={item.senha || ''} onChange={(e) => update('senha', e.target.value)} placeholder={modal.modo === 'novo' ? '' : 'Deixe vazio para manter'} required={modal.modo === 'novo'} /></Campo><div><span className="admin-form-secao">Dias de aula</span><div className="admin-opcoes-grid">{dias.map(([id, nome]) => <label className="admin-check" key={id}><input type="checkbox" checked={(item.diasSelecionados || []).includes(id)} onChange={(e) => update('diasSelecionados', e.target.checked ? [...(item.diasSelecionados || []), id] : (item.diasSelecionados || []).filter((x) => x !== id))} /><span>{nome}</span></label>)}</div></div><div><span className="admin-form-secao">Turmas vinculadas</span><div className="admin-opcoes-lista">{dados.turmas.map((t) => <label className="admin-check" key={t.id}><input type="checkbox" checked={(item.turmasSelecionadas || []).includes(t.id)} onChange={(e) => update('turmasSelecionadas', e.target.checked ? [...(item.turmasSelecionadas || []), t.id] : (item.turmasSelecionadas || []).filter((x) => x !== t.id))} /><span>{t.nome}{t.curso ? ` · ${t.curso}` : ''}</span></label>)}</div></div><Check label="Professor ativo" checked={item.ativo !== false} onChange={(v) => update('ativo', v)} /><FormActions /></form>
  if (modal.tipo === 'turma') return <form className="admin-form" onSubmit={onSubmit}><Campo label="Nome"><input value={item.nome || ''} onChange={(e) => update('nome', e.target.value)} required /></Campo><Campo label="Curso"><input value={item.curso || ''} onChange={(e) => update('curso', e.target.value)} /></Campo><div className="admin-grid-2"><Campo label="Alunos"><input type="number" min="0" value={item.quantidade_estudantes ?? ''} onChange={(e) => update('quantidade_estudantes', e.target.value)} /></Campo><Campo label="Turno"><select value={item.turno || ''} onChange={(e) => update('turno', e.target.value)}><option value="">—</option><option value="manhã">Manhã</option><option value="tarde">Tarde</option><option value="noite">Noite</option></select></Campo></div><div className="admin-grid-2"><Campo label="Bloco"><input value={item.bloco || ''} onChange={(e) => update('bloco', e.target.value)} /></Campo><Campo label="Ano/Série"><input value={item.ano_serie || ''} onChange={(e) => update('ano_serie', e.target.value)} /></Campo></div><Check label="Turma ativa" checked={item.ativo !== false} onChange={(v) => update('ativo', v)} /><FormActions /></form>
  if (modal.tipo === 'disciplina') return <form className="admin-form" onSubmit={onSubmit}><Campo label="Nome"><input value={item.nome || ''} onChange={(e) => update('nome', e.target.value)} required /></Campo><Check label="É curso técnico" checked={!!item.eh_curso_tecnico} onChange={(v) => update('eh_curso_tecnico', v)} /><Check label="É Desenvolvimento de Sistemas" checked={!!item.eh_desenvolvimento_sistemas} onChange={(v) => update('eh_desenvolvimento_sistemas', v)} /><FormActions /></form>
  if (modal.tipo === 'laboratorio') return <form className="admin-form" onSubmit={onSubmit}><Campo label="Nome"><input value={item.nome || ''} onChange={(e) => update('nome', e.target.value)} required /></Campo><div className="admin-grid-2"><Campo label="Tipo de agendamento"><select value={item.tipo_agendamento || 'semanal'} onChange={(e) => update('tipo_agendamento', e.target.value)}><option value="semanal">Semanal</option><option value="quinzenal">Quinzenal</option></select></Campo><Campo label="Capacidade"><input type="number" min="0" value={item.capacidade ?? ''} onChange={(e) => update('capacidade', e.target.value)} required /></Campo></div><Campo label="Tipo de equipamento"><input value={item.tipo_equipamento || ''} onChange={(e) => update('tipo_equipamento', e.target.value)} /></Campo><Check label="Exclusivo para curso técnico" checked={!!item.exclusivo_curso_tecnico} onChange={(v) => update('exclusivo_curso_tecnico', v)} /><Check label="Laboratório ativo" checked={item.ativo !== false} onChange={(v) => update('ativo', v)} /><FormActions /></form>
  if (modal.tipo === 'prioridade') return <form className="admin-form" onSubmit={onSubmit}><Campo label="Laboratório"><select value={item.laboratorio_id || ''} onChange={(e) => update('laboratorio_id', e.target.value)} required><option value="">Selecione...</option>{dados.laboratorios.map((x) => <option key={x.id} value={x.id}>{x.nome}</option>)}</select></Campo><Campo label="Disciplina"><select value={item.disciplina_id || ''} onChange={(e) => update('disciplina_id', e.target.value)} required><option value="">Selecione...</option>{dados.disciplinas.map((x) => <option key={x.id} value={x.id}>{x.nome}</option>)}</select></Campo><Campo label="Ordem"><input type="number" min="1" value={item.ordem_prioridade ?? ''} onChange={(e) => update('ordem_prioridade', e.target.value)} /></Campo><Check label="Disciplina bloqueada neste laboratório" checked={!!item.bloqueada} onChange={(v) => update('bloqueada', v)} /><FormActions /></form>
  if (modal.tipo === 'horario') return <form className="admin-form" onSubmit={onSubmit}><Campo label="Dia"><select value={item.dia_semana || 1} onChange={(e) => update('dia_semana', e.target.value)}>{dias.map((d) => <option key={d[0]} value={d[0]}>{d[1]}</option>)}</select></Campo><Campo label="Bloco"><input value={item.bloco || ''} onChange={(e) => update('bloco', e.target.value)} required /></Campo><div className="admin-grid-2"><Campo label="Início"><input type="time" value={item.hora_inicio || ''} onChange={(e) => update('hora_inicio', e.target.value)} required /></Campo><Campo label="Fim"><input type="time" value={item.hora_fim || ''} onChange={(e) => update('hora_fim', e.target.value)} required /></Campo></div><FormActions /></form>
  return null
}
function Campo({ label, children }) { return <label className="admin-campo"><span>{label}</span>{children}</label> }
function Check({ label, checked, onChange }) { return <label className="admin-check"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} /><span>{label}</span></label> }
function FormActions() { return <div className="admin-form-acoes"><button type="submit" className="admin-botao admin-botao-primario">Salvar</button></div> }

export default AdminPage
