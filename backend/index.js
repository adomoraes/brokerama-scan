// Carrega as variáveis de ambiente do ficheiro .env
require("dotenv").config()
const express = require("express")
const cors = require("cors")

const app = express()
const PORT = process.env.PORT || 3001

// Middlewares
app.use(cors()) // Permite que o nosso frontend aceda a esta API
app.use(express.json()) // Permite que a API entenda JSON

// Rota de verificação de "saúde" da API
app.get("/api/health", (req, res) => {
	res.json({ status: "Brokerama Scan API está no ar! ✅" })
})

// Inicia o servidor
app.listen(PORT, () => {
	console.log(`🚀 Servidor Brokerama Scan rodando em http://localhost:${PORT}`)
})
