import React from "react"
import { Navigate } from "react-router-dom"

// Este componente recebe 'children', que é a página que queremos proteger.
export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
	// 1. Verifica se o token existe no localStorage do navegador.
	const token = localStorage.getItem("brokerama_token")

	// 2. Se não houver token, redireciona o usuário para a página de login.
	// O `replace` evita que o usuário possa usar o botão "voltar" do navegador
	// para aceder à página protegida novamente.
	if (!token) {
		return <Navigate to='/login' replace />
	}

	// 3. Se houver um token, renderiza o componente filho (a página protegida).
	return <>{children}</>
}
