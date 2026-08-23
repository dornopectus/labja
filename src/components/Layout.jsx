import { useNavigate } from 'react-router-dom'
import { IconLogout } from './icons'
import { getProfessorLogado, logout } from '../lib/auth'
import './Layout.css'

export default function Layout({ children }) {
  const navigate = useNavigate()
  const professor = getProfessorLogado()

  function handleSair() {
    logout()
    navigate('/')
  }

  return (
    <div className="layout">
      <aside className="layout-sidebar">
        <div className="layout-marca">
          <img
            className="layout-marca-logo"
            src="/logo-full.png"
            alt="LabJá"
          />
        </div>

        {professor && (
          <div className="layout-usuario">
            <div className="layout-usuario-avatar">{professor.nome?.[0] ?? '?'}</div>
            <div>
              <p className="layout-usuario-nome">{professor.nome}</p>
              <p className="layout-usuario-materia">{professor.materia}</p>
            </div>
          </div>
        )}

        <div className="layout-nav" />

        <button className="layout-sair" onClick={handleSair}>
          <IconLogout size={19} />
          <span>Sair</span>
        </button>
      </aside>

      <div className="layout-conteudo">{children}</div>
    </div>
  )
}
