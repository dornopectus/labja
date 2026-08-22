// ============================================================
// Motor de distribuição automática semanal — LabJá
//
// Roda a distribuição das turmas nos laboratórios para a semana
// atual, seguindo as regras obrigatórias e a pontuação definidas
// no documento oficial (seção 11).
//
// Uso:
//   node scripts/distribuir-semana.mjs
//
// Requer no .env (na raiz do projeto):
//   VITE_SUPABASE_URL=...
//   SUPABASE_SERVICE_ROLE_KEY=...   (pegue em Settings > API > service_role)
//
// Importante: a service_role key ignora RLS e tem acesso total ao
// banco. Nunca coloque ela no código do site (front-end) — só usar
// aqui, em script rodado localmente pelo coordenador.
// ============================================================

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Faltam VITE_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY no .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

// ---- período de referência (mesma regra do site: reset sexta 18h) ----
function periodoSemanalAtual(agora = new Date()) {
  const d = new Date(agora)
  const diaSemana = d.getDay()
  const horaAtual = d.getHours()
  const jaResetou = diaSemana > 5 || (diaSemana === 5 && horaAtual >= 18)

  let deslocamento
  if (diaSemana === 0) {
    deslocamento = jaResetou ? 1 : -6
  } else {
    deslocamento = 1 - diaSemana
  }

  const segunda = new Date(d)
  segunda.setDate(d.getDate() + deslocamento + (jaResetou && diaSemana !== 0 ? 7 : 0))
  segunda.setHours(0, 0, 0, 0)
  return segunda.toISOString().slice(0, 10)
}

const ehCursoTecnico = (curso) => /t[ée]cnic/i.test(curso || '')

async function main() {
  const periodoReferencia = periodoSemanalAtual()
  console.log(`\n📅 Rodando distribuição para a semana de referência: ${periodoReferencia}\n`)

  const [
    { data: turmas },
    { data: aulas },
    { data: laboratorios },
    { data: prioridades },
    { data: agendamentosExistentes },
  ] = await Promise.all([
    supabase.from('turmas').select('*'),
    supabase.from('aulas').select('*, horarios(*)'),
    supabase.from('laboratorios').select('*').eq('ativo', true),
    supabase.from('prioridades_laboratorio').select('*'),
    supabase.from('agendamentos').select('*').eq('periodo_referencia', periodoReferencia).eq('status', 'confirmado'),
  ])

  // Limpa reservas automáticas anteriores dessa semana, pra permitir
  // rodar o script de novo sem duplicar (reservas manuais não são tocadas).
  await supabase
    .from('agendamentos')
    .delete()
    .eq('periodo_referencia', periodoReferencia)
    .eq('automatico', true)

  const ocupacaoInicial = (agendamentosExistentes || []).filter((a) => !a.automatico)
  const slotsOcupados = new Set(ocupacaoInicial.map((a) => `${a.laboratorio_id}|${a.horario_id}`))
  const turmasJaContempladas = new Set(ocupacaoInicial.filter((a) => a.turma_id).map((a) => a.turma_id))

  // Monta a lista de candidatos (turma × aula × laboratório) com pontuação
  const candidatos = []

  for (const turma of turmas || []) {
    if (turmasJaContempladas.has(turma.id)) continue

    const aulasDaTurma = (aulas || []).filter((a) => a.turma_id === turma.id)

    for (const aula of aulasDaTurma) {
      for (const lab of laboratorios || []) {
        // Regra obrigatória: Lab exclusivo do curso técnico
        if (lab.exclusivo_curso_tecnico && !ehCursoTecnico(turma.curso)) continue

        const prioridade = (prioridades || []).find(
          (p) => p.laboratorio_id === lab.id && p.materia.toLowerCase() === aula.disciplina.toLowerCase()
        )

        // Regra obrigatória: disciplina bloqueada nesse laboratório
        if (prioridade?.bloqueada) continue

        // Regra obrigatória: capacidade compatível
        if (turma.quantidade_estudantes > lab.capacidade) continue

        const chaveSlot = `${lab.id}|${aula.horario_id}`
        if (slotsOcupados.has(chaveSlot)) continue

        let pontuacao = 0
        pontuacao += prioridade?.ordem_prioridade != null ? 20 : -5
        if (lab.localizacao_bloco) {
          pontuacao += turma.bloco === lab.localizacao_bloco ? 15 : -10
        }
        if (/chromebook/i.test(lab.nome) && /programa[çc][ãa]o|pensamento computacional/i.test(aula.disciplina)) {
          pontuacao += 20
        }
        if (/notebook/i.test(lab.nome) && /desenvolvimento de sistemas/i.test(aula.disciplina)) {
          pontuacao += 25
        }
        pontuacao += 30 // turma ainda não contemplada na semana
        pontuacao += 10 // quantidade de equipamentos adequada (já checado acima)

        candidatos.push({ turma, aula, lab, pontuacao })
      }
    }
  }

  candidatos.sort((a, b) => b.pontuacao - a.pontuacao)

  const contempladas = new Set()
  const novasReservas = []

  for (const c of candidatos) {
    if (contempladas.has(c.turma.id)) continue
    const chaveSlot = `${c.lab.id}|${c.aula.horario_id}`
    if (slotsOcupados.has(chaveSlot)) continue

    slotsOcupados.add(chaveSlot)
    contempladas.add(c.turma.id)

    novasReservas.push({
      laboratorio_id: c.lab.id,
      professor_id: c.aula.professor_id,
      horario_id: c.aula.horario_id,
      turma_id: c.turma.id,
      turma: c.turma.nome,
      periodo_referencia: periodoReferencia,
      status: 'confirmado',
      automatico: true,
    })
  }

  if (novasReservas.length > 0) {
    const { error } = await supabase.from('agendamentos').insert(novasReservas)
    if (error) {
      console.error('Erro ao inserir reservas:', error.message)
      process.exit(1)
    }
  }

  const totalTurmas = (turmas || []).length
  const naoContempladas = (turmas || []).filter(
    (t) => !turmasJaContempladas.has(t.id) && !contempladas.has(t.id)
  )

  console.log(`✅ ${contempladas.size} turma(s) contemplada(s) automaticamente nesta rodada`)
  console.log(`📌 ${turmasJaContempladas.size} turma(s) já tinham reserva manual nesta semana`)
  if (naoContempladas.length > 0) {
    console.log(`\n⚠️  ${naoContempladas.length} turma(s) NÃO contempladas (sem candidato válido):`)
    naoContempladas.forEach((t) => console.log(`   - ${t.nome}`))
  } else {
    console.log(`\n🎉 Todas as ${totalTurmas} turmas foram contempladas.`)
  }
  console.log('')
}

main()
