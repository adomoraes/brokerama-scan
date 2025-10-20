// frontend/src/App.tsx
import { useState, useEffect } from "react"

function App() {
	// Estado para guardar a mensagem vinda da nossa API
	const [apiStatus, setApiStatus] = useState("Conectando...")

	// O useEffect executa este código uma vez, quando o componente é montado
	useEffect(() => {
		// Faz a chamada para a nossa rota de "saúde" no backend
		fetch("http://localhost:3001/api/health")
			.then((response) => response.json())
			.then((data) => setApiStatus(data.status))
			.catch(() => setApiStatus("Erro: Não foi possível conectar à API"))
	}, []) // O array vazio garante que isto só executa uma vez

	return (
		// Estas classes (className) são do Tailwind CSS!
		<div className='bg-gray-900 min-h-screen flex flex-col items-center justify-center text-white p-4'>
			<div className='text-center'>
				<h1 className='text-5xl md:text-6xl font-bold mb-4'>Brokerama Scan</h1>
				<p className='text-xl text-gray-400'>
					O seu scanner de oportunidades de mercado.
				</p>
			</div>
			<div className='mt-8 bg-gray-800 p-4 rounded-lg shadow-lg'>
				<p>
					Status da API:
					<span className='font-bold text-green-400 ml-2'>{apiStatus}</span>
				</p>
			</div>
		</div>
	)
}

export default App
