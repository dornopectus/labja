import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { getProfessorLogado } from '../lib/auth'
import Layout from '../components/Layout'
import './Admin.css'

const DIAS = [
  [1, 'Segunda'], [2, 'Terça'], [3, 'Quarta'], [4, 'Quinta'],
  [5, 'Sexta'], [6, 'Sábado'], [7, 'Domingo'],
]
const ABAS = [
  ['resumo', 'Resumo'], ['professores', 'Professores'], ['turmas', 'Turmas'],
  ['disciplinas', 'Disciplinas'], ['laboratorios', 'Laboratórios'],
  ['reservas', 'Reservas'],
]

const nomeDia = (n) => DIAS.find(([id]) => Number(id) === Number(n))?.[1] ?? `Dia ${n}`
const normalizar = (v) => String(v ?? '').trim().toLocaleLowerCase('pt-BR')
const vazio = (v) => v === null || v === undefined || v === ''
const erroTexto = (e, fallback) => e?.message || fallback

function Modal({ titulo, onClose, children }) {
  return <div className="admin-modal-fundo" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <div className="admin-modal">
      <div className="admin-modal-topo"><h2>{titulo}</h2><button className="admin-fechar" onClick={onClose}>×</button></div>
      {children}
    </div>
  </div>
}
function Campo({ label, children, className = '' }) { return <label className={`admin-campo ${className}`}>{label}{children}</label> }
function Pill({ ativo }) { return <span className={ativo ? 'admin-pill sim' : 'admin-pill'}>{ativo ? 'Ativo' : 'Inativo'}</span> }
function Acoes({ onEdit, onDelete }) { return <div className="admin-acoes"><button onClick={onEdit}>Editar</button><button className="perigo" onClick={onDelete}>Excluir</button></div> }
function Tabela({ colunas, children }) { return <section className="admin-bloco"><div className="admin-tabela-wrap"><table className="admin-tabela"><thead><tr>{colunas.map(c => <th key={c}>{c}</th>)}</tr></thead><tbody>{children}</tbody></table></div></section> }

