import { useState } from "react"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import Project from "./pages/Project"

const App = () => {
  const [page, setPage] = useState("login")
  const [utente, setUtente] = useState(null)
  const [selectedProject, setSelectedProject] = useState(null)

  const handleLogin = (user) => {
    setUtente(user)
    setPage("dashboard")
  }

  const handleLogout = () => {
    setUtente(null)
    setPage("login")
  }

  const handleSelectProject = (project) => {
    setSelectedProject(project)
    setPage("project")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {page === "login" && <Login onLogin={handleLogin} />}
      {page === "dashboard" && (
        <Dashboard
          utente={utente}
          onLogout={handleLogout}
          onSelectProject={handleSelectProject}
        />
      )}
      {page === "project" && (
        <Project
          project={selectedProject}
          utente={utente}
          onBack={() => setPage("dashboard")}
        />
      )}
    </div>
  )
}

export default App