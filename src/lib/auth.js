const CHAVE = 'labja_professor'

export function setProfessorLogado(professor) {
  localStorage.setItem(CHAVE, JSON.stringify(professor))
}

export function getProfessorLogado() {
  const bruto = localStorage.getItem(CHAVE)
  if (!bruto) return null
  try {
    return JSON.parse(bruto)
  } catch {
    localStorage.removeItem(CHAVE)
    return null
  }
}

export function isAdmin() {
  return getProfessorLogado()?.eh_admin === true
}

export function logout() {
  localStorage.removeItem(CHAVE)
}
