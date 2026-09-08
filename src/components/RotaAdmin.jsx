import { Navigate } from 'react-router-dom'
import { getProfessorLogado } from '../lib/auth'

export default function RotaAdmin({ children }) {
  const professor = getProfessorLogado()

  if (!professor) return <Navigate to="/" replace />
  if (!professor.eh_admin) return <Navigate to="/home" replace />

  return children
}
