import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Home from './pages/Home'
import Admin from './pages/Admin'
import RotaProtegida from './components/RotaProtegida'
import RotaAdmin from './components/RotaAdmin'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/home"
          element={
            <RotaProtegida>
              <Home />
            </RotaProtegida>
          }
        />
        <Route
          path="/admin"
          element={
            <RotaAdmin>
              <Admin />
            </RotaAdmin>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
