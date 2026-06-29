import { useState, useEffect } from "react"
import { supabase } from "../supabase"
import TaskForm from "../components/TaskForm"
import Chat from "../components/Chat"

const formatData = (data) =>
    data ? new Date(data + "T00:00:00").toLocaleDateString("it-IT") : null

const Project = ({ project, utente, onBack, onLogout }) => {
    const [tasks, setTasks] = useState([])
    const [showForm, setShowForm] = useState(false)
    const [editingTask, setEditingTask] = useState(null)
    const [loading, setLoading] = useState(true)
    const [errore, setErrore] = useState("")
    const [deletingId, setDeletingId] = useState(null)

    const [filtroStato, setFiltroStato] = useState("tutti")
    const [filtroPriorita, setFiltroPriorita] = useState("tutte")

    const [membri, setMembri] = useState([])
    const [emailInvito, setEmailInvito] = useState("")
    const [messaggioInvito, setMessaggioInvito] = useState("")
    const [loadingInvito, setLoadingInvito] = useState(false)
    const [showCollaboratori, setShowCollaboratori] = useState(false)

    const fetchTasks = async () => {
        const { data, error } = await supabase
            .from("tasks")
            .select("*")
            .eq("project_id", project.id)
            .order("created_at", { ascending: false })

        if (error) {
            setErrore("Errore nel caricamento dei task. Riprova.")
            setLoading(false)
            return
        }

        const assigneeIds = (data ?? []).filter(t => t.assegnato_a).map(t => t.assegnato_a)
        const creatorIds = (data ?? []).map(t => t.user_id)
        const allUserIds = [...new Set([...assigneeIds, ...creatorIds])]

        let usersMap = {}
        if (allUserIds.length > 0) {
            const { data: usersData } = await supabase
                .from("users")
                .select("id, nome, cognome")
                .in("id", allUserIds)
            usersData?.forEach(u => { usersMap[u.id] = `${u.nome} ${u.cognome}` })
        }

        setTasks((data ?? []).map(t => ({
            ...t,
            assegnatarioNome: t.assegnato_a ? usersMap[t.assegnato_a] : null,
            creatoreNome: usersMap[t.user_id] ?? null
        })))
        setErrore("")
        setLoading(false)
    }

    const fetchMembri = async () => {
        const { data: membriData, error } = await supabase
            .from("project_members")
            .select("*")
            .eq("project_id", project.id)

        if (error) return

        const userIds = (membriData ?? []).map(m => m.user_id)
        let usersMap = {}
        if (userIds.length > 0) {
            const { data: usersData } = await supabase
                .from("users")
                .select("id, nome, cognome, email")
                .in("id", userIds)
            usersData?.forEach(u => { usersMap[u.id] = u })
        }

        setMembri((membriData ?? []).map(m => ({ ...m, users: usersMap[m.user_id] })))
    }

    const invitaCollaboratore = async () => {
        setMessaggioInvito("")
        if (!emailInvito.trim()) {
            setMessaggioInvito("Inserisci un'email valida")
            return
        }

        setLoadingInvito(true)
        const { data: utenteTrovato, error: erroreRicerca } = await supabase
            .from("users")
            .select("id, nome, email")
            .eq("email", emailInvito.trim())
            .single()

        if (erroreRicerca || !utenteTrovato) {
            setMessaggioInvito("Nessun utente trovato con questa email")
            setLoadingInvito(false)
            return
        }

        const giaPresente = membri.find(m => m.user_id === utenteTrovato.id)
        if (giaPresente) {
            setMessaggioInvito("Questo utente è già collaboratore del progetto")
            setLoadingInvito(false)
            return
        }

        const { error: erroreInserimento } = await supabase
            .from("project_members")
            .insert({ project_id: project.id, user_id: utenteTrovato.id, ruolo: "membro" })

        if (erroreInserimento) {
            setMessaggioInvito("Errore durante l'aggiunta del collaboratore")
            setLoadingInvito(false)
            return
        }

        setMessaggioInvito(`✅ ${utenteTrovato.nome} aggiunto con successo!`)
        setEmailInvito("")
        setLoadingInvito(false)
        fetchMembri()
    }

    const rimuoviMembro = async (membroId) => {
        if (!window.confirm("Rimuovere questo collaboratore?")) return
        const { error } = await supabase.from("project_members").delete().eq("id", membroId)
        if (error) {
            alert("Errore durante la rimozione del collaboratore")
            return
        }
        fetchMembri()
    }

    const handleDelete = async (id) => {
        if (!window.confirm("Sei sicuro di voler eliminare questo task?")) return
        setDeletingId(id)
        const { error } = await supabase.from("tasks").delete().eq("id", id)
        if (error) {
            alert("Errore durante l'eliminazione del task")
        }
        setDeletingId(null)
        fetchTasks()
    }

    useEffect(() => {
        fetchTasks()
        fetchMembri()

        const canale = supabase
            .channel(`tasks-${project.id}`)
            .on("postgres_changes", {
                event: "*",
                schema: "public",
                table: "tasks",
                filter: `project_id=eq.${project.id}`
            }, () => { fetchTasks() })
            .subscribe()

        return () => supabase.removeChannel(canale)
    }, [])

    const statoColore = (stato) => {
        if (stato === "completato") return "bg-green-100 text-green-600"
        if (stato === "in_corso") return "bg-yellow-100 text-yellow-600"
        return "bg-gray-100 text-gray-600"
    }

    const taskFiltrati = tasks.filter(t => {
        if (filtroStato !== "tutti" && t.stato !== filtroStato) return false
        if (filtroPriorita !== "tutte" && t.priorita !== filtroPriorita) return false
        return true
    })

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
                <div className="flex gap-2 items-center">
                    <button
                        onClick={() => setShowCollaboratori(!showCollaboratori)}
                        className="bg-purple-500 text-white px-4 py-2 rounded-xl text-sm hover:bg-purple-600 transition-colors"
                    >
                        👥 Collaboratori ({membri.length})
                    </button>
                    <button
                        onClick={() => setShowForm(true)}
                        className="bg-blue-500 text-white px-4 py-2 rounded-xl text-sm hover:bg-blue-600 transition-colors"
                    >
                        + Nuovo task
                    </button>
                    <button
                        onClick={onLogout}
                        className="text-xs text-red-400 hover:text-red-600 transition-colors"
                    >
                        Esci
                    </button>
                </div>
            </header>

            {showCollaboratori && (
                <div className="bg-white border-b border-gray-100 px-6 py-4 max-w-4xl mx-auto mt-4 rounded-xl shadow-sm">
                    <h2 className="font-semibold text-gray-700 mb-3">Collaboratori del progetto</h2>
                    <div className="flex gap-2 mb-3">
                        <input
                            type="email"
                            placeholder="Email del collaboratore..."
                            value={emailInvito}
                            onChange={(e) => setEmailInvito(e.target.value)}
                            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400"
                        />
                        <button
                            onClick={invitaCollaboratore}
                            disabled={loadingInvito}
                            className="bg-purple-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-600 transition-colors disabled:opacity-50"
                        >
                            {loadingInvito ? "..." : "Aggiungi"}
                        </button>
                    </div>
                    {messaggioInvito && (
                        <p className="text-sm mb-3 text-gray-600">{messaggioInvito}</p>
                    )}
                    {membri.length === 0 ? (
                        <p className="text-sm text-gray-400">Nessun collaboratore ancora.</p>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {membri.map(membro => (
                                <div key={membro.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                                    <div>
                                        <span className="text-sm font-medium text-gray-700">
                                            {membro.users?.nome} {membro.users?.cognome}
                                        </span>
                                        <span className="text-xs text-gray-400 ml-2">{membro.users?.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
                                            {membro.ruolo}
                                        </span>
                                        <button
                                            onClick={() => rimuoviMembro(membro.id)}
                                            className="text-xs text-red-400 hover:text-red-600"
                                        >
                                            Rimuovi
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <main className="max-w-4xl mx-auto px-4 py-8">
                {project.description && (
                    <p className="text-gray-500 text-sm mb-6">{project.description}</p>
                )}

                {errore && (
                    <div className="bg-red-50 text-red-500 text-sm px-4 py-3 rounded-xl mb-6">
                        {errore}
                        <button onClick={fetchTasks} className="ml-2 underline">Riprova</button>
                    </div>
                )}

                {/* Filtri */}
                {!loading && tasks.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                        <div className="flex gap-1">
                            {["tutti", "da_fare", "in_corso", "completato"].map(s => (
                                <button
                                    key={s}
                                    onClick={() => setFiltroStato(s)}
                                    className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                                        filtroStato === s
                                            ? "bg-blue-500 text-white"
                                            : "bg-white text-gray-500 border border-gray-200 hover:border-blue-300"
                                    }`}
                                >
                                    {s === "tutti" ? "Tutti" : s === "da_fare" ? "Da fare" : s === "in_corso" ? "In corso" : "Completati"}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-1">
                            {["tutte", "alta", "media", "bassa"].map(p => (
                                <button
                                    key={p}
                                    onClick={() => setFiltroPriorita(p)}
                                    className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                                        filtroPriorita === p
                                            ? "bg-gray-700 text-white"
                                            : "bg-white text-gray-500 border border-gray-200 hover:border-gray-400"
                                    }`}
                                >
                                    {p === "tutte" ? "Tutte le priorità" : p === "alta" ? "🔴 Alta" : p === "media" ? "🟡 Media" : "🟢 Bassa"}
                                </button>
                            ))}
                        </div>
                        {(filtroStato !== "tutti" || filtroPriorita !== "tutte") && (
                            <button
                                onClick={() => { setFiltroStato("tutti"); setFiltroPriorita("tutte") }}
                                className="text-xs px-3 py-1.5 text-gray-400 hover:text-gray-600 underline"
                            >
                                Rimuovi filtri
                            </button>
                        )}
                    </div>
                )}

                {loading ? (
                    <p className="text-gray-400 text-center mt-12">Caricamento...</p>
                ) : taskFiltrati.length === 0 ? (
                    <p className="text-gray-400 text-center mt-12">
                        {tasks.length === 0 ? "Nessun task ancora — creane uno !" : "Nessun task corrisponde ai filtri selezionati."}
                    </p>
                ) : (
                    <div className="flex flex-col gap-4">
                        {taskFiltrati.map(task => (
                            <div key={task.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-semibold text-gray-800">{task.titolo}</h3>
                                    <select
                                        value={task.stato}
                                        onChange={async (e) => {
                                            const { error } = await supabase
                                                .from("tasks")
                                                .update({ stato: e.target.value })
                                                .eq("id", task.id)
                                            if (!error) fetchTasks()
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
                                        {task.scadenza && <span>📅 {formatData(task.scadenza)}</span>}
                                        {task.priorita && (
                                            <span className={`font-medium ${
                                                task.priorita === "alta" ? "text-red-500" :
                                                task.priorita === "media" ? "text-yellow-500" : "text-green-500"
                                            }`}>
                                                {task.priorita === "alta" ? "🔴" : task.priorita === "media" ? "🟡" : "🟢"} {task.priorita}
                                            </span>
                                        )}
                                        {task.assegnatarioNome && <span>👤 a {task.assegnatarioNome}</span>}
                                        {task.creatoreNome && <span>✏️ da {task.creatoreNome}</span>}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setEditingTask(task)}
                                            className="text-xs text-blue-400 hover:text-blue-600 transition-colors"
                                        >
                                            Modifica
                                        </button>
                                        <button
                                            onClick={() => handleDelete(task.id)}
                                            disabled={deletingId === task.id}
                                            className="text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                                        >
                                            {deletingId === task.id ? "..." : "Elimina"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-8">
                    <Chat project={project} utente={utente} />
                </div>
            </main>

            {showForm && (
                <TaskForm
                    project={project}
                    utente={utente}
                    onTaskAdded={fetchTasks}
                    onClose={() => setShowForm(false)}
                />
            )}
            {editingTask && (
                <TaskForm
                    project={project}
                    utente={utente}
                    onTaskAdded={fetchTasks}
                    onClose={() => setEditingTask(null)}
                    task={editingTask}
                />
            )}
        </div>
    )
}

export default Project
