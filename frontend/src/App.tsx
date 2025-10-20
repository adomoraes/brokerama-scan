// frontend/src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { HomePage } from "./pages/HomePage"
import { LoginPage } from "./pages/LoginPage"
import { RegisterPage } from "./pages/RegisterPage"

function App() {
	return (
		// O BrowserRouter ativa o roteamento na nossa aplicação
		<BrowserRouter>
			{/* O container principal com um fundo escuro para toda a aplicação */}
			<div className='bg-gray-900 text-white min-h-screen'>
				{/* O Routes é o container onde as nossas rotas serão definidas */}
				<Routes>
					{/* Cada Route define uma correspondência entre um caminho (path) e um componente a ser renderizado */}
					<Route path='/' element={<HomePage />} />
					<Route path='/login' element={<LoginPage />} />
					<Route path='/register' element={<RegisterPage />} />
					{/* Futuramente, teremos aqui a rota protegida para o dashboard */}
				</Routes>
			</div>
		</BrowserRouter>
	)
}

export default App
