const express = require("express")
const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

const router = express.Router()
const prisma = new PrismaClient()

// ROTA DE REGISTO: POST /api/auth/register
router.post("/register", async (req, res) => {
	const { email, password, name } = req.body

	if (!email || !password) {
		return res.status(400).json({ message: "Email e senha são obrigatórios." })
	}

	try {
		const existingUser = await prisma.user.findUnique({ where: { email } })
		if (existingUser) {
			return res.status(409).json({ message: "Este email já está em uso." })
		}

		const passwordHash = await bcrypt.hash(password, 10)

		const user = await prisma.user.create({
			data: { email, passwordHash, name },
		})

		res
			.status(201)
			.json({ message: "Usuário criado com sucesso!", userId: user.id })
	} catch (error) {
		res
			.status(500)
			.json({ message: "Erro ao registar o usuário.", error: error.message })
	}
})

// ROTA DE LOGIN: POST /api/auth/login
router.post("/login", async (req, res) => {
	const { email, password } = req.body

	if (!email || !password) {
		return res.status(400).json({ message: "Email e senha são obrigatórios." })
	}

	try {
		const user = await prisma.user.findUnique({ where: { email } })
		if (!user) {
			return res.status(401).json({ message: "Email ou senha inválidos." })
		}

		const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
		if (!isPasswordValid) {
			return res.status(401).json({ message: "Email ou senha inválidos." })
		}

		const token = jwt.sign(
			{ id: user.id, email: user.email },
			process.env.JWT_SECRET,
			{ expiresIn: "8h" }
		)

		res.json({
			message: "Login bem-sucedido!",
			token,
			user: { id: user.id, name: user.name, email: user.email },
		})
	} catch (error) {
		res
			.status(500)
			.json({ message: "Erro ao fazer login.", error: error.message })
	}
})

module.exports = router
