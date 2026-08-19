import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { iconePorEquipamento } from '../components/icons'
import { supabase } from '../lib/supabaseClient'
import './Dashboard.css'
import './Laboratorios.css'

export default function Laboratorios() {
  const [laboratorios, setLaboratorios] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [editandoId, setEditandoId] = useState(null)
  const [formCapacidade, setFormCapacidade] = useState(0)
  const [formAtivo, setFormAtivo] = useState(true)
  const [salvando, setSalvando] = useState(false)

  async function carregar() {
    const { data, error } = await supabase
      .from('laboratorios')
      .select('id, nome, tipo_agendamento, capacidade, tipo_equipamento, ativo')
      .order('nome')

    if (error) {
      setErro('Não foi possível carregar os laboratórios.')
    } else {
      setLaboratorios(data || [])
    }
    setCarregando(false)
  }

  useEffect(() => {
    carregar()
  }, [])

  function abrirEdicao(lab) {
    setEditandoId(lab.id)
    setFormCapacidade(lab.capacidade)
    setFormAtivo(lab.ativo)
  }

  async function salvar(id) {
    setSalvando(true)
    const { error } = await supabase
      .from('laboratorios')
      .update({ capacidade: formCapacidade, ativo: formAtivo })
      .eq('id', id)

    setSalvando(false)

    if (error) {
      window.alert('Não foi possível salvar: ' + error.message)
      return
    }

    setEditandoId(null)
    carregar()
  }

  return (
    <Layout>
      <div className="dash-topo">
        <h1 className="dash-titulo">Laboratórios</h1>
        <p className="dash-subtitulo">Cadastro e configuração dos laboratórios</p>
      </div>

      <div className="dash-conteudo">
        {carregando && <p className="dash-mensagem">Carregando laboratórios...</p>}
        {erro && <p className="dash-erro">{erro}</p>}

        {!carregando && !erro && (
          <div className="dash-grid">
            {laboratorios.map((lab) => {
              const Icone = iconePorEquipamento(lab.tipo_equipamento)
              const emEdicao = editandoId === lab.id

              return (
                <div key={lab.id} className="dash-card">
                  <div className="dash-card-topo">
                    <div className="dash-card-icone">
                      <Icone size={20} />
                    </div>
                    <span
                      className={
                        'dash-badge ' + (lab.ativo ? 'dash-badge-ativo' : 'dash-badge-inativo')
                      }
                    >
                      {lab.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>

                  <h2 className="dash-card-nome">{lab.nome}</h2>

                  {!emEdicao ? (
                    <>
                      <dl className="dash-card-detalhes">
                        <div className="dash-card-linha">
                          <dt>Agendamento</dt>
                          <dd>{lab.tipo_agendamento === 'semanal' ? 'Semanal' : 'Quinzenal'}</dd>
                        </div>
                        <div className="dash-card-linha">
                          <dt>Capacidade</dt>
                          <dd>{lab.capacidade} equip.</dd>
                        </div>
                      </dl>
                      <button className="lab-card-editar" onClick={() => abrirEdicao(lab)}>
                        Editar
                      </button>
                    </>
                  ) : (
                    <div className="lab-form">
                      <div className="lab-form-linha">
                        <span>Capacidade</span>
                        <input
                          type="number"
                          min="1"
                          value={formCapacidade}
                          onChange={(e) => setFormCapacidade(Number(e.target.value))}
                        />
                      </div>
                      <div className="lab-form-linha">
                        <span>Ativo</span>
                        <label className="toggle">
                          <input
                            type="checkbox"
                            checked={formAtivo}
                            onChange={(e) => setFormAtivo(e.target.checked)}
                          />
                          <span className="toggle-trilho"></span>
                        </label>
                      </div>
                      <div className="lab-form-acoes">
                        <button
                          className="lab-form-salvar"
                          onClick={() => salvar(lab.id)}
                          disabled={salvando}
                        >
                          {salvando ? 'Salvando...' : 'Salvar'}
                        </button>
                        <button className="lab-form-cancelar" onClick={() => setEditandoId(null)}>
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}
