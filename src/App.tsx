import { Route, Routes } from 'react-router-dom'
import './App.css'
import Header from './components/Header'
import Home from './views/Home'
import { withAuthenticationRequired } from '@auth0/auth0-react'
import Submissions from './views/Submissions'
import Logs from './views/Logs'

function App() {

  return (
		<div className="flex flex-col gap-5">
			<Header />
			<main className="mx-2 md:mx-10">
				<Routes>
					<Route index element={<Home />} />
					<Route path="/submissions" element={<Submissions />} />
					<Route path="/Logs" element={<Logs />} />
				</Routes>
			</main>
		</div>
	);
}

// Temporarily disabled due to sessionStorage security error
// export default withAuthenticationRequired(App)
export default App
