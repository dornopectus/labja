import { NavLink, useNavigate } from 'react-router-dom'
import { IconGrid, IconCalendar, IconBuilding, IconLogout } from './icons'
import { getProfessorLogado, logout } from '../lib/auth'
import './Layout.css'

const itensNav = [
  { to: '/dashboard', label: 'Painel', Icon: IconGrid },
  { to: '/agenda', label: 'Agenda', Icon: IconCalendar },
  { to: '/laboratorios', label: 'Laboratórios', Icon: IconBuilding },
]

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
          <span className="layout-marca-quadrado">L</span>
          <span className="layout-marca-nome">LabJá</span>
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
          {itensNav.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                'layout-nav-item' + (isActive ? ' layout-nav-item-ativo' : '')
              }
            >
              <Icon size={19} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <button className="layout-sair" onClick={handleSair}>
          <IconLogout size={19} />
          <span>Sair</span>
        </button>
      </aside>

      <div className="layout-conteudo">{children}</div>

      <nav className="layout-nav-mobile">
        {itensNav.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              'layout-nav-mobile-item' + (isActive ? ' layout-nav-mobile-item-ativo' : '')
            }
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
