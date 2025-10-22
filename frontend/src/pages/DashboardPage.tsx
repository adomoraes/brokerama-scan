import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { AddScannerForm } from "../components/AddScannerForm"

// Definimos a interface no topo para ser usada em todo o componente
interface Scanner {
	isActive: any
	id: number
	assetTicker: string
	conditionType: string
	value: number
	createdAt: string // Adicionar para consistência
}

interface Alert {
	id: number
	message: string
	triggeredAt: string // A data virá como string
	scanner: {
		assetTicker: string
	}
}

export const DashboardPage = () => {
	const navigate = useNavigate()
	const [scanners, setScanners] = useState<Scanner[]>([])
	const [alerts, setAlerts] = useState<Alert[]>([]) // 2. NOVO ESTADO para alertas
	const [loadingScanners, setLoadingScanners] = useState(true)
	const [loadingAlerts, setLoadingAlerts] = useState(true) // 3. NOVO ESTADO de loading
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

	// useEffect para buscar TODOS os dados ao carregar a página
	useEffect(() => {
		const token = localStorage.getItem("brokerama_token")
		if (!token) {
			handleLogout()
			return
		}

		const fetchAllData = async () => {
			try {
				// 4. Buscar Scanners e Alertas em paralelo para mais eficiência
				const [scannersRes, alertsRes] = await Promise.all([
					fetch("http://localhost:3001/api/scanners", {
						headers: { Authorization: `Bearer ${token}` },
					}),
					fetch("http://localhost:3001/api/alerts", {
						headers: { Authorization: `Bearer ${token}` },
					}),
				])

				if (!scannersRes.ok || !alertsRes.ok) {
					throw new Error(
						"Falha ao carregar dados. Tente fazer login novamente."
					)
				}

				const scannersData: Scanner[] = await scannersRes.json()
				const alertsData: Alert[] = await alertsRes.json()

				setScanners(scannersData)
				setAlerts(alertsData)
			} catch (err: any) {
				setError(err.message)
			} finally {
				setLoadingScanners(false)
				setLoadingAlerts(false)
			}
		}

		fetchAllData()
	}, []) // O array vazio garante que isto só roda uma vez
	return (
		<div className='container mx-auto p-4 md:p-8'>
			<header className='flex justify-between items-center mb-8'>
				<h1 className='text-4xl font-bold'>Meu Dashboard</h1>
				<button
					onClick={handleLogout}
					className='bg-red-600 rounded-lg py-1 px-2 font-bold text-sm'>
					Logout
				</button>
			</header>

			{/* Secção do Formulário (já existente) */}
			<div className='mb-8'>
				{!showForm ? (
					<button
						onClick={() => setShowForm(true)}
						className='bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105'>
						Adicionar Novo Scanner
					</button>
				) : (
					<AddScannerForm
						onScannerCreated={handleScannerCreated}
						onCancel={() => setShowForm(false)}
					/>
				)}
			</div>

			{/* 5. NOVA SECÇÃO para exibir Alertas */}
			<div className='bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-lg shadow-lg mb-8'>
				<h2 className='text-2xl font-semibold mb-4'>Meus Alertas Recentes</h2>
				{loadingAlerts && <p>A carregar alertas...</p>}
				{error && <p className='text-red-500'>{error}</p>}
				{!loadingAlerts && !error && alerts.length === 0 && (
					<p>Nenhum alerta foi disparado ainda.</p>
				)}
				<div className='space-y-3'>
					{alerts.map((alert) => (
						<div key={alert.id} className='bg-white p-3 rounded shadow'>
							<span className='font-bold text-lg text-gray-900'>
								{alert.scanner.assetTicker}
							</span>
							<p className='text-sm text-gray-700'>{alert.message}</p>
							<p className='text-xs text-gray-500 mt-1'>
								{new Date(alert.triggeredAt).toLocaleString("pt-BR")}
							</p>
						</div>
					))}
				</div>
			</div>

			{/* Secção de Scanners (já existente, com um pequeno ajuste) */}
			<div className='bg-gray-800 p-6 rounded-lg shadow-lg'>
				<h2 className='text-2xl font-semibold mb-4'>Meus Scanners</h2>
				{loadingScanners && <p>A carregar scanners...</p>}
				<div className='space-y-4'>
					{scanners.map((scanner) => (
						// 6. AJUSTE: Mudar a cor se o scanner estiver inativo
						<div
							key={scanner.id}
							className={`p-4 rounded-md flex justify-between items-center ${
								scanner.isActive ? "bg-gray-700" : "bg-gray-600 opacity-60"
							}`}>
							<div>
								<span className='font-bold text-lg'>{scanner.assetTicker}</span>
								<p className='text-sm text-gray-300'>
									{scanner.conditionType}: {scanner.value}
								</p>
							</div>
							{!scanner.isActive && (
								<span className='text-xs font-semibold bg-yellow-400 text-yellow-900 py-1 px-3 rounded-full'>
									DISPARADO
								</span>
							)}
						</div>
					))}
				</div>
			</div>
		</div>
	)
}
