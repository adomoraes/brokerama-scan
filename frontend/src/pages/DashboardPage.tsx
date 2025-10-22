import React, { useState, useEffect, useCallback } from "react"
import { FaTrash, FaEdit } from "react-icons/fa"
import { AddScannerForm } from "../components/AddScannerForm"
import { toast } from "react-toastify" // NOVO: Importa toast

// Definindo uma interface para o tipo Scanner
interface Scanner {
	id: number
	name: string
	url: string
	intervalMinutes: number
	status?: string
	createdAt: string
	updatedAt: string
}

// Interface para os dados do formulário de edição
interface EditFormData {
	name: string
	url: string
	intervalMinutes: string
}

function DashboardPage() {
	const [scanners, setScanners] = useState<Scanner[]>([])
	const [error, setError] = useState<string | null>(null) // Mantido para erros gerais da página, toasts serão usados para ações
	const [isLoading, setIsLoading] = useState<boolean>(true)
	const [editingScannerId, setEditingScannerId] = useState<number | null>(null)
	const [editFormData, setEditFormData] = useState<EditFormData>({
		name: "",
		url: "",
		intervalMinutes: "",
	})

	const fetchScanners = useCallback(async () => {
		setIsLoading(true)
		setError(null)
		const token = localStorage.getItem("brokerama_token") // Usa a chave correta
		if (!token) {
			setError("Autenticação necessária.")
			setIsLoading(false)
			// Poderias redirecionar para login aqui: navigate('/login');
			return
		}

		try {
			const response = await fetch("http://localhost:3001/api/scanners", {
				// Usa a porta correta
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			if (!response.ok) {
				throw new Error(`Erro ao buscar scanners: ${response.statusText}`)
			}

			const data: Scanner[] = await response.json()
			setScanners(data)
		} catch (err) {
			console.error(err)
			setError(
				err instanceof Error
					? err.message
					: "Ocorreu um erro desconhecido ao buscar scanners."
			)
			// NOVO: Mostrar toast de erro ao buscar scanners
			toast.error(
				err instanceof Error ? err.message : "Erro ao buscar scanners."
			)
		} finally {
			setIsLoading(false)
		}
	}, [])

	useEffect(() => {
		fetchScanners()
	}, [fetchScanners])

	// Função REAL para apagar o scanner (chamada após confirmação)
	const handleDelete = async (id: number) => {
		const token = localStorage.getItem("brokerama_token")
		if (!token) {
			toast.error("Autenticação necessária.") // ALTERADO: Usa toast
			return
		}

		// NOVO: Usar um ID de toast para poder atualizá-lo (loading -> success/error)
		const toastId = toast.loading("A apagar scanner...")

		try {
			const response = await fetch(`http://localhost:3001/api/scanners/${id}`, {
				// Usa a porta correta
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			if (!response.ok) {
				// Tenta obter mensagem de erro do backend
				let errorMsg = `Erro ao apagar scanner: ${response.statusText}`
				try {
					const errorData = await response.json()
					errorMsg = errorData.message || errorMsg
				} catch (_) {} // Ignora erros ao fazer parse do JSON de erro
				throw new Error(errorMsg)
			}

			// Remove o scanner do estado local após sucesso
			setScanners((prevScanners) =>
				prevScanners.filter((scanner) => scanner.id !== id)
			)
			setError(null)

			// ALTERADO: Atualiza toast para sucesso
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
			setError(errorText) // Mantém o erro no estado se necessário para outros displays
			// ALTERADO: Atualiza toast para erro
			toast.update(toastId, {
				render: errorText,
				type: "error",
				isLoading: false,
				autoClose: 5000,
			})
		}
	}

	// NOVO: Função para mostrar o toast de confirmação
	const handleDeleteConfirmation = (id: number, name: string) => {
		// Componente customizado para o conteúdo do toast
		const ConfirmationContent = ({
			closeToast,
		}: {
			closeToast?: () => void
		}) => (
			<div>
				<p className='mb-2'>
					Tem a certeza que deseja apagar o scanner "{name}"?
				</p>
				<div className='flex justify-end gap-2'>
					<button
						onClick={() => {
							handleDelete(id) // Chama a função de apagar
							if (closeToast) closeToast() // Fecha o toast
						}}
						className='px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700'>
						Sim, Apagar
					</button>
					<button
						onClick={closeToast} // Apenas fecha o toast
						className='px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400'>
						Cancelar
					</button>
				</div>
			</div>
		)

		// Mostra o toast de confirmação
		toast.warning(<ConfirmationContent />, {
			position: "top-center",
			autoClose: false, // Não fecha automaticamente
			closeOnClick: false, // Não fecha ao clicar
			draggable: false, // Impede de arrastar
			closeButton: false, // Esconde o botão 'x' padrão
			theme: "colored",
		})
	}

	// --- Funções de Edição (mantidas como antes) ---
	const handleEditClick = (scanner: Scanner) => {
		setEditingScannerId(scanner.id)
		setEditFormData({
			name: scanner.name,
			url: scanner.url,
			intervalMinutes: String(scanner.intervalMinutes),
		})
	}

	const handleCancelEdit = () => {
		setEditingScannerId(null)
		setEditFormData({ name: "", url: "", intervalMinutes: "" })
	}

	const handleEditFormChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = event.target
		setEditFormData((prevData) => ({
			...prevData,
			[name]: value,
		}))
	}

	const handleUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		if (editingScannerId === null) return

		const token = localStorage.getItem("brokerama_token")
		if (!token) {
			toast.error("Autenticação necessária.") // Usa toast
			return
		}

		if (
			!editFormData.name ||
			!editFormData.url ||
			!editFormData.intervalMinutes
		) {
			toast.error("Todos os campos são obrigatórios para edição.") // Usa toast
			return
		}
		const intervalNum = parseInt(editFormData.intervalMinutes, 10)
		if (isNaN(intervalNum) || intervalNum <= 0) {
			toast.error("O intervalo deve ser um número positivo.") // Usa toast
			return
		}

		const toastId = toast.loading("A atualizar scanner...") // NOVO: Toast de loading

		try {
			const response = await fetch(
				`http://localhost:3001/api/scanners/${editingScannerId}`,
				{
					// Porta correta
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({
						name: editFormData.name,
						url: editFormData.url,
						intervalMinutes: intervalNum,
					}),
				}
			)

			if (!response.ok) {
				let errorMsg = `Erro ao atualizar scanner: ${response.statusText}`
				try {
					const errorData = await response.json()
					errorMsg = errorData.message || errorMsg
				} catch (_) {}
				throw new Error(errorMsg)
			}

			const updatedScanner: Scanner = await response.json()

			setScanners((prevScanners) =>
				prevScanners.map((scanner) =>
					scanner.id === editingScannerId ? updatedScanner : scanner
				)
			)
			handleCancelEdit()
			setError(null)
			toast.update(toastId, {
				render: "Scanner atualizado com sucesso!",
				type: "success",
				isLoading: false,
				autoClose: 3000,
			}) // NOVO: Toast de sucesso
		} catch (err) {
			console.error(err)
			const errorText =
				err instanceof Error
					? err.message
					: "Erro desconhecido ao atualizar scanner."
			setError(errorText)
			toast.update(toastId, {
				render: errorText,
				type: "error",
				isLoading: false,
				autoClose: 5000,
			}) // NOVO: Toast de erro
		}
	}
	// --- Fim das Funções de Edição ---

	const handleScannerAdded = (newScanner: Scanner) => {
		setScanners((prevScanners) => [...prevScanners, newScanner])
		toast.success("Scanner adicionado com sucesso!") // NOVO: Toast feedback
	}

	return (
		<div className='container mx-auto p-4'>
			<h1 className='text-2xl font-bold mb-4'>Dashboard</h1>

			{/* Mostra erro geral da página, se houver */}
			{error && !isLoading && (
				<p className='text-red-500 bg-red-100 p-3 rounded mb-4'>{error}</p>
			)}

			{/* Formulário para Adicionar Scanner */}
			<div className='mb-6 p-4 rounded shadow-sm'>
				<h2 className='text-xl font-semibold mb-3'>Adicionar Novo Scanner</h2>
				<AddScannerForm
					onScannerCreated={handleScannerAdded}
					onCancel={() => {}}
				/>
			</div>

			{/* Formulário de Edição (condicional) */}
			{editingScannerId !== null && (
				<div className='mb-6 p-4 border rounded shadow-sm bg-yellow-50'>
					{/* ... (código do formulário de edição mantido igual) ... */}
					<h2 className='text-xl font-semibold mb-3'>
						Editar Scanner #{editingScannerId}
					</h2>
					<form onSubmit={handleUpdate}>
						<div className='mb-3'>
							<label
								htmlFor='edit-name'
								className='block text-sm font-medium text-gray-700'>
								Nome:
							</label>
							<input
								type='text'
								id='edit-name'
								name='name'
								value={editFormData.name}
								onChange={handleEditFormChange}
								required
								className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
							/>
						</div>
						<div className='mb-3'>
							<label
								htmlFor='edit-url'
								className='block text-sm font-medium text-gray-700'>
								URL:
							</label>
							<input
								type='url'
								id='edit-url'
								name='url'
								value={editFormData.url}
								onChange={handleEditFormChange}
								required
								className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
							/>
						</div>
						<div className='mb-3'>
							<label
								htmlFor='edit-intervalMinutes'
								className='block text-sm font-medium text-gray-700'>
								Intervalo (minutos):
							</label>
							<input
								type='number'
								id='edit-intervalMinutes'
								name='intervalMinutes'
								value={editFormData.intervalMinutes}
								onChange={handleEditFormChange}
								required
								min='1'
								className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
							/>
						</div>
						<div className='flex gap-2'>
							<button
								type='submit'
								className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'>
								Guardar Alterações
							</button>
							<button
								type='button'
								onClick={handleCancelEdit}
								className='px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400'>
								Cancelar
							</button>
						</div>
					</form>
				</div>
			)}

			{/* Lista de Scanners */}
			<div className='p-4 rounded shadow-sm'>
				<h2 className='text-xl font-semibold mb-3'>Scanners Registados</h2>
				{isLoading ? (
					<p>A carregar scanners...</p>
				) : scanners.length === 0 ? (
					<p>Nenhum scanner encontrado.</p>
				) : (
					<ul className='space-y-3'>
						{scanners.map((scanner) => (
							<li
								key={scanner.id}
								className='p-3 rounded flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-700'>
								<div>
									<p className='font-semibold'>
										{scanner.name}{" "}
										<span className='text-sm font-normal text-gray-500'>
											(ID: {scanner.id})
										</span>
									</p>
									<p className='text-sm text-gray-600'>URL: {scanner.url}</p>
									<p className='text-sm text-gray-600'>
										Intervalo: {scanner.intervalMinutes} minutos
									</p>
									{scanner.status && (
										<p className='text-sm text-gray-600'>
											Status:{" "}
											<span
												className={`font-medium ${
													scanner.status === "active"
														? "text-green-600"
														: "text-red-600"
												}`}>
												{scanner.status}
											</span>
										</p>
									)}
								</div>
								{/* Botões de Ação */}
								<div className='flex items-center gap-3 mt-2 sm:mt-0'>
									{" "}
									{/* ALTERADO: gap e items-center */}
									{/* Botão Editar (agora com ícone) */}
									<button
										onClick={() => handleEditClick(scanner)}
										disabled={editingScannerId === scanner.id}
										className={`p-2 rounded-full text-white ${
											editingScannerId === scanner.id
												? "bg-gray-400 cursor-not-allowed"
												: "bg-yellow-500 hover:bg-yellow-600"
										} transition-colors duration-150`}
										title='Editar Scanner' // Tooltip simples
									>
										<FaEdit /> {/* NOVO: Ícone de Editar */}
									</button>
									{/* NOVO: Botão Apagar com Ícone */}
									<button
										onClick={() =>
											handleDeleteConfirmation(scanner.id, scanner.name)
										} // Chama a confirmação
										className='p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors duration-150'
										title='Apagar Scanner' // Tooltip simples
									>
										<FaTrash /> {/* Ícone de Apagar */}
									</button>
								</div>
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	)
}

export default DashboardPage
