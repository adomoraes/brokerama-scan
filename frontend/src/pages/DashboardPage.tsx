import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { AddScannerForm } from "../components/AddScannerForm"

// Definimos a interface no topo para ser usada em todo o componente
interface Scanner {
	id: number
	assetTicker: string
	conditionType: string
	value: number
	createdAt: string // Adicionar para consistência
}

export const DashboardPage = () => {
	const navigate = useNavigate()
	const [scanners, setScanners] = useState<Scanner[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState("")
	const [showForm, setShowForm] = useState(false)

	const handleLogout = () => {
		localStorage.removeItem("brokerama_token")
		localStorage.removeItem("brokerama_user")
		navigate("/login")
	}

	// ESTA É A FUNÇÃO CRÍTICA
	// Ela recebe o novo scanner do formulário e atualiza o estado.
	const handleScannerCreated = (newScanner: Scanner) => {
		// A forma correta de atualizar um array no estado do React:
		// Criar um novo array contendo o novo item e espalhando os itens antigos.
		// Isso garante que o React detete a mudança e redesenhe a lista.
		setScanners((currentScanners) => [newScanner, ...currentScanners])

		// Esconde o formulário após a criação bem-sucedida
		setShowForm(false)
	}

	// Busca os scanners iniciais ao carregar a página
	useEffect(() => {
		const fetchScanners = async () => {
			const token = localStorage.getItem("brokerama_token")
			if (!token) {
				handleLogout()
				return
			}

			try {
				const response = await fetch("http://localhost:3001/api/scanners", {
					headers: { Authorization: `Bearer ${token}` },
				})

				if (!response.ok) {
					throw new Error(
						"Falha ao carregar scanners. Tente fazer login novamente."
					)
				}
				const data: Scanner[] = await response.json()
				setScanners(data)
			} catch (err: any) {
				setError(err.message)
			} finally {
				setLoading(false)
			}
		}

		fetchScanners()
	}, [])

	return (
		<div className='container mx-auto p-4 md:p-8'>
			<header className='flex justify-between items-center mb-8'>
				<h1 className='text-4xl font-bold'>Meu Dashboard</h1>
				<button
					onClick={handleLogout}
					className='bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors'>
					Logout
				</button>
			</header>

			<div className='mb-8'>
				{!showForm && (
					<button
						onClick={() => setShowForm(true)}
						className='bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors'>
						+ Criar Novo Scanner
					</button>
				)}
				{showForm && (
					<AddScannerForm
						onScannerCreated={handleScannerCreated}
						onCancel={() => setShowForm(false)}
					/>
				)}
			</div>

			<div className='bg-gray-800 p-6 rounded-lg shadow-lg'>
				<h2 className='text-2xl font-semibold mb-4'>Meus Scanners</h2>
				{loading && <p>A carregar scanners...</p>}
				{error && <p className='text-red-500'>{error}</p>}
				{!loading && !error && scanners.length === 0 && (
					<p className='text-gray-400'>Você ainda não criou nenhum scanner.</p>
				)}
				<div className='space-y-4'>
					{scanners.map((scanner) => (
						<div
							key={scanner.id}
							className='bg-gray-700 p-4 rounded-md flex justify-between items-center'>
							<div>
								<span className='font-bold text-lg'>{scanner.assetTicker}</span>
								<p className='text-sm text-gray-300'>
									{scanner.conditionType}: {scanner.value}
								</p>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	)
}
