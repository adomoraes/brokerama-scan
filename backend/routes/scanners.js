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

// ROTA PARA ATUALIZAR UM SCANNER EXISTENTE
// PUT /api/scanners/:id
router.put("/:id", async (req, res) => {
	// O ID do scanner vem do parâmetro da URL (ex: /api/scanners/15)
	const scannerId = parseInt(req.params.id, 10)
	// Os novos dados vêm do corpo da requisição
	const { assetTicker, conditionType, value, isActive } = req.body
	// O ID do utilizador vem do token (verificado pelo middleware)
	const userId = req.user.id

	// Validação básica dos dados recebidos
	if (isNaN(scannerId)) {
		return res.status(400).json({ message: "ID do scanner inválido." })
	}
	if (
		!assetTicker ||
		!conditionType ||
		value === undefined ||
		isActive === undefined
	) {
		return res
			.status(400)
			.json({
				message:
					"Todos os campos (assetTicker, conditionType, value, isActive) são obrigatórios para atualização.",
			})
	}

	try {
		// 1. Verifica se o scanner existe E pertence ao utilizador logado
		const scanner = await prisma.scanner.findUnique({
			where: { id: scannerId },
		})

		if (!scanner) {
			return res.status(404).json({ message: "Scanner não encontrado." })
		}
		if (scanner.ownerId !== userId) {
			// Importante: impede que um utilizador edite scanners de outro
			return res
				.status(403)
				.json({
					message:
						"Acesso negado. Você não tem permissão para editar este scanner.",
				})
		}

		// 2. Atualiza o scanner no banco de dados
		const updatedScanner = await prisma.scanner.update({
			where: { id: scannerId },
			data: {
				assetTicker: assetTicker.toUpperCase(),
				conditionType,
				value: parseFloat(value),
				isActive: Boolean(isActive), // Garante que é um booleano
			},
		})

		res.json(updatedScanner) // Retorna o scanner atualizado
	} catch (error) {
		// Trata erros específicos do Prisma (ex: se o valor não for um número)
		if (error.code === "P2023" || error.message.includes("Float")) {
			return res.status(400).json({ message: "Valor inválido fornecido." })
		}
		res
			.status(500)
			.json({ message: "Erro ao atualizar scanner.", error: error.message })
	}
})

// ROTA PARA APAGAR UM SCANNER
// DELETE /api/scanners/:id
router.delete("/:id", async (req, res) => {
	const scannerId = parseInt(req.params.id, 10)
	const userId = req.user.id

	if (isNaN(scannerId)) {
		return res.status(400).json({ message: "ID do scanner inválido." })
	}

	try {
		// 1. Verifica se o scanner existe E pertence ao utilizador logado
		const scanner = await prisma.scanner.findUnique({
			where: { id: scannerId },
		})

		if (!scanner) {
			return res.status(404).json({ message: "Scanner não encontrado." })
		}
		if (scanner.ownerId !== userId) {
			return res
				.status(403)
				.json({
					message:
						"Acesso negado. Você não tem permissão para apagar este scanner.",
				})
		}

		// --- CUIDADO: Antes de apagar o scanner, precisamos apagar os alertas associados ---
		// O Prisma pode dar erro se tentarmos apagar um scanner que tem alertas ligados a ele (restrição de chave estrangeira).
		await prisma.alert.deleteMany({
			where: { scannerId: scannerId },
		})

		// 2. Apaga o scanner do banco de dados
		await prisma.scanner.delete({
			where: { id: scannerId },
		})

		// Responde com sucesso, sem conteúdo no corpo
		res.status(204).send()
	} catch (error) {
		res
			.status(500)
			.json({ message: "Erro ao apagar scanner.", error: error.message })
	}
})

module.exports = router
