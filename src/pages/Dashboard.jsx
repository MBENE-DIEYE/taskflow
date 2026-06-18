import { useState, useEffect } from "react"
import { supabase } from "../supabase"
import ProjectForm from "../components/ProjectForm"

const Dashboard = ({ utente, onLogout, onSelectProject }) => {
    const [projects, setProjects] = useState([])
    const [showForm, setShowForm] = useState(false)

    const fetchProjects = async () => {
        const { data, error } = await supabase
            .from("projects")
            .select("*, tasks(stato)")
            .eq("user_id", utente.id)

        if (error) console.error(error)
        else setProjects(data ?? [])
    }

    useEffect(() => {
        fetchProjects()
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
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-800">I tuoi progetti</h2>
                    <button
                        onClick={() => setShowForm(true)}
                        className="bg-blue-500 text-white px-4 py-2 rounded-xl text-sm hover:bg-blue-600 transition-colors"
                    >
                        + Nuovo progetto
                    </button>
                </div>

                {projects.length === 0 ? (
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
                                    <h3 className="text-lg font-semibold text-gray-800 mb-1">{project.nome}</h3>
                                    <p className="text-sm text-gray-500 mb-4">{project.description}</p>

                                    <div className="flex items-center gap-3 text-xs">
                                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                            📋 {totale} task
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