import { useState, useEffect } from "react"
import { supabase } from "../supabase"
import TaskForm from "../components/TaskForm"

const Project = ({ project, utente, onBack }) => {
    const [tasks, setTasks] = useState([])
    const [showForm, setShowForm] = useState(false)
    const [loading, setLoading] = useState(true)

    const fetchTasks = async () => {
        const { data, error } = await supabase
            .from("tasks")
            .select("*")
            .eq("project_id", project.id)
            .order("created_at", { ascending: false })

        if (error) console.error(error)
        else setTasks(data ?? [])
        setLoading(false)
    }

    const handleDelete = async (id) => {
        if (!window.confirm("Sei sicuro di voler eliminare questo task?")) return
        await supabase.from("tasks").delete().eq("id", id)
        fetchTasks()
    }

    useEffect(() => {
        fetchTasks()
    }, [])

    const statoColore = (stato) => {
        if (stato === "completato") return "bg-green-100 text-green-600"
        if (stato === "in_corso") return "bg-yellow-100 text-yellow-600"
        return "bg-gray-100 text-gray-600"
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm py-4 px-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="bg-blue-500 text-white px-4 py-2 rounded-xl text-sm hover:bg-blue-600 transition-colors"
                    >
                        ← Indietro
                    </button>
                    <h1 className="text-xl font-bold text-gray-800">{project.nome}</h1>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-xl text-sm hover:bg-blue-600 transition-colors"
                >
                    + Nuovo task
                </button>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8">
                {project.description && (
                    <p className="text-gray-500 text-sm mb-6">{project.description}</p>
                )}

                {loading ? (
                    <p className="text-gray-400 text-center mt-12">Caricamento...</p>
                ) : tasks.length === 0 ? (
                    <p className="text-gray-400 text-center mt-12">
                        Nessun task ancora — creane uno !
                    </p>
                ) : (
                    <div className="flex flex-col gap-4">
                        {tasks.map(task => (
                            <div key={task.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-semibold text-gray-800">{task.titolo}</h3>
                                    <select
                                        value={task.stato}
                                        onChange={async (e) => {
                                            await supabase
                                                .from("tasks")
                                                .update({ stato: e.target.value })
                                                .eq("id", task.id)
                                            fetchTasks()
                                        }}
                                        className={`text-xs px-3 py-1 rounded-full font-medium border-0 cursor-pointer ${statoColore(task.stato)}`}
                                    >
                                        <option value="da_fare">da fare</option>
                                        <option value="in_corso">in corso</option>
                                        <option value="completato">completato</option>
                                    </select>
                                </div>
                                {task.description && (
                                    <p className="text-sm text-gray-500 mb-2">{task.description}</p>
                                )}
                                <div className="flex items-center justify-between mt-3">
                                    <div className="flex items-center gap-4 text-xs text-gray-400">
                                        {task.scadenza && <span>📅 {task.scadenza}</span>}
                                    </div>
                                    <button
                                        onClick={() => handleDelete(task.id)}
                                        className="text-xs text-red-400 hover:text-red-600 transition-colors"
                                    >
                                        Elimina
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {showForm && (
                <TaskForm
                    project={project}
                    utente={utente}
                    onTaskAdded={fetchTasks}
                    onClose={() => setShowForm(false)}
                />
            )}
        </div>
    )
}

export default Project