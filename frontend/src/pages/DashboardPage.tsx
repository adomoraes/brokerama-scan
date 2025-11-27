import React, { useState, useEffect, useCallback } from "react"
import { FaTrash, FaEdit, FaChevronDown, FaChevronUp } from "react-icons/fa"
import { AddScannerForm } from "../components/AddScannerForm"
import { toast } from "react-toastify"

// Definindo uma interface para o tipo Scanner
interface Scanner {
	id: number
	assetTicker: string
	conditionType: string
	value: number
	isActive: boolean
	createdAt: string
}

interface Alert {
	id: number
	message: string
	triggeredAt: string // A data virá como string
	scanner: {
		assetTicker: string
	}
}

interface GlobalQuote {
	"01. symbol": string
	"02. open": string
	"03. high": string
	"04. low": string
	"05. price": string
	"06. volume": string
	"07. latest trading day": string
	"08. previous close": string
	"09. change": string
	"10. change percent": string
}

function DashboardPage() {
	const [scanners, setScanners] = useState<Scanner[]>([])
	const [error, setError] = useState<string | null>(null)
	const [loadingAlerts, setLoadingAlerts] = useState(true)
	const [alerts, setAlerts] = useState<Alert[]>([])
	const [isLoading, setIsLoading] = useState<boolean>(true)
	const [showForm, setShowForm] = useState(false)

	const [quotes, setQuotes] = useState<{ [key: string]: GlobalQuote }>({})
	const [loadingQuotes, setLoadingQuotes] = useState<{ [key: string]: boolean }>({})
	const [expandedScanners, setExpandedScanners] = useState<Set<number>>(new Set())

	const fetchScanners = useCallback(async () => {
		setIsLoading(true)
		setError(null)
		const token = localStorage.getItem("brokerama_token")
		if (!token) {
			setError("Autenticação necessária.")
			setIsLoading(false)
			return
		}

		try {
			const response = await fetch("http://localhost:3001/api/scanners", {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			if (!response.ok) {
				throw new Error(`Erro ao buscar scanners: ${response.statusText}`)
			}

			const data: Scanner[] = await response.json()

			const alertsResponse = await fetch("http://localhost:3001/api/alerts", {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})
			if (!alertsResponse.ok)
				throw new Error(`Erro ao buscar alertas: ${alertsResponse.statusText}`)
			const alertsData: Alert[] = await alertsResponse.json()

			setScanners(data)
			setAlerts(alertsData)
		} catch (err) {
			console.error(err)
			const errorMessage =
				err instanceof Error
					? err.message
					: "Ocorreu um erro desconhecido."
			setError(errorMessage)
			toast.error(errorMessage)
		} finally {
			setIsLoading(false)
			setLoadingAlerts(false)
		}
	}, [])

	useEffect(() => {
		fetchScanners()
	}, [fetchScanners])

	const fetchQuote = async (ticker: string) => {
		const token = localStorage.getItem("brokerama_token")
		if (!token) return

		setLoadingQuotes((prev) => ({ ...prev, [ticker]: true }))
		try {
			const response = await fetch(`http://localhost:3001/api/quote/${ticker}`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})
			if (!response.ok) {
				throw new Error("Cotação não encontrada ou limite de API atingido.")
			}
			const data = await response.json()
			if (data["Global Quote"]) {
				setQuotes((prev) => ({ ...prev, [ticker]: data["Global Quote"] }))
			} else {
				throw new Error("Formato de resposta da cotação inválido.")
			}
		} catch (error) {
			toast.error(`Erro ao buscar cotação para ${ticker}.`)
		} finally {
			setLoadingQuotes((prev) => ({ ...prev, [ticker]: false }))
		}
	}

	const toggleScannerExpansion = (scannerId: number) => {
		setExpandedScanners((prev) => {
			const newSet = new Set(prev)
			if (newSet.has(scannerId)) {
				newSet.delete(scannerId)
			} else {
				newSet.add(scannerId)
				const scanner = scanners.find((s) => s.id === scannerId)
				if (scanner && !quotes[scanner.assetTicker]) {
					fetchQuote(scanner.assetTicker)
				}
			}
			return newSet
		})
	}

	const handleDelete = async (id: number) => {
		const token = localStorage.getItem("brokerama_token")
		if (!token) {
			toast.error("Autenticação necessária.")
			return
		}

		const toastId = toast.loading("A apagar scanner...")

		try {
			const response = await fetch(`http://localhost:3001/api/scanners/${id}`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			if (!response.ok) {
				let errorMsg = `Erro ao apagar scanner: ${response.statusText}`
				try {
					const errorData = await response.json()
					errorMsg = errorData.message || errorMsg
				} catch (_) {}
				throw new Error(errorMsg)
			}

			setScanners((prevScanners) =>
				prevScanners.filter((scanner) => scanner.id !== id)
			)
			setError(null)

			toast.update(toastId, {
				render: "Scanner apagado com sucesso!",
				type: "success",
				isLoading: false,
				autoClose: 3000,
			})
		} catch (err) {
			console.error(err)
			const errorText =
				err instanceof Error
					? err.message
					: "Erro desconhecido ao apagar scanner."
			setError(errorText)
			toast.update(toastId, {
				render: errorText,
				type: "error",
				isLoading: false,
				autoClose: 5000,
			})
		}
	}

	const handleDeleteConfirmation = (id: number, assetTicker: string) => {
		const ConfirmationContent = ({ closeToast }: { closeToast?: () => void }) => (
			<div>
				<p className='mb-2'>
					Tem a certeza que deseja apagar o scanner "{assetTicker}"?
				</p>
				<div className='flex justify-end gap-2'>
					<button
						onClick={() => {
							handleDelete(id)
							if (closeToast) closeToast()
						}}
						className='px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700'>
						Sim, Apagar
					</button>
					<button
						onClick={closeToast}
						className='px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400'>
						Cancelar
					</button>
				</div>
			</div>
		)

		toast.warning(<ConfirmationContent />, {
			position: "top-center",
			autoClose: false,
			closeOnClick: false,
			draggable: false,
			closeButton: false,
			theme: "colored",
		})
	}

	const handleScannerAdded = (newScanner: Scanner) => {
		setScanners((prevScanners) => [newScanner, ...prevScanners])
		setShowForm(false)
		toast.success("Scanner adicionado com sucesso!")
	}

	return (
		<div className='container mx-auto p-4'>
			<h1 className='text-2xl font-bold mb-4'>Dashboard</h1>

			{error && !isLoading && (
				<p className='text-red-500 bg-red-100 p-3 rounded mb-4'>{error}</p>
			)}

			<div className='mb-6 p-4 rounded shadow-sm'>
				{!showForm ? (
					<button
						onClick={() => setShowForm(true)}
						className='bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105'>
						Adicionar Novo Scanner
					</button>
				) : (
					<AddScannerForm
						onScannerCreated={handleScannerAdded}
						onCancel={() => setShowForm(false)}
					/>
				)}
			</div>

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

			<div className='bg-gray-800 p-6 rounded-lg shadow-lg'>
				<h2 className='text-xl font-semibold mb-3'>Scanners Registados</h2>
				{isLoading ? (
					<p>A carregar scanners...</p>
				) : scanners.length === 0 ? (
					<p>Nenhum scanner encontrado.</p>
				) : (
					<div className='space-y-4'>
						{scanners.map((scanner) => {
							const isExpanded = expandedScanners.has(scanner.id)
							const quote = quotes[scanner.assetTicker]
							const isLoadingQuote = loadingQuotes[scanner.assetTicker]

							return (
								<div
									key={scanner.id}
									className={`p-4 rounded-md transition-all duration-300 ${scanner.isActive ? "bg-gray-700" : "bg-gray-600 opacity-60"}`}>
									<div className='flex justify-between items-center'>
										<div>
											<span className='font-bold text-lg'>
												{scanner.assetTicker}
											</span>
											<p className='text-sm text-gray-300'>
												{scanner.conditionType}: {scanner.value}
											</p>
											<p className='text-xs text-gray-400 mt-1'>
												Criado em:{" "}
												{new Date(scanner.createdAt).toLocaleDateString("pt-BR")}
											</p>
										</div>
										<div className='flex items-center gap-3'>
											{!scanner.isActive && (
												<span className='text-xs font-semibold bg-yellow-400 text-yellow-900 py-1 px-3 rounded-full'>
													DISPARADO
												</span>
											)}
											<button
												onClick={() => toggleScannerExpansion(scanner.id)}
												className='p-2 bg-gray-600 text-white rounded-full hover:bg-gray-500 transition-colors'>
												{isExpanded ? <FaChevronUp /> : <FaChevronDown />}
											</button>
											<button
												onClick={() => handleDeleteConfirmation(scanner.id, scanner.assetTicker)}
												className='p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors duration-150'
												title='Apagar Scanner'>
												<FaTrash />
											</button>
										</div>
									</div>

									{isExpanded && (
										<div className='mt-4 pt-4 border-t border-gray-600'>
											{isLoadingQuote && <p>A carregar cotação...</p>}
											{quote && (
												<div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-sm'>
													{Object.entries(quote).map(([key, value]) => (
														<div key={key}>
															<p className='font-semibold text-gray-400'>
																{key.substring(4)}
															</p>
															<p className='text-white'>{value}</p>
														</div>
													))}
												</div>
											)}
										</div>
									)}
								</div>
							)
						})}
					</div>
				)}
			</div>
		</div>
	)
}

export default DashboardPage