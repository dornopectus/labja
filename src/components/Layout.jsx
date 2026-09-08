import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { IconGrid, IconLogout } from './icons'
import { getProfessorLogado, logout } from '../lib/auth'
import './Layout.css'

export default function Layout({ children }) {
  const navigate = useNavigate()
  const professor = getProfessorLogado()
  const location = useLocation()
  const ehAdmin = Boolean(
    professor?.eh_admin || professor?.is_admin || professor?.administrador ||
      ['admin', 'administrador', 'coordenador'].includes(String(professor?.perfil ?? '').toLowerCase()) ||
      ['admin', 'administrador', 'coordenador'].includes(String(professor?.role ?? '').toLowerCase()) ||
      ['admin', 'administrador', 'coordenador'].includes(String(professor?.tipo_usuario ?? '').toLowerCase())
  )

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

        <nav className="layout-nav">
          <NavLink className={({ isActive }) => 'layout-nav-item' + (isActive ? ' layout-nav-item-ativo' : '')} to="/home">
            <IconGrid size={19} />
            <span>Agenda</span>
          </NavLink>
          {ehAdmin && (
            <NavLink className={({ isActive }) => 'layout-nav-item' + (isActive ? ' layout-nav-item-ativo' : '')} to="/admin">
              <span className="layout-nav-item-dot">●</span>
              <span>Administração</span>
            </NavLink>
          )}
        </nav>

        <button className="layout-sair" onClick={handleSair}>
          <IconLogout size={19} />
          <span>Sair</span>
        </button>
      </aside>

      <div className="layout-conteudo">{children}</div>
    </div>
  )
}
