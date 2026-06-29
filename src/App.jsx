import { useState, useEffect } from "react"
import { supabase } from "./supabase"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import Project from "./pages/Project"

const App = () => {
  const [page, setPage] = useState("login")
  const [utente, setUtente] = useState(null)
  const [selectedProject, setSelectedProject] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single()

        if (data) {
          setUtente(data)
          setPage("dashboard")
        }
      }
      setLoading(false)
    })
  }, [])

  const handleLogin = (user) => {
    setUtente(user)
    setPage("dashboard")
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUtente(null)
    setPage("login")
  }

  const handleSelectProject = (project) => {
    setSelectedProject(project)
    setPage("project")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Caricamento...</p>
      </div>
    )
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
          onLogout={handleLogout}
        />
      )}
    </div>
  )
}

export default App
