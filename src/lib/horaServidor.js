import { supabase } from './supabaseClient'

let offsetMs = 0
let sincronizado = false

/**
 * Busca a hora atual do servidor Supabase uma vez e calcula a
 * diferença em relação ao relógio local do dispositivo. Depois
 * disso, agoraSincronizado() já compensa essa diferença.
 *
 * Importante para quem acessa de celular/computador pessoal: o
 * relógio do aparelho pode estar errado (fuso trocado, hora manual
 * incorreta), o que faria o site calcular a semana/período errados.
 */
export async function sincronizarHoraServidor() {
  if (sincronizado) return offsetMs

  try {
    const inicio = Date.now()
    const { data, error } = await supabase.rpc('hora_atual_servidor')
    const fim = Date.now()

    if (!error && data) {
      const latenciaEstimada = (fim - inicio) / 2
      const horaServidorMs = new Date(data).getTime() + latenciaEstimada
      offsetMs = horaServidorMs - fim
    }
  } catch {
    // Se falhar, segue usando o relógio local (offset 0) em vez de travar o app.
    offsetMs = 0
  }

  sincronizado = true
  return offsetMs
}

/**
 * Retorna a data/hora atual já corrigida pela diferença com o
 * servidor. Use no lugar de `new Date()` em qualquer cálculo de
 * período/semana atual.
 */
export function agoraSincronizado() {
  return new Date(Date.now() + offsetMs)
}
