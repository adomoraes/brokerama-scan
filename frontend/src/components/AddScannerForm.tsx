import React, { useState } from "react"

// A interface `Props` define as propriedades que este componente recebe.
// Neste caso, ele precisa de uma função para chamar quando um scanner é criado.
interface Props {
	onScannerCreated: (newScanner: any) => void
	onCancel: () => void
}

export const AddScannerForm = ({ onScannerCreated, onCancel }: Props) => {
	// Estados para os campos do formulário
	const [assetTicker, setAssetTicker] = useState("")
	const [conditionType, setConditionType] = useState("PRICE_ABOVE")
	const [value, setValue] = useState("")
	const [error, setError] = useState("")
	const [loading, setLoading] = useState(false)

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault()
		setLoading(true)
		setError("")

		const token = localStorage.getItem("brokerama_token")
		if (!token) {
			setError("Erro de autenticação. Por favor, faça login novamente.")
			setLoading(false)
			return
		}

		try {
			const response = await fetch("http://localhost:3001/api/scanners", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`, // Enviando o token
				},
				body: JSON.stringify({
					assetTicker: assetTicker.toUpperCase(), // Boa prática guardar tickers em maiúsculas
					conditionType,
					value: parseFloat(value),
				}),
			})

			const newScanner = await response.json()
			if (!response.ok) {
				throw new Error(newScanner.message || "Falha ao criar o scanner.")
			}

			// SUCESSO!
			onScannerCreated(newScanner) // Chama a função do componente pai para atualizar a lista
		} catch (err: any) {
			setError(err.message)
		} finally {
			setLoading(false)
		}
	}

	return (
		<form
			onSubmit={handleSubmit}
			className='bg-gray-700 p-6 rounded-lg mb-8 shadow-inner'>
			<h3 className='text-xl font-semibold mb-4'>Novo Scanner</h3>
			{error && (
				<p className='bg-red-500 text-white p-2 rounded mb-4'>{error}</p>
			)}
			<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
				{/* Campo Ticker do Ativo */}
				<input
					type='text'
					placeholder='Ticker (ex: PETR4)'
					value={assetTicker}
					onChange={(e) => setAssetTicker(e.target.value)}
					required
					className='p-2 bg-gray-800 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500'
				/>
				{/* Campo Condição */}
				<select
					value={conditionType}
					onChange={(e) => setConditionType(e.target.value)}
					className='p-2 bg-gray-800 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500'>
					<option value='PRICE_ABOVE'>Preço Acima de</option>
					<option value='PRICE_BELOW'>Preço Abaixo de</option>
					<option value='VOLUME_ABOVE'>Volume Acima de</option>
				</select>
				{/* Campo Valor */}
				<input
					type='number'
					step='0.01'
					placeholder='Valor'
					value={value}
					onChange={(e) => setValue(e.target.value)}
					required
					className='p-2 bg-gray-800 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500'
				/>
			</div>
			<div className='flex justify-end gap-4 mt-4'>
				<button
					type='button'
					onClick={onCancel}
					className='bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded transition-colors'>
					Cancelar
				</button>
				<button
					type='submit'
					disabled={loading}
					className='bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:bg-gray-500'>
					{loading ? "A Salvar..." : "Salvar Scanner"}
				</button>
			</div>
		</form>
	)
}
