// frontend/src/pages/HomePage.tsx
import { Link } from "react-router-dom"

export const HomePage = () => {
	return (
		<div className='flex flex-col items-center justify-center min-h-screen p-4 text-center'>
			<h1 className='text-5xl md:text-6xl font-bold mb-4'>
				Bem-vindo ao Brokerama Scan
			</h1>
			<p className='text-xl text-gray-400 mb-8'>
				O seu scanner de oportunidades de mercado.
			</p>
			<div className='flex gap-4'>
				<Link
					to='/login'
					className='bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors'>
					Login
				</Link>
				<Link
					to='/register'
					className='bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors'>
					Registar
				</Link>
			</div>
		</div>
	)
}