export default function Admin() {
  const navigate = useNavigate()
  const usuario = getProfessorLogado()
  const admin = Boolean(usuario?.eh_admin && usuario?.tipo_usuario === 'admin')
  const [aba, setAba] = useState('resumo')
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [editor, setEditor] = useState(null)
  const [dados, setDados] = useState({ professores: [], professorDias: [], professorTurmas: [], turmas: [], disciplinas: [], laboratorios: [], prioridades: [], horarios: [], reservas: [] })

  async function carregarTudo() {
    setCarregando(true); setErro('')
    const resultados = await Promise.all([
      supabase.from('professores').select('id,nome,login,disciplina_id,ativo,criado_em,disciplinas(nome)').order('nome'),
      supabase.from('professor_dias_aula').select('id,professor_id,dia_semana').order('dia_semana'),
      supabase.from('professor_turmas').select('id,professor_id,turma_id').order('id'),
      supabase.from('turmas').select('id,nome,curso,quantidade_estudantes,turno,bloco,ano_serie,ativo').order('nome'),
      supabase.from('disciplinas').select('id,nome,eh_curso_tecnico,eh_desenvolvimento_sistemas').order('nome'),
      supabase.from('laboratorios').select('id,nome,tipo_agendamento,capacidade,tipo_equipamento,exclusivo_curso_tecnico,ativo').order('nome'),
      supabase.from('prioridades_laboratorio').select('id,laboratorio_id,disciplina_id,ordem_prioridade,bloqueada,disciplinas(nome)').order('laboratorio_id').order('ordem_prioridade',{ascending:true}),
      supabase.from('horarios').select('id,dia_semana,bloco,hora_inicio,hora_fim').order('dia_semana').order('hora_inicio'),
      supabase.from('agendamentos').select('id,laboratorio_id,professor_id,horario_id,turma_id,periodo_referencia,status,criado_em,laboratorios(nome),professores(nome),turmas(nome),horarios(dia_semana,bloco,hora_inicio,hora_fim)').order('criado_em',{ascending:false}).limit(500),
    ])
    const primeiroErro = resultados.find(r => r.error)?.error
    if (primeiroErro) setErro(erroTexto(primeiroErro, 'Não foi possível carregar os dados administrativos.'))
    setDados({
      professores: resultados[0].data || [], professorDias: resultados[1].data || [], professorTurmas: resultados[2].data || [],
      turmas: resultados[3].data || [], disciplinas: resultados[4].data || [], laboratorios: resultados[5].data || [],
      prioridades: resultados[6].data || [], horarios: resultados[7].data || [], reservas: resultados[8].data || [],
    })
    setCarregando(false)
  }

  useEffect(() => {
    if (!admin) { setCarregando(false); return }
    carregarTudo()
  }, [admin])

  const mapa = useMemo(() => ({
    professor: new Map(dados.professores.map(x => [x.id, x])), turma: new Map(dados.turmas.map(x => [x.id, x])),
    laboratorio: new Map(dados.laboratorios.map(x => [x.id, x])), horario: new Map(dados.horarios.map(x => [x.id, x])),
    disciplina: new Map(dados.disciplinas.map(x => [x.id, x])),
  }), [dados])

  const professores = useMemo(() => dados.professores.filter(p => normalizar(`${p.nome} ${p.login} ${p.disciplinas?.nome}`).includes(normalizar(busca))), [dados.professores,busca])
  const turmas = useMemo(() => dados.turmas.filter(t => normalizar(`${t.nome} ${t.curso} ${t.bloco} ${t.ano_serie}`).includes(normalizar(busca))), [dados.turmas,busca])
  const disciplinas = useMemo(() => dados.disciplinas.filter(d => normalizar(d.nome).includes(normalizar(busca))), [dados.disciplinas,busca])
  const laboratorios = useMemo(() => dados.laboratorios.filter(l => normalizar(`${l.nome} ${l.tipo_equipamento}`).includes(normalizar(busca))), [dados.laboratorios,busca])
  const reservas = useMemo(() => dados.reservas.filter(r => normalizar(`${r.turmas?.nome} ${r.professores?.nome} ${r.laboratorios?.nome} ${r.status}`).includes(normalizar(busca))), [dados.reservas,busca])

  function novo(tipo) {
    const padrao = {
      professor: { id:null,nome:'',login:'',senha:'',disciplina_id:'',ativo:true,dias:[],turmas:[] },
      turma: { id:null,nome:'',curso:'',quantidade_estudantes:'',turno:'',bloco:'',ano_serie:'',ativo:true },
      disciplina: { id:null,nome:'',eh_curso_tecnico:false,eh_desenvolvimento_sistemas:false },
      laboratorio: { id:null,nome:'',tipo_agendamento:'semanal',capacidade:0,tipo_equipamento:'',exclusivo_curso_tecnico:false,ativo:true },
      prioridade: { id:null,laboratorio_id:'',disciplina_id:'',ordem_prioridade:'',bloqueada:false },
    }
    setEditor({ tipo, modo:'novo', dados:padrao[tipo] })
  }
  function editar(tipo,item) {
    if (tipo === 'professor') {
      setEditor({ tipo, modo:'editar', dados:{ ...item, senha:'', dias:dados.professorDias.filter(x=>x.professor_id===item.id).map(x=>x.dia_semana), turmas:dados.professorTurmas.filter(x=>x.professor_id===item.id).map(x=>x.turma_id) } })
    } else setEditor({ tipo, modo:'editar', dados:{ ...item } })
  }

  async function salvarProfessor(d, modo) {
    if (!d.nome.trim() || !d.login.trim() || !d.disciplina_id) throw new Error('Nome, login e disciplina são obrigatórios.')
    const payload = { nome:d.nome.trim(), login:d.login.trim(), disciplina_id:d.disciplina_id, ativo:Boolean(d.ativo) }
    let professorId = d.id
    if (modo === 'novo') {
      if (!d.senha) throw new Error('Informe uma senha.')
    }
    if (modo === 'novo' || d.senha) {
      const { data:hashData,error:hashError } = await supabase.rpc('gerar_hash_senha',{p_senha:d.senha})
      if (hashError) throw hashError
      payload.senha_hash = hashData
    }
    if (modo === 'novo') {
      const { data,error } = await supabase.from('professores').insert(payload).select('id').single()
      if (error) throw error
      professorId = data.id
    } else {
      const { error } = await supabase.from('professores').update(payload).eq('id',professorId)
      if (error) throw error
    }
    const { error:diasDeleteError } = await supabase.from('professor_dias_aula').delete().eq('professor_id',professorId)
    if (diasDeleteError) throw diasDeleteError
    const dias = [...new Set((d.dias || []).map(Number))].map(dia_semana=>({ professor_id:professorId,dia_semana }))
    if (dias.length) { const {error} = await supabase.from('professor_dias_aula').insert(dias); if (error) throw error }
    const { error:turmasDeleteError } = await supabase.from('professor_turmas').delete().eq('professor_id',professorId)
    if (turmasDeleteError) throw turmasDeleteError
    const vinculos = [...new Set(d.turmas || [])].map(turma_id=>({ professor_id:professorId,turma_id }))
    if (vinculos.length) { const {error} = await supabase.from('professor_turmas').insert(vinculos); if (error) throw error }
  }

  async function salvarEditor(e) {
    e.preventDefault(); if (!editor) return
    setSalvando(true); setErro(''); setSucesso('')
    try {
      const d = editor.dados
      if (editor.tipo === 'professor') await salvarProfessor(d, editor.modo)
      if (editor.tipo === 'turma') {
        const p={nome:d.nome.trim(),curso:vazio(d.curso)?null:d.curso.trim(),quantidade_estudantes:vazio(d.quantidade_estudantes)?null:Number(d.quantidade_estudantes),turno:vazio(d.turno)?null:d.turno,bloco:vazio(d.bloco)?null:d.bloco.trim(),ano_serie:vazio(d.ano_serie)?null:d.ano_serie.trim(),ativo:Boolean(d.ativo)}
        if(!p.nome) throw new Error('Nome da turma é obrigatório.')
        const q=editor.modo==='novo'?supabase.from('turmas').insert(p):supabase.from('turmas').update(p).eq('id',d.id)
        const {error}=await q;if(error)throw error
      }
      if (editor.tipo === 'disciplina') {
        const p={nome:d.nome.trim(),eh_curso_tecnico:Boolean(d.eh_curso_tecnico),eh_desenvolvimento_sistemas:Boolean(d.eh_desenvolvimento_sistemas)}
        if(!p.nome)throw new Error('Nome da disciplina é obrigatório.')
        const q=editor.modo==='novo'?supabase.from('disciplinas').insert(p):supabase.from('disciplinas').update(p).eq('id',d.id)
        const {error}=await q;if(error)throw error
      }
      if (editor.tipo === 'laboratorio') {
        const p={nome:d.nome.trim(),tipo_agendamento:d.tipo_agendamento,capacidade:Number(d.capacidade),tipo_equipamento:d.tipo_equipamento.trim(),exclusivo_curso_tecnico:Boolean(d.exclusivo_curso_tecnico),ativo:Boolean(d.ativo)}
        if(!p.nome||!p.tipo_equipamento||!Number.isFinite(p.capacidade))throw new Error('Preencha nome, equipamento e capacidade.')
        const q=editor.modo==='novo'?supabase.from('laboratorios').insert(p):supabase.from('laboratorios').update(p).eq('id',d.id)
        const {error}=await q;if(error)throw error
      }
      if (editor.tipo === 'prioridade') {
        const p={laboratorio_id:d.laboratorio_id,disciplina_id:d.disciplina_id,ordem_prioridade:vazio(d.ordem_prioridade)?null:Number(d.ordem_prioridade),bloqueada:Boolean(d.bloqueada)}
        if(!p.laboratorio_id||!p.disciplina_id)throw new Error('Selecione laboratório e disciplina.')
        const q=editor.modo==='novo'?supabase.from('prioridades_laboratorio').insert(p):supabase.from('prioridades_laboratorio').update(p).eq('id',d.id)
        const {error}=await q;if(error)throw error
      }
      setEditor(null); setSucesso('Alterações salvas.'); await carregarTudo()
    } catch (e2) { setErro(erroTexto(e2,'Não foi possível salvar.')) }
    finally { setSalvando(false) }
  }

  async function excluir(tabela,id,descricao) {
    if(!window.confirm(`Excluir ${descricao}? Essa ação pode afetar registros relacionados.`))return
    const {error}=await supabase.from(tabela).delete().eq('id',id)
    if(error)setErro(error.message);else{setSucesso('Registro excluído.');await carregarTudo()}
  }
  async function alterarStatusReserva(id,status){
    const {error}=await supabase.from('agendamentos').update({status}).eq('id',id)
    if(error)setErro(error.message);else{setSucesso('Status atualizado.');await carregarTudo()}
  }

  if(!admin) return <Layout><main className="admin-pagina"><section className="admin-acesso-negado"><span className="admin-kicker">Administração</span><h1>Acesso restrito</h1><p>Esta área é exclusiva do usuário administrador.</p><button className="admin-botao principal" onClick={()=>navigate('/home')}>Voltar</button></section></main></Layout>

  return <Layout>
    <main className="admin-pagina">
      <header className="admin-cabecalho"><div><span className="admin-kicker">Administração</span><h1>Central do coordenador</h1><p>Cadastre e organize os dados do LabJá sem precisar ir ao SQL.</p></div><button className="admin-botao secundario" onClick={carregarTudo} disabled={carregando}>{carregando?'Atualizando...':'Atualizar dados'}</button></header>
      <div className="admin-abas">{ABAS.map(([id,label])=><button key={id} className={aba===id?'admin-aba ativo':'admin-aba'} onClick={()=>{setAba(id);setBusca('');setErro('');setSucesso('')}}>{label}</button>)}</div>
      {erro&&<div className="admin-alerta erro">{erro}</div>}{sucesso&&<div className="admin-alerta sucesso">{sucesso}</div>}
      {carregando?<div className="admin-carregando">Carregando dados...</div>:<>
        {aba==='resumo'&&<Resumo dados={dados}/>} 
        {aba!=='resumo'&&<div className="admin-toolbar"><input className="admin-busca" type="search" value={busca} onChange={e=>setBusca(e.target.value)} placeholder={`Buscar em ${ABAS.find(x=>x[0]===aba)?.[1].toLowerCase()||'dados'}...`}/><div className="admin-toolbar-acoes">{['professores','turmas','disciplinas','laboratorios'].includes(aba)&&<button className="admin-botao principal" onClick={()=>novo(aba==='professores'?'professor':aba==='turmas'?'turma':aba==='disciplinas'?'disciplina':'laboratorio')}>+ Novo</button>}{aba==='laboratorios'&&<button className="admin-botao secundario" onClick={()=>novo('prioridade')}>+ Prioridade</button>}</div></div>}
        {aba==='professores'&&<Tabela colunas={['Nome','Login','Disciplina','Dias','Turmas','Ativo','Ações']}>{professores.map(p=><tr key={p.id}><td><strong>{p.nome}</strong></td><td>{p.login}</td><td>{p.disciplinas?.nome||'—'}</td><td>{dados.professorDias.filter(x=>x.professor_id===p.id).map(x=>nomeDia(x.dia_semana).slice(0,3)).join(', ')||'—'}</td><td>{dados.professorTurmas.filter(x=>x.professor_id===p.id).length}</td><td><Pill ativo={p.ativo}/></td><td><Acoes onEdit={()=>editar('professor',p)} onDelete={()=>excluir('professores',p.id,`o professor ${p.nome}`)}/></td></tr>)}</Tabela>}
        {aba==='turmas'&&<Tabela colunas={['Turma','Curso','Alunos','Turno','Bloco','Ano/Série','Ativo','Ações']}>{turmas.map(t=><tr key={t.id}><td><strong>{t.nome}</strong></td><td>{t.curso||'—'}</td><td>{vazio(t.quantidade_estudantes)?'—':t.quantidade_estudantes}</td><td>{t.turno||'—'}</td><td>{t.bloco||'—'}</td><td>{t.ano_serie||'—'}</td><td><Pill ativo={t.ativo}/></td><td><Acoes onEdit={()=>editar('turma',t)} onDelete={()=>excluir('turmas',t.id,`a turma ${t.nome}`)}/></td></tr>)}</Tabela>}
        {aba==='disciplinas'&&<Tabela colunas={['Disciplina','Curso técnico','Desenv. Sistemas','Ações']}>{disciplinas.map(d=><tr key={d.id}><td><strong>{d.nome}</strong></td><td><Pill ativo={d.eh_curso_tecnico}/></td><td><Pill ativo={d.eh_desenvolvimento_sistemas}/></td><td><Acoes onEdit={()=>editar('disciplina',d)} onDelete={()=>excluir('disciplinas',d.id,`a disciplina ${d.nome}`)}/></td></tr>)}</Tabela>}
        {aba==='laboratorios'&&<><Tabela colunas={['Laboratório','Tipo','Capacidade','Equipamento','Técnico exclusivo','Ativo','Ações']}>{laboratorios.map(l=><tr key={l.id}><td><strong>{l.nome}</strong></td><td>{l.tipo_agendamento}</td><td>{l.capacidade}</td><td>{l.tipo_equipamento}</td><td><Pill ativo={l.exclusivo_curso_tecnico}/></td><td><Pill ativo={l.ativo}/></td><td><Acoes onEdit={()=>editar('laboratorio',l)} onDelete={()=>excluir('laboratorios',l.id,`o laboratório ${l.nome}`)}/></td></tr>)}</Tabela><div className="admin-subtitulo">Prioridades e bloqueios</div><Tabela colunas={['Laboratório','Disciplina','Ordem','Bloqueada','Ações']}>{dados.prioridades.map(p=><tr key={p.id}><td>{mapa.laboratorio.get(p.laboratorio_id)?.nome||'—'}</td><td><strong>{p.disciplinas?.nome||'—'}</strong></td><td>{p.ordem_prioridade??'—'}</td><td><Pill ativo={!p.bloqueada}/></td><td><Acoes onEdit={()=>editar('prioridade',p)} onDelete={()=>excluir('prioridades_laboratorio',p.id,`a prioridade de ${p.disciplinas?.nome||'disciplina'}`)}/></td></tr>)}</Tabela></>}
        {aba==='reservas'&&<Tabela colunas={['Período','Dia','Horário','Laboratório','Turma','Professor','Status','Ações']}>{reservas.map(r=>{const h=mapa.horario.get(r.horario_id);return <tr key={r.id}><td>{r.periodo_referencia}</td><td>{h?nomeDia(h.dia_semana):'—'}</td><td>{h?`${h.bloco} · ${h.hora_inicio?.slice(0,5)}–${h.hora_fim?.slice(0,5)}`:'—'}</td><td>{r.laboratorios?.nome||'—'}</td><td>{r.turmas?.nome||'—'}</td><td>{r.professores?.nome||'—'}</td><td><span className={`admin-status admin-status-${r.status}`}>{r.status}</span></td><td className="admin-acoes"><button onClick={()=>alterarStatusReserva(r.id,'confirmado')}>Confirmar</button><button className="perigo" onClick={()=>alterarStatusReserva(r.id,'cancelado')}>Cancelar</button></td></tr>})}</Tabela>}
      </>}
      {editor&&<Editor editor={editor} setEditor={setEditor} salvar={salvarEditor} salvando={salvando} dados={dados}/>} 
    </main>
  </Layout>
}

