const jwt = require("jsonwebtoken")

function authMiddleware(req, res, next) {
	// 1. Obter o token do cabeçalho da requisição
	const authHeader = req.headers.authorization

	// 2. Verificar se o token existe e se está no formato correto ("Bearer TOKEN")
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return res
			.status(401)
			.json({ message: "Acesso negado. Nenhum token fornecido." })
	}

	// 3. Extrair apenas o token, sem o "Bearer "
	const token = authHeader.split(" ")[1]

	try {
		// 4. Verificar se o token é válido usando o nosso segredo
		const decoded = jwt.verify(token, process.env.JWT_SECRET)

		// 5. Adicionar os dados do usuário (do token) ao objeto `req`
		// para que as nossas rotas possam usá-los.
		req.user = decoded

		// 6. Chamar `next()` para passar para a próxima função (a lógica da rota)
		next()
	} catch (error) {
		// 7. Se o token for inválido (expirado, malformado, etc.)
		return res.status(401).json({ message: "Token inválido." })
	}
}

module.exports = authMiddleware
