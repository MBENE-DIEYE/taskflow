import { useState, useEffect } from "react"
import { supabase } from "../supabase"
import ProjectForm from "../components/ProjectForm"

const Dashboard = ({ utente, onLogout, onSelectProject }) => {
    const [projects, setProjects] = useState([])
    const [taskAssegnati, setTaskAssegnati] = useState([])
    const [showForm, setShowForm] = useState(false)
    const [loading, setLoading] = useState(true)

    const fetchTaskAssegnati = async () => {
        const { data } = await supabase
            .from("tasks")
            .select("*, projects(nome)")
            .eq("assegnato_a", utente.id)
            .neq("stato", "completato")
            .order("created_at", { ascending: false })
        setTaskAssegnati(data ?? [])
    }

    const fetchProjects = async () => {
        // Progetti di cui sei proprietario
        const { data: owned } = await supabase
            .from("projects")
            .select("*, tasks(stato)")
            .eq("user_id", utente.id)

        // ID dei progetti dove sei collaboratore
        const { data: memberships } = await supabase
            .from("project_members")
            .select("project_id")
            .eq("user_id", utente.id)

        const memberIds = (memberships ?? []).map(m => m.project_id)

        let shared = []
        if (memberIds.length > 0) {
            const { data } = await supabase
                .from("projects")
                .select("*, tasks(stato)")
                .in("id", memberIds)
            shared = data ?? []
        }

        // Combina e deduplica (un proprietario potrebbe anche essere in project_members)
        const all = [...(owned ?? []), ...shared]
        const unique = all.filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i)
        setProjects(unique)
        setLoading(false)
    }

    const handleDeleteProject = async (e, projectId) => {
        e.stopPropagation()
        if (!window.confirm("Eliminare questo progetto? Tutti i task verranno eliminati.")) return
        await supabase.from("projects").delete().eq("id", projectId)
        fetchProjects()
    }

    useEffect(() => {
        fetchProjects()
        fetchTaskAssegnati()
    }, [])

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm py-4 px-6 flex items-center justify-between">
                <h1 className="text-xl font-bold text-blue-500">TaskFlow</h1>
                <div className="flex items-center gap-4">
                    <p className="text-gray-600 text-sm">Ciao, <strong>{utente.nome}</strong> !</p>
                    <button
                        onClick={onLogout}
                        className="text-sm text-red-400 hover:text-red-600 transition-colors"
                    >
                        Esci
                    </button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8">
                {taskAssegnati.length > 0 && (
                    <div className="mb-10">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">📌 Task assegnati a te</h2>
                        <div className="flex flex-col gap-3">
                            {taskAssegnati.map(task => (
                                <div key={task.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-gray-800 text-sm">{task.titolo}</p>
                                        <p className="text-xs text-gray-400 mt-1">📁 {task.projects?.nome}</p>
                                        {task.scadenza && <p className="text-xs text-gray-400 mt-1">📅 {task.scadenza}</p>}
                                    </div>
                                    <span className={`text-xs px-3 py-1 rounded-full font-medium shrink-0 ml-4 ${
                                        task.stato === "in_corso" ? "bg-yellow-100 text-yellow-600" : "bg-gray-100 text-gray-600"
                                    }`}>
                                        {task.stato === "in_corso" ? "in corso" : "da fare"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-800">I tuoi progetti</h2>
                    <button
                        onClick={() => setShowForm(true)}
                        className="bg-blue-500 text-white px-4 py-2 rounded-xl text-sm hover:bg-blue-600 transition-colors"
                    >
                        + Nuovo progetto
                    </button>
                </div>

                {loading ? (
                    <p className="text-gray-400 text-center mt-12">Caricamento...</p>
                ) : projects.length === 0 ? (
                    <p className="text-gray-400 text-center mt-12">
                        Nessun progetto ancora — creane uno !
                    </p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {projects.map(project => {
                            const completati = project.tasks?.filter(t => t.stato === "completato").length ?? 0
                            const inCorso = project.tasks?.filter(t => t.stato === "in_corso").length ?? 0
                            const daFare = project.tasks?.filter(t => t.stato === "da_fare").length ?? 0
                            const totale = project.tasks?.length ?? 0

                            return (
                                <div
                                    key={project.id}
                                    onClick={() => onSelectProject(project)}
                                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 cursor-pointer hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between mb-1">
                                        <h3 className="text-lg font-semibold text-gray-800">{project.nome}</h3>
                                        {project.user_id === utente.id && (
                                            <button
                                                onClick={(e) => handleDeleteProject(e, project.id)}
                                                className="text-xs text-red-400 hover:text-red-600 transition-colors ml-2 shrink-0"
                                            >
                                                Elimina
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 mb-4">{project.description}</p>

                                    <div className="flex items-center gap-3 text-xs">
                                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                            📋 {daFare} da fare
                                        </span>
                                        <span className="bg-yellow-100 text-yellow-600 px-2 py-1 rounded-full">
                                            ⏳ {inCorso} in corso
                                        </span>
                                        <span className="bg-green-100 text-green-600 px-2 py-1 rounded-full">
                                            ✅ {completati} completati
                                        </span>
                                    </div>

                                    {totale > 0 && (
                                        <div className="mt-3 bg-gray-100 rounded-full h-2">
                                            <div
                                                className="bg-green-400 rounded-full h-2 transition-all"
                                                style={{ width: `${(completati / totale) * 100}%` }}
                                            />
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </main>

            {showForm && (
                <ProjectForm
                    utente={utente}
                    onProjectAdded={fetchProjects}
                    onClose={() => setShowForm(false)}
                />
            )}
        </div>
    )
}

export default Dashboard
