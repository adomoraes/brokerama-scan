// frontend/src/pages/LoginPage.tsx
import React, { useState } from "react"
import { useNavigate, Link } from "react-router-dom"

export const LoginPage = () => {
	// Hook para nos permitir redirecionar o usuário
	const navigate = useNavigate()

	// Estados para os campos do formulário e feedback
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [message, setMessage] = useState("")
	const [isError, setIsError] = useState(false)
	const [loading, setLoading] = useState(false)

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault()
		setLoading(true)
		setMessage("")

		try {
			// 1. Fazer a chamada para o endpoint de login
			const response = await fetch("http://localhost:3001/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, password }),
			})
			const data = await response.json()

			if (!response.ok) {
				throw new Error(data.message || "Erro ao fazer login.")
			}

			// 2. Login bem-sucedido! Armazenar o token e dados do usuário
			// O localStorage é um armazenamento simples no navegador que persiste
			// mesmo depois de fechar a aba.
			localStorage.setItem("brokerama_token", data.token)
			localStorage.setItem("brokerama_user", JSON.stringify(data.user))

			// 3. Exibir mensagem de sucesso e redirecionar para o dashboard
			setIsError(false)
			setMessage("Login efetuado com sucesso! Redirecionando...")

			// Redireciona para a página principal da aplicação após o login
			setTimeout(() => navigate("/dashboard"), 1500)
		} catch (error: any) {
			setIsError(true)
			setMessage(error.message)
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className='flex flex-col items-center justify-center min-h-screen p-4'>
			<div className='w-full max-w-md'>
				<h2 className='text-3xl font-bold text-center mb-6'>
					Login no Brokerama
				</h2>
				<form
					onSubmit={handleSubmit}
					className='bg-gray-800 shadow-md rounded px-8 pt-6 pb-8 mb-4'>
					{/* Campo Email */}
					<div className='mb-4'>
						<label
							className='block text-gray-300 text-sm font-bold mb-2'
							htmlFor='email'>
							Email
						</label>
						<input
							id='email'
							type='email'
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							className='shadow appearance-none border rounded w-full py-2 px-3 bg-gray-700 text-gray-200 leading-tight focus:outline-none focus:shadow-outline'
						/>
					</div>
					{/* Campo Senha */}
					<div className='mb-6'>
						<label
							className='block text-gray-300 text-sm font-bold mb-2'
							htmlFor='password'>
							Senha
						</label>
						<input
							id='password'
							type='password'
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							className='shadow appearance-none border rounded w-full py-2 px-3 bg-gray-700 text-gray-200 mb-3 leading-tight focus:outline-none focus:shadow-outline'
						/>
					</div>
					<div className='flex items-center justify-between'>
						<button
							type='submit'
							disabled={loading}
							className='bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-gray-500'>
							{loading ? "A Entrar..." : "Entrar"}
						</button>
					</div>
				</form>
				{message && (
					<div
						className={`text-center p-3 rounded ${
							isError ? "bg-red-500" : "bg-green-500"
						} text-white`}>
						{message}
					</div>
				)}
				<p className='text-center text-gray-500 text-xs mt-4'>
					Não tem uma conta?{" "}
					<Link to='/register' className='text-blue-400 hover:underline'>
						Crie uma agora
					</Link>
				</p>
			</div>
		</div>
	)
}
