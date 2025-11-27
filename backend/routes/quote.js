const express = require("express")
const axios = require("axios")
const authMiddleware = require("../middleware/authMiddleware")

const router = express.Router()
const API_KEY = process.env.ALPHA_VANTAGE_API_KEY
const API_URL = "https://www.alphavantage.co/query"

router.use(authMiddleware)

router.get("/:symbol", async (req, res) => {
	const symbol = req.params.symbol

	if (!symbol) {
		return res.status(400).json({ message: 'Parâmetro "symbol" é obrigatório.' })
	}

	console.log(`[Quote] Buscando cotação para: "${symbol}"`)

	const apiClient = axios.create({ timeout: 10000 })

	try {
		const response = await apiClient.get(API_URL, {
			params: {
				function: "GLOBAL_QUOTE",
				symbol: symbol,
				apikey: API_KEY,
			},
		})

		if (response.data.Note) {
			console.warn(
				"[Quote] API da Alpha Vantage atingiu o limite de taxa:",
				response.data.Note
			)
			return res.status(429).json({
				message: "Limite de busca atingido. Tente novamente mais tarde.",
			})
		}

		if (!response.data["Global Quote"]) {
			console.error(
				"[Quote] Resposta inesperada da Alpha Vantage:",
				response.data
			)
			return res.status(500).json({ 
				message: "Erro ao buscar cotação.",
				alpha_vantage_response: response.data
			})
		}

		res.json(response.data)

	} catch (error) {
		if (axios.isAxiosError(error)) {
			if (error.code === "ECONNABORTED") {
				console.error("[Quote] Timeout ao buscar cotação na Alpha Vantage.")
				return res
					.status(504)
					.json({ message: "Serviço de cotação demorou a responder." })
			} else if (error.response) {
				console.error(
					`[Quote] Erro ${error.response.status} da Alpha Vantage.`
				)
				return res
					.status(error.response.status || 500)
					.json({ message: "Erro ao comunicar com o serviço de cotação." })
			}
		}
		console.error("[Quote] Erro inesperado:", error)
		res.status(500).json({ message: "Erro interno ao processar a busca." })
	}
})

module.exports = router
