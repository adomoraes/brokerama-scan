require("dotenv").config()
const express = require("express")
const cors = require("cors")

// Importação das rotas
const authRoutes = require("./routes/auth")
const scannerRoutes = require("./routes/scanners")

const app = express()
const PORT = process.env.PORT || 3001

// Middlewares
app.use(cors())
app.use(express.json())

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
