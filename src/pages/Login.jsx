import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { setProfessorLogado } from '../lib/auth'
import './Login.css'

export default function Login() {
  const navigate = useNavigate()
  const [login, setLogin] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')

    if (!login.includes('@escola')) {
      setErro('Login deve estar no formato usuario@escola')
      return
    }

    setCarregando(true)
    try {
      const { data, error } = await supabase
        .from('professores')
        .select('id, nome, materia, curso_tecnico')
        .eq('login', login)
        .single()

      if (error || !data) {
        setErro('Login ou senha inválidos')
        return
      }

      // TODO: validar senha_hash via função RPC segura no Supabase
      // em vez de comparar no cliente.

      setProfessorLogado(data)
      navigate('/dashboard')
    } catch (err) {
      setErro('Erro ao conectar. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="login-pagina">
      <div className="login-lado-marca">
        <div className="login-lado-marca-topo">
          <span className="login-lado-marca-quadrado">L</span>
          <span className="login-lado-marca-nome">LabJá</span>
        </div>

        <p className="login-lado-marca-frase">
          Gestão dos laboratórios do Colégio Suplicy, num só lugar.
        </p>

        <ul className="login-lado-marca-lista">
          <li>5 laboratórios: desktops, notebooks, Chromebooks e tablets</li>
          <li>Agendamento semanal e quinzenal por prioridade</li>
          <li>Controle de equipamentos e ocorrências</li>
        </ul>
      </div>

      <div className="login-lado-form">
        <div className="login-form-caixa">
          <h1 className="login-form-titulo">Entrar</h1>
          <p className="login-form-subtitulo">Acesse com seu login institucional.</p>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-campo">
              <label htmlFor="login">Login</label>
              <input
                id="login"
                type="text"
                placeholder="usuario@escola"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div className="login-campo">
              <label htmlFor="senha">Senha (CPF)</label>
              <input
                id="senha"
                type="password"
                placeholder="Somente números"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            {erro && <p className="login-erro">{erro}</p>}

            <button type="submit" className="login-botao" disabled={carregando}>
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
