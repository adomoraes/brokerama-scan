import React, { useState } from "react"
// 1. Importar AsyncSelect
import AsyncSelect from "react-select/async"

// 2. Definir a interface para as opções do select
interface SelectOption {
	value: string // O ticker (ex: "PETR4")
	label: string // O texto a ser exibido (ex: "PETR4 - Petrobras PN")
}

interface Props {
	onScannerCreated: (newScanner: any) => void
	onCancel: () => void
}

export const AddScannerForm = ({ onScannerCreated, onCancel }: Props) => {
	// 3. Mudar o estado para guardar a opção selecionada (ou null)
	const [selectedTickerOption, setSelectedTickerOption] =
		useState<SelectOption | null>(null)
	const [conditionType, setConditionType] = useState("PRICE_ABOVE")
	const [value, setValue] = useState("")
	const [error, setError] = useState("")
	const [loadingSubmit, setLoadingSubmit] = useState(false) // Renomeado para clareza

	// 4. Implementar a função loadOptions para o AsyncSelect
	const loadOptions = async (inputValue: string): Promise<SelectOption[]> => {
		// Não busca se o input tiver menos de 2 caracteres
		if (!inputValue || inputValue.length < 2) {
			return []
		}

		const token = localStorage.getItem("brokerama_token")
		if (!token) {
			setError("Erro de autenticação.")
			return []
		}

		try {
			// Chama o nosso novo endpoint no backend
			const response = await fetch(
				`http://localhost:3001/api/search/symbols?keywords=${encodeURIComponent(
					inputValue
				)}`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			)

			if (!response.ok) {
				const errorData = await response.json()
				// Não mostra erro se for limite de taxa, apenas não retorna opções
				if (response.status !== 429) {
					console.error(
						"Erro ao buscar símbolos:",
						errorData.message || response.statusText
					)
				}
				return []
			}

			const suggestions: SelectOption[] = await response.json()
			return suggestions
		} catch (err) {
			console.error("Erro de rede ao buscar símbolos:", err)
			return [] // Retorna array vazio em caso de erro
		}
	}

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault()
		// 6. Validar se uma opção de ticker foi selecionada
		if (!selectedTickerOption) {
			setError("Por favor, selecione um ticker válido da lista.")
			return
		}

		setLoadingSubmit(true)
		setError("")
		const token = localStorage.getItem("brokerama_token")
		if (!token) {
			setError("Erro de autenticação. Por favor, faça login novamente.")
			setLoadingSubmit(false)
			return
		}

		try {
			const response = await fetch("http://localhost:3001/api/scanners", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					// Extrai o 'value' (ticker) da opção selecionada
					assetTicker: selectedTickerOption.value.toUpperCase(),
					conditionType,
					value: parseFloat(value),
				}),
			})

			const newScanner = await response.json()
			if (!response.ok) {
				throw new Error(newScanner.message || "Falha ao criar o scanner.")
			}

			onScannerCreated(newScanner)
		} catch (err: any) {
			setError(err.message)
		} finally {
			setLoadingSubmit(false)
		}
	}

	// Estilos personalizados para o react-select (para tema escuro)
	const customSelectStyles = {
		control: (provided: any) => ({
			...provided,
			backgroundColor: "#1f2937", // bg-gray-800
			borderColor: "#4b5563", // border-gray-600
			color: "#e5e7eb", // text-gray-200
			minHeight: "42px",
		}),
		menu: (provided: any) => ({
			...provided,
			backgroundColor: "#1f2937", // bg-gray-800
		}),
		option: (
			provided: any,
			state: { isSelected: boolean; isFocused: boolean }
		) => ({
			...provided,
			backgroundColor: state.isSelected
				? "#3b82f6"
				: state.isFocused
				? "#374151"
				: "#1f2937", // bg-blue-500, bg-gray-700, bg-gray-800
			color: "#e5e7eb", // text-gray-200
			":active": {
				backgroundColor: "#2563eb", // bg-blue-600
			},
		}),
		singleValue: (provided: any) => ({
			...provided,
			color: "#e5e7eb", // text-gray-200
		}),
		input: (provided: any) => ({
			...provided,
			color: "#e5e7eb", // text-gray-200
		}),
		placeholder: (provided: any) => ({
			...provided,
			color: "#9ca3af", // text-gray-400
		}),
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
				{/* 5. Substituir o input pelo AsyncSelect */}
				<AsyncSelect
					cacheOptions // Guarda os resultados em cache para evitar chamadas repetidas
					defaultOptions // Permite carregar opções iniciais (não estamos a usar agora)
					loadOptions={loadOptions} // A função que busca os dados
					onChange={(option) => setSelectedTickerOption(option as SelectOption)} // Atualiza o estado quando uma opção é selecionada
					value={selectedTickerOption} // Controla o valor selecionado
					placeholder='Digite para buscar Ticker...'
					isClearable // Permite limpar a seleção
					styles={customSelectStyles} // Aplica os estilos para tema escuro
					noOptionsMessage={({ inputValue }) =>
						inputValue.length < 2
							? "Digite pelo menos 2 caracteres"
							: "Nenhum resultado encontrado"
					}
					loadingMessage={() => "A procurar..."}
					required // Marca o campo como obrigatório (embora a validação seja feita no submit)
				/>
				{/* Campo Condição */}
				<select
					value={conditionType}
					onChange={(e) => setConditionType(e.target.value)}
					className='p-2 h-[42px] bg-gray-800 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-200'>
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
					className='p-2 h-[42px] bg-gray-800 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-200'
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
					disabled={loadingSubmit}
					className='bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:bg-gray-500'>
					{loadingSubmit ? "A Salvar..." : "Salvar Scanner"}
				</button>
			</div>
		</form>
	)
}