function Resumo({dados}){
  const confirmadas=dados.reservas.filter(r=>r.status==='confirmado').length
  const pendentes=dados.reservas.filter(r=>r.status==='pendente').length
  return <>
    <section className="admin-cards"><Card titulo="Professores" valor={dados.professores.length} detalhe={`${dados.professores.filter(x=>x.ativo).length} ativos`}/><Card titulo="Turmas" valor={dados.turmas.length} detalhe={`${dados.turmas.filter(x=>x.ativo).length} ativas`}/><Card titulo="Disciplinas" valor={dados.disciplinas.length} detalhe="cadastro"/><Card titulo="Laboratórios" valor={dados.laboratorios.length} detalhe={`${dados.laboratorios.filter(x=>x.ativo).length} ativos`}/><Card titulo="Reservas" valor={dados.reservas.length} detalhe={`${confirmadas} confirmadas · ${pendentes} pendentes`}/></section>
    <section className="admin-bloco admin-resumo-lista"><div className="admin-bloco-topo"><h2>Relacionamentos</h2><span>dados carregados</span></div><div className="admin-mini-lista"><div><strong>Professor ↔ turma</strong><span>{dados.professorTurmas.length} vínculos</span></div><div><strong>Professor ↔ dia</strong><span>{dados.professorDias.length} registros</span></div><div><strong>Prioridades</strong><span>{dados.prioridades.length} configurações</span></div></div></section>
  </>
}
function Card({titulo,valor,detalhe}){return <article className="admin-card"><span>{titulo}</span><strong>{valor}</strong><small>{detalhe}</small></article>}

