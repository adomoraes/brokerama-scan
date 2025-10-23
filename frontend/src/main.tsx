import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App.tsx"
import { ToastContainer } from "react-toastify" // Importa
import "react-toastify/dist/ReactToastify.css" // Importa o CSS

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<App />
		<ToastContainer
			position='top-right'
			autoClose={5000}
			hideProgressBar={false}
			newestOnTop={false}
			closeOnClick
			rtl={false}
			pauseOnFocusLoss
			draggable
			pauseOnHover
			theme='light' // ou "dark" ou "colored"
		/>
	</StrictMode>
)
