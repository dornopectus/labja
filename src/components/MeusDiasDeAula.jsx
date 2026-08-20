import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { getProfessorLogado } from '../lib/auth'

const DIAS = [
  { valor: 1, label: 'Seg' },
  { valor: 2, label: 'Ter' },
  { valor: 3, label: 'Qua' },
  { valor: 4, label: 'Qui' },
  { valor: 5, label: 'Sex' },
]

export default function MeusDiasDeAula() {
  const professor = getProfessorLogado()
  const [selecionados, setSelecionados] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)

  useEffect(() => {
    async function carregar() {
      if (!professor?.id) return
      const { data } = await supabase
        .from('professor_dias_aula')
        .select('dia_semana')
        .eq('professor_id', professor.id)

      setSelecionados((data || []).map((d) => d.dia_semana))
      setCarregando(false)
    }

    carregar()
  }, [professor?.id])

  function alternar(dia) {
    setSalvo(false)
    setSelecionados((atual) =>
      atual.includes(dia) ? atual.filter((d) => d !== dia) : [...atual, dia]
    )
  }

  async function salvar() {
    if (!professor?.id) return
    setSalvando(true)

    await supabase.from('professor_dias_aula').delete().eq('professor_id', professor.id)

    if (selecionados.length > 0) {
      await supabase
        .from('professor_dias_aula')
        .insert(selecionados.map((dia_semana) => ({ professor_id: professor.id, dia_semana })))
    }

    setSalvando(false)
    setSalvo(true)
  }

  if (carregando) return null

  return (
    <div className="dias-aula-card">
      <span className="dias-aula-label">Meus dias de aula:</span>
      {DIAS.map(({ valor, label }) => (
        <button
          key={valor}
          type="button"
          className={'dias-aula-chip' + (selecionados.includes(valor) ? ' dias-aula-chip-ativo' : '')}
          onClick={() => alternar(valor)}
        >
          {label}
        </button>
      ))}
      {salvo && <span className="dias-aula-status">Salvo ✓</span>}
      <button className="dias-aula-salvar" onClick={salvar} disabled={salvando}>
        {salvando ? 'Salvando...' : 'Salvar'}
      </button>
    </div>
  )
}