function Editor({editor,setEditor,salvar,salvando,dados}){
  const d=editor.dados
  const set=(campo,valor)=>setEditor(atual=>({...atual,dados:{...atual.dados,[campo]:valor}}))
  const titulo=editor.modo==='novo'?'Novo':'Editar'
  return <Modal titulo={`${titulo} ${editor.tipo==='professor'?'professor':editor.tipo==='turma'?'turma':editor.tipo==='disciplina'?'disciplina':editor.tipo==='laboratorio'?'laboratório':'prioridade'}`} onClose={()=>setEditor(null)}>
    <form onSubmit={salvar}>
      {editor.tipo==='professor'&&<>
        <div className="admin-form-grid"><Campo label="Nome"><input value={d.nome} onChange={e=>set('nome',e.target.value)} required/></Campo><Campo label="Login"><input value={d.login} onChange={e=>set('login',e.target.value)} required/></Campo><Campo label={editor.modo==='novo'?'Senha':'Nova senha (opcional)'} className="col-span-2"><input type="password" value={d.senha} onChange={e=>set('senha',e.target.value)} placeholder="Senha do professor" autoComplete="new-password" required={editor.modo==='novo'}/><small className="admin-ajuda">A senha é convertida em hash no banco; o hash nunca fica exposto na tela.</small></Campo><Campo label="Disciplina"><select value={d.disciplina_id} onChange={e=>set('disciplina_id',e.target.value)} required><option value="">Selecione</option>{dados.disciplinas.map(x=><option key={x.id} value={x.id}>{x.nome}</option>)}</select></Campo><Campo label="Status"><select value={String(d.ativo)} onChange={e=>set('ativo',e.target.value==='true')}><option value="true">Ativo</option><option value="false">Inativo</option></select></Campo></div>
        <div className="admin-editor-secao"><h3>Dias de aula</h3><div className="admin-checks">{DIAS.map(([id,nome])=><label key={id}><input type="checkbox" checked={(d.dias||[]).includes(id)} onChange={e=>set('dias',e.target.checked?[...(d.dias||[]),id]:(d.dias||[]).filter(x=>x!==id))}/>{nome}</label>)}</div></div>
        <div className="admin-editor-secao"><h3>Turmas vinculadas</h3><div className="admin-checks grade">{dados.turmas.map(t=><label key={t.id}><input type="checkbox" checked={(d.turmas||[]).includes(t.id)} onChange={e=>set('turmas',e.target.checked?[...(d.turmas||[]),t.id]:(d.turmas||[]).filter(x=>x!==t.id))}/>{t.nome}</label>)}</div></div>
      </>}
      {editor.tipo==='turma'&&<div className="admin-form-grid"><Campo label="Nome"><input value={d.nome} onChange={e=>set('nome',e.target.value)} required/></Campo><Campo label="Curso"><input value={d.curso??''} onChange={e=>set('curso',e.target.value)}/></Campo><Campo label="Quantidade de estudantes"><input type="number" min="0" value={d.quantidade_estudantes??''} onChange={e=>set('quantidade_estudantes',e.target.value)}/></Campo><Campo label="Turno"><select value={d.turno??''} onChange={e=>set('turno',e.target.value)}><option value="">Não definido</option><option value="manhã">Manhã</option><option value="tarde">Tarde</option><option value="noite">Noite</option></select></Campo><Campo label="Bloco"><input value={d.bloco??''} onChange={e=>set('bloco',e.target.value)}/></Campo><Campo label="Ano/Série"><input value={d.ano_serie??''} onChange={e=>set('ano_serie',e.target.value)}/></Campo><Campo label="Status"><select value={String(d.ativo)} onChange={e=>set('ativo',e.target.value==='true')}><option value="true">Ativa</option><option value="false">Inativa</option></select></Campo></div>}
      {editor.tipo==='disciplina'&&<div className="admin-form-grid"><Campo label="Nome"><input value={d.nome} onChange={e=>set('nome',e.target.value)} required/></Campo><div/><label className="admin-check"><input type="checkbox" checked={Boolean(d.eh_curso_tecnico)} onChange={e=>set('eh_curso_tecnico',e.target.checked)}/>É curso técnico?</label><label className="admin-check"><input type="checkbox" checked={Boolean(d.eh_desenvolvimento_sistemas)} onChange={e=>set('eh_desenvolvimento_sistemas',e.target.checked)}/>É Desenvolvimento de Sistemas?</label></div>}
      {editor.tipo==='laboratorio'&&<div className="admin-form-grid"><Campo label="Nome"><input value={d.nome} onChange={e=>set('nome',e.target.value)} required/></Campo><Campo label="Tipo de agendamento"><select value={d.tipo_agendamento} onChange={e=>set('tipo_agendamento',e.target.value)}><option value="semanal">Semanal</option><option value="quinzenal">Quinzenal</option></select></Campo><Campo label="Capacidade"><input type="number" min="0" value={d.capacidade} onChange={e=>set('capacidade',e.target.value)} required/></Campo><Campo label="Tipo de equipamento"><input value={d.tipo_equipamento} onChange={e=>set('tipo_equipamento',e.target.value)} required/></Campo><label className="admin-check"><input type="checkbox" checked={Boolean(d.exclusivo_curso_tecnico)} onChange={e=>set('exclusivo_curso_tecnico',e.target.checked)}/>Exclusivo para curso técnico</label><label className="admin-check"><input type="checkbox" checked={Boolean(d.ativo)} onChange={e=>set('ativo',e.target.checked)}/>Ativo</label></div>}
      {editor.tipo==='prioridade'&&<div className="admin-form-grid"><Campo label="Laboratório"><select value={d.laboratorio_id} onChange={e=>set('laboratorio_id',e.target.value)} required><option value="">Selecione</option>{dados.laboratorios.map(l=><option key={l.id} value={l.id}>{l.nome}</option>)}</select></Campo><Campo label="Disciplina"><select value={d.disciplina_id} onChange={e=>set('disciplina_id',e.target.value)} required><option value="">Selecione</option>{dados.disciplinas.map(x=><option key={x.id} value={x.id}>{x.nome}</option>)}</select></Campo><Campo label="Ordem"><input type="number" min="1" value={d.ordem_prioridade??''} onChange={e=>set('ordem_prioridade',e.target.value)}/></Campo><label className="admin-check"><input type="checkbox" checked={Boolean(d.bloqueada)} onChange={e=>set('bloqueada',e.target.checked)}/>Bloqueada</label></div>}
      <div className="admin-modal-acoes"><button type="button" className="admin-botao secundario" onClick={()=>setEditor(null)}>Cancelar</button><button type="submit" className="admin-botao principal" disabled={salvando}>{salvando?'Salvando...':'Salvar'}</button></div>
    </form>
  </Modal>
}
