require("dotenv").config()
const express = require("express")
const cors = require("cors")

// 1. Importar as novas rotas
const authRoutes = require("./routes/auth")

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.get("/api/health", (req, res) => {
	res.json({ status: "Brokerama Scan API está no ar! ✅" })
})

// 2. Usar as rotas de autenticação com o prefixo /api/auth
app.use("/api/auth", authRoutes)

app.listen(PORT, () => {
	console.log(`🚀 Servidor Brokerama Scan rodando em http://localhost:${PORT}`)
})
