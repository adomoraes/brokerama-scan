const express = require("express")
const { PrismaClient } = require("@prisma/client")
const authMiddleware = require("../middleware/authMiddleware")

const router = express.Router()
const prisma = new PrismaClient()

// Aplica o middleware a TODAS as rotas neste ficheiro.
// Agora, para aceder a qualquer rota de scanner, o usuário precisa de um token válido.
router.use(authMiddleware)

// ROTA PARA BUSCAR TODOS OS SCANNERS DO USUÁRIO LOGADO
// GET /api/scanners
router.get("/", async (req, res) => {
	try {
		const scanners = await prisma.scanner.findMany({
			where: {
				ownerId: req.user.id, // `req.user.id` vem do nosso middleware!
			},
			orderBy: {
				createdAt: "desc", // Mostra os mais recentes primeiro
			},
		})
		res.json(scanners)
	} catch (error) {
		res
			.status(500)
			.json({ message: "Erro ao buscar scanners.", error: error.message })
	}
})

// ROTA PARA CRIAR UM NOVO SCANNER
// POST /api/scanners
router.post("/", async (req, res) => {
	const { assetTicker, conditionType, value } = req.body

	if (!assetTicker || !conditionType || value === undefined) {
		return res
			.status(400)
			.json({ message: "Todos os campos são obrigatórios." })
	}

	try {
		const newScanner = await prisma.scanner.create({
			data: {
				assetTicker,
				conditionType,
				value: parseFloat(value),
				ownerId: req.user.id, // Associa o scanner ao usuário logado
			},
		})
		res.status(201).json(newScanner)
	} catch (error) {
		res
			.status(500)
			.json({ message: "Erro ao criar scanner.", error: error.message })
	}
})

// ... (as rotas de UPDATE e DELETE podemos adicionar mais tarde para simplificar o MVP)

module.exports = router
