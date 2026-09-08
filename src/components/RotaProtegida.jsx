import { Navigate } from 'react-router-dom'
import { getProfessorLogado } from '../lib/auth'

export default function RotaProtegida({ children }) {
  const professor = getProfessorLogado()

  if (!professor) {
    return <Navigate to="/" replace />
  }

  return children
}
