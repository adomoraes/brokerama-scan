import { BrowserRouter, Routes, Route } from "react-router-dom"
import { HomePage } from "./pages/HomePage"
import { LoginPage } from "./pages/LoginPage"
import { RegisterPage } from "./pages/RegisterPage"
// 1. Importar os novos componentes (ajustado para default import)
import DashboardPage from "./pages/DashboardPage"
import { ProtectedRoute } from "./components/ProtectedRoute"

function App() {
	return (
		<BrowserRouter>
			<div className='bg-gray-900 text-white min-h-screen'>
				<Routes>
					{/* Rotas Públicas */}
					<Route path='/' element={<HomePage />} />
					<Route path='/login' element={<LoginPage />} />
					<Route path='/register' element={<RegisterPage />} />

					{/* Rota Protegida */}
					<Route
						path='/dashboard'
						element={
							// 2. Envolver a página do dashboard com o nosso componente de proteção
							<ProtectedRoute>
								<DashboardPage />
							</ProtectedRoute>
						}
					/>
				</Routes>
			</div>
		</BrowserRouter>
	)
}

export default App
