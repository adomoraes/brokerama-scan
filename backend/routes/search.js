const express = require("express")
const axios = require("axios")
const authMiddleware = require("../middleware/authMiddleware") // Nosso middleware de autenticação

const router = express.Router()
const API_KEY = process.env.ALPHA_VANTAGE_API_KEY // Nossa chave da Alpha Vantage
const API_URL = "https://www.alphavantage.co/query"

// Proteger esta rota, pois ela usa nossa chave de API externa
router.use(authMiddleware)

// ROTA GET /api/search/symbols?keywords=...
router.get("/symbols", async (req, res) => {
	const keywords = req.query.keywords

	// Validação básica: verificar se as keywords foram fornecidas
	if (!keywords || typeof keywords !== "string" || keywords.trim() === "") {
		return res
			.status(400)
			.json({ message: 'Parâmetro "keywords" é obrigatório.' })
	}

	console.log(`[Search] Buscando símbolos para: "${keywords}"`)

	// Criar uma instância do Axios com timeout
	const apiClient = axios.create({ timeout: 10000 })

	try {
		const response = await apiClient.get(API_URL, {
			params: {
				function: "SYMBOL_SEARCH", // Função da Alpha Vantage para busca
				keywords: keywords,
				apikey: API_KEY,
			},
		})

		// Verificar se a API retornou um erro ou limite de taxa
		if (response.data.Note) {
			console.warn(
				"[Search] API da Alpha Vantage atingiu o limite de taxa:",
				response.data.Note
			)
			// Retorna um erro amigável, mas informa que foi limite de taxa
			return res.status(429).json({
				message: "Limite de busca atingido. Tente novamente mais tarde.",
			})
		}
		if (!response.data.bestMatches) {
			console.error(
				"[Search] Resposta inesperada da Alpha Vantage:",
				response.data
			)
			return res.status(500).json({ message: "Erro ao buscar símbolos." })
		}

		// Formatar a resposta para o frontend
		// A API retorna um array 'bestMatches'. Vamos mapeá-lo para um formato { value, label }
		// Ex: { "1. symbol": "PETR4.SA", "2. name": "Petrobras PN", ... } => { value: "PETR4", label: "PETR4 - Petrobras PN" }
		const suggestions = response.data.bestMatches.map((match) => ({
			value: match["1. symbol"].replace(".SA", ""), // Removemos o sufixo .SA se existir
			label: `${match["1. symbol"].replace(".SA", "")} - ${match["2. name"]}`,
		}))

		res.json(suggestions)
	} catch (error) {
		if (axios.isAxiosError(error)) {
			if (error.code === "ECONNABORTED") {
				console.error("[Search] Timeout ao buscar símbolos na Alpha Vantage.")
				return res
					.status(504)
					.json({ message: "Serviço de busca demorou a responder." })
			} else if (error.response) {
				console.error(
					`[Search] Erro ${error.response.status} da Alpha Vantage.`
				)
				return res
					.status(error.response.status || 500)
					.json({ message: "Erro ao comunicar com o serviço de busca." })
			}
		}
		console.error("[Search] Erro inesperado:", error)
		res.status(500).json({ message: "Erro interno ao processar a busca." })
	}
})

module.exports = router
