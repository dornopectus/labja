import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { iconePorEquipamento } from '../components/icons'
import { supabase } from '../lib/supabaseClient'
import './Dashboard.css'

export default function Dashboard() {
  const [laboratorios, setLaboratorios] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    async function carregarLaboratorios() {
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

    carregarLaboratorios()
  }, [])

  return (
    <Layout>
      <div className="dash-topo">
        <h1 className="dash-titulo">Painel</h1>
        <p className="dash-subtitulo">Visão geral dos laboratórios</p>
      </div>

      <div className="dash-conteudo">
        {carregando && <p className="dash-mensagem">Carregando laboratórios...</p>}
        {erro && <p className="dash-erro">{erro}</p>}

        {!carregando && !erro && (
          <div className="dash-grid">
            {laboratorios.map((lab) => {
              const Icone = iconePorEquipamento(lab.tipo_equipamento)
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

                  <dl className="dash-card-detalhes">
                    <div className="dash-card-linha">
                      <dt>Agendamento</dt>
                      <dd>
                        <span
                          className={
                            'dash-tipo-pill ' +
                            (lab.tipo_agendamento === 'semanal'
                              ? 'dash-tipo-semanal'
                              : 'dash-tipo-quinzenal')
                          }
                        >
                          {lab.tipo_agendamento === 'semanal' ? 'Semanal' : 'Quinzenal'}
                        </span>
                      </dd>
                    </div>
                    <div className="dash-card-linha">
                      <dt>Capacidade</dt>
                      <dd>{lab.capacidade} equip.</dd>
                    </div>
                    <div className="dash-card-linha">
                      <dt>Equipamento</dt>
                      <dd style={{ textTransform: 'capitalize' }}>{lab.tipo_equipamento}</dd>
                    </div>
                  </dl>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}
