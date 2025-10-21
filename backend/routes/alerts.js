const express = require("express")
const { PrismaClient } = require("@prisma/client")
const authMiddleware = require("../middleware/authMiddleware")

const router = express.Router()
const prisma = new PrismaClient()

// Aplica o middleware a TODAS as rotas deste ficheiro.
router.use(authMiddleware)

// ROTA PARA BUSCAR TODOS OS ALERTAS DO UTILIZADOR LOGADO
// GET /api/alerts
router.get("/", async (req, res) => {
	try {
		// Esta é uma consulta um pouco mais avançada do Prisma:
		// 1. Buscamos na tabela `Alert`
		// 2. Onde (where) o `scanner` relacionado
		// 3. Tenha um `ownerId` que seja igual ao `req.user.id` (o ID do utilizador logado)
		const alerts = await prisma.alert.findMany({
			where: {
				scanner: {
					ownerId: req.user.id,
				},
			},
			orderBy: {
				triggeredAt: "desc", // Mostrar os alertas mais recentes primeiro
			},
			// Incluímos os dados do scanner para sabermos a qual ativo o alerta se refere
			include: {
				scanner: {
					select: { assetTicker: true },
				},
			},
		})
		res.json(alerts)
	} catch (error) {
		res
			.status(500)
			.json({ message: "Erro ao buscar alertas.", error: error.message })
	}
})

module.exports = router
