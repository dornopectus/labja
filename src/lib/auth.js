const CHAVE = 'labja_professor'

export function setProfessorLogado(professor) {
  localStorage.setItem(CHAVE, JSON.stringify(professor))
}

export function getProfessorLogado() {
  const bruto = localStorage.getItem(CHAVE)
  return bruto ? JSON.parse(bruto) : null
}

export function logout() {
  localStorage.removeItem(CHAVE)
}
