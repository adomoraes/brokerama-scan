const { PrismaClient } = require("@prisma/client")
const axios = require("axios")

const prisma = new PrismaClient()
const API_KEY = process.env.ALPHA_VANTAGE_API_KEY
const API_URL = "https://www.alphavantage.co/query"

async function runScannerWorker() {
	console.log(
		`[Worker] ${new Date().toISOString()}: Iniciando verificação de scanners...`
	)

	try {
		const activeScanners = await prisma.scanner.findMany({
			where: { isActive: true },
		})

		if (activeScanners.length === 0) {
			console.log("[Worker] Nenhum scanner ativo para verificar.")
			return
		}

		const uniqueTickers = [...new Set(activeScanners.map((s) => s.assetTicker))]
		console.log(
			`[Worker] Tickers a serem verificados: ${uniqueTickers.join(", ")}`
		)

		for (const ticker of uniqueTickers) {
			const symbol = `${ticker}.SA`

			// Criamos uma instância do Axios com um timeout de 10 segundos
			const apiClient = axios.create({
				timeout: 10000, // Se a API não responder em 10s, a requisição falha
			})

			const response = await apiClient.get(API_URL, {
				params: {
					function: "GLOBAL_QUOTE",
					symbol: symbol,
					apikey: API_KEY,
				},
			})

			const quote = response.data["Global Quote"]

			if (!quote || Object.keys(quote).length === 0) {
				console.warn(
					`[Worker] Não foram encontrados dados para o ticker: ${ticker}`
				)
				continue
			}

			const currentPrice = parseFloat(quote["05. price"])
			const currentVolume = parseInt(quote["06. volume"], 10)

			console.log(
				`[Worker] Dados para ${ticker}: Preço=${currentPrice}, Volume=${currentVolume}`
			)

			const scannersForTicker = activeScanners.filter(
				(s) => s.assetTicker === ticker
			)

			for (const scanner of scannersForTicker) {
				let conditionMet = false
				let alertMessage = ""

				if (
					scanner.conditionType === "PRICE_ABOVE" &&
					currentPrice > scanner.value
				) {
					conditionMet = true
					alertMessage = `${scanner.assetTicker} ultrapassou o preço de R$ ${scanner.value}. Preço atual: R$ ${currentPrice}.`
				} else if (
					scanner.conditionType === "PRICE_BELOW" &&
					currentPrice < scanner.value
				) {
					conditionMet = true
					alertMessage = `${scanner.assetTicker} caiu abaixo do preço de R$ ${scanner.value}. Preço atual: R$ ${currentPrice}.`
				} else if (
					scanner.conditionType === "VOLUME_ABOVE" &&
					currentVolume > scanner.value
				) {
					conditionMet = true
					alertMessage = `${scanner.assetTicker} ultrapassou o volume de ${scanner.value}. Volume atual: ${currentVolume}.`
				}

				if (conditionMet) {
					console.log(
						`[ALERTA!] Condição atendida para o scanner ID ${scanner.id}: ${alertMessage}`
					)
					await prisma.$transaction([
						prisma.alert.create({
							data: { message: alertMessage, scannerId: scanner.id },
						}),
						prisma.scanner.update({
							where: { id: scanner.id },
							data: { isActive: false },
						}),
					])
				}
			}
		}
	} catch (error) {
		// --- TRATAMENTO DE ERRO MELHORADO ---
		if (axios.isAxiosError(error)) {
			// Se for um erro do Axios, damos uma mensagem mais específica
			if (error.code === "ECONNABORTED") {
				console.error(
					"[Worker] Erro de rede: A requisição para a Alpha Vantage demorou demasiado (timeout)."
				)
			} else if (error.response) {
				// Erros como 522, 500, 503, etc.
				console.error(
					`[Worker] Erro de rede: A API externa respondeu com o status ${error.response.status}. Isso é geralmente um problema temporário no servidor deles.`
				)
				if (error.response.data && error.response.data.Note) {
					console.error("[Worker] Mensagem da API:", error.response.data.Note)
				}
			} else {
				console.error(
					"[Worker] Erro de rede ao comunicar com a Alpha Vantage:",
					error.message
				)
			}
		} else {
			// Se for um erro do nosso próprio código (ex: Prisma)
			console.error(
				"[Worker] Ocorreu um erro interno durante a execução:",
				error
			)
		}
	} finally {
		console.log(`[Worker] ${new Date().toISOString()}: Verificação concluída.`)
	}
}

module.exports = { runScannerWorker }
