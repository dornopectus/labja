const CHAVE = 'labja_usuario'
const CHAVE_ANTIGA = 'labja_professor'

export function setProfessorLogado(usuario) {
  localStorage.setItem(CHAVE, JSON.stringify(usuario))
  localStorage.removeItem(CHAVE_ANTIGA)
}

export function getProfessorLogado() {
  const bruto = localStorage.getItem(CHAVE) || localStorage.getItem(CHAVE_ANTIGA)
  if (!bruto) return null

  try {
    return JSON.parse(bruto)
  } catch {
    localStorage.removeItem(CHAVE)
    localStorage.removeItem(CHAVE_ANTIGA)
    return null
  }
}

export function logout() {
  localStorage.removeItem(CHAVE)
  localStorage.removeItem(CHAVE_ANTIGA)
}
