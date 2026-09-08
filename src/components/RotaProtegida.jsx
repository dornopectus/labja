import { Navigate } from 'react-router-dom'
import { getProfessorLogado } from '../lib/auth'

export default function RotaProtegida({ children, tipoUsuario }) {
  const usuario = getProfessorLogado()

  if (!usuario) {
    return <Navigate to="/" replace />
  }

  if (tipoUsuario && usuario.tipo_usuario !== tipoUsuario) {
    return <Navigate to={usuario.tipo_usuario === 'admin' ? '/admin' : '/home'} replace />
  }

  return children
}
