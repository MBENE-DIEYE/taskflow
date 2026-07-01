import { useState, useEffect } from "react"
import { supabase } from "./supabase"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import Project from "./pages/Project"
import ResetPassword from "./pages/ResetPassword"
import Layout from "./components/Layout"

const App = () => {
  const [page, setPage] = useState("login")
  const [utente, setUtente] = useState(null)
  const [selectedProject, setSelectedProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [vistaAttiva, setVistaAttiva] = useState("progetti")
  const [taskAssegnati, setTaskAssegnati] = useState([])

  const fetchTaskAssegnati = async (userId) => {
    const { data } = await supabase
      .from("tasks")
      .select("*, projects(nome)")
      .eq("assegnato_a", userId)
      .neq("stato", "completato")
      .order("created_at", { ascending: false })
    setTaskAssegnati(data ?? [])
  }

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
          fetchTaskAssegnati(data.id)
        }
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setPage("reset-password")
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogin = (user) => {
    setUtente(user)
    setPage("dashboard")
    fetchTaskAssegnati(user.id)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUtente(null)
    setPage("login")
    setTaskAssegnati([])
    setVistaAttiva("progetti")
  }

  const handleSelectProject = (project) => {
    setSelectedProject(project)
    setPage("project")
  }

  const handleNavClick = (id) => {
    if (page === "project") setPage("dashboard")
    setVistaAttiva(id)
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
      {page === "reset-password" && <ResetPassword onComplete={() => setPage("login")} />}
      {(page === "dashboard" || page === "project") && (
        <Layout
          utente={utente}
          onLogout={handleLogout}
          vistaAttiva={vistaAttiva}
          onNavClick={handleNavClick}
          taskAssegnatiCount={taskAssegnati.length}
        >
          {page === "dashboard" && (
            <Dashboard
              utente={utente}
              vistaAttiva={vistaAttiva}
              taskAssegnati={taskAssegnati}
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
        </Layout>
      )}
    </div>
  )
}

export default App
