// frontend/src/pages/RegisterPage.tsx
import React, { useState } from "react"
import { useNavigate, Link } from "react-router-dom"

export const RegisterPage = () => {
	const navigate = useNavigate()
	const [name, setName] = useState("")
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
			const response = await fetch("http://localhost:3001/api/auth/register", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name, email, password }),
			})
			const data = await response.json()

			if (!response.ok) {
				throw new Error(data.message || "Erro ao registar.")
			}

			setIsError(false)
			setMessage("Registo efetuado com sucesso! Redirecionando para o login...")
			setTimeout(() => navigate("/login"), 2000)
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
					Criar Conta no Brokerama
				</h2>
				<form
					onSubmit={handleSubmit}
					className='bg-gray-800 shadow-md rounded px-8 pt-6 pb-8 mb-4'>
					{/* Campo Nome */}
					<div className='mb-4'>
						<label
							className='block text-gray-300 text-sm font-bold mb-2'
							htmlFor='name'>
							Nome
						</label>
						<input
							id='name'
							type='text'
							value={name}
							onChange={(e) => setName(e.target.value)}
							className='shadow appearance-none border rounded w-full py-2 px-3 bg-gray-700 text-gray-200 leading-tight focus:outline-none focus:shadow-outline'
						/>
					</div>
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
							className='bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-gray-500'>
							{loading ? "A Registar..." : "Registar"}
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
					Já tem uma conta?{" "}
					<Link to='/login' className='text-blue-400 hover:underline'>
						Faça Login
					</Link>
				</p>
			</div>
		</div>
	)
}
