const CHAVE = 'labja_professor'

export function setProfessorLogado(professor) {
  sessionStorage.setItem(CHAVE, JSON.stringify(professor))
}

export function getProfessorLogado() {
  const bruto = sessionStorage.getItem(CHAVE)
  return bruto ? JSON.parse(bruto) : null
}

export function logout() {
  sessionStorage.removeItem(CHAVE)
}
