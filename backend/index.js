require("dotenv").config()
const express = require("express")
const cors = require("cors")
const cron = require("node-cron")
const { runScannerWorker } = require("./worker")

// Importação das rotas
const authRoutes = require("./routes/auth")
const scannerRoutes = require("./routes/scanners")

const app = express()
const PORT = process.env.PORT || 3001

// Middlewares
app.use(cors())
app.use(express.json())

app.use("/api/scanners", scannerRoutes)

// --- AGENDAMENTO DO WORKER ---
// A string '*/1 * * * *' significa "executar a cada 1 minuto".
// Para testes, 1 minuto é bom. Em produção, poderia ser a cada 5 ou 15 minutos.
// Formato: (minuto hora dia-do-mês mês dia-da-semana)
cron.schedule("*/1 * * * *", () => {
	runScannerWorker()
})

app.listen(PORT, () => {
	console.log(`🚀 Servidor Brokerama Scan rodando em http://localhost:${PORT}`)
	// Executa o worker uma vez assim que o servidor inicia
	console.log(
		"[Servidor] Executando o worker pela primeira vez na inicialização..."
	)
	runScannerWorker()
})

// --- ROTAS ---

// Rota de "saúde" da API
app.get("/api/health", (req, res) => {
	res.json({ status: "Brokerama Scan API está no ar! ✅" })
})

// Rota de autenticação
app.use("/api/auth", authRoutes)

// Rota de scanners (agora protegida pelo middleware)
app.use("/api/scanners", scannerRoutes)

// Inicia o servidor
app.listen(PORT, () => {
	console.log(`🚀 Servidor Brokerama Scan rodando em http://localhost:${PORT}`)
})
