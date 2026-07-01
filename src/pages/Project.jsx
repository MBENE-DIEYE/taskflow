import { useState, useEffect, useRef } from "react"
import { supabase } from "../supabase"
import TaskForm from "../components/TaskForm"
import Chat from "../components/Chat"

const formatData = (data) =>
    data ? new Date(data + "T00:00:00").toLocaleDateString("it-IT") : null

const COLONNE = [
    { id: "da_fare", label: "Da fare", dot: "bg-purple-300", bg: "bg-purple-50", header: "text-purple-600" },
    { id: "in_corso", label: "In corso", dot: "bg-amber-300", bg: "bg-amber-50", header: "text-amber-600" },
    { id: "completato", label: "Completato", dot: "bg-emerald-300", bg: "bg-emerald-50", header: "text-emerald-600" },
]

const Project = ({ project, utente, onBack, onLogout }) => {
    const [tasks, setTasks] = useState([])
    const [showForm, setShowForm] = useState(false)
    const [editingTask, setEditingTask] = useState(null)
    const [loading, setLoading] = useState(true)
    const [errore, setErrore] = useState("")
    const [deletingId, setDeletingId] = useState(null)

    const [membri, setMembri] = useState([])
    const [emailInvito, setEmailInvito] = useState("")
    const [messaggioInvito, setMessaggioInvito] = useState("")
    const [loadingInvito, setLoadingInvito] = useState(false)
    const [showCollaboratori, setShowCollaboratori] = useState(false)

    const [draggingId, setDraggingId] = useState(null)
    const [dragOverColonna, setDragOverColonna] = useState(null)
    const [defaultStatoForm, setDefaultStatoForm] = useState("da_fare")
    const [showChat, setShowChat] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [filtroPriorita, setFiltroPriorita] = useState("tutte")
    const [colonnaAttivaMobile, setColonnaAttivaMobile] = useState("da_fare")
    const draggedRef = useRef(false)

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
        if (error) alert("Errore durante l'eliminazione del task")
        setDeletingId(null)
        fetchTasks()
    }

    const handleDragStart = (e, taskId) => {
        draggedRef.current = true
        setDraggingId(taskId)
        e.dataTransfer.setData("text/plain", taskId)
        e.dataTransfer.effectAllowed = "move"
    }

    const handleDragOver = (e, colonnaId) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = "move"
        setDragOverColonna(colonnaId)
    }

    const handleDrop = async (e, colonnaId) => {
        e.preventDefault()
        setDragOverColonna(null)
        const taskId = e.dataTransfer.getData("text/plain")
        if (!taskId) { setDraggingId(null); return }
        const task = tasks.find(t => t.id === taskId)
        if (!task || task.stato === colonnaId) { setDraggingId(null); return }
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, stato: colonnaId } : t))
        const { error } = await supabase.from("tasks").update({ stato: colonnaId }).eq("id", taskId)
        if (error) fetchTasks()
        setDraggingId(null)
    }

    const handleDragEnd = () => {
        setDraggingId(null)
        setDragOverColonna(null)
        setTimeout(() => { draggedRef.current = false }, 100)
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

    const getFilteredTasks = (colonnaId) => tasks.filter(t =>
        t.stato === colonnaId &&
        (filtroPriorita === "tutte" || t.priorita === filtroPriorita) &&
        (!searchQuery || t.titolo.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    const renderCard = (task) => (
        <div
            key={task.id}
            draggable
            onDragStart={(e) => handleDragStart(e, task.id)}
            onDragEnd={handleDragEnd}
            className={`group bg-white rounded-lg px-3 py-2.5 border border-gray-100 shadow-sm cursor-grab active:cursor-grabbing hover:shadow hover:border-gray-200 transition-all select-none ${draggingId === task.id ? "opacity-40" : ""}`}
        >
            <div className="flex items-start gap-1.5">
                <div className="flex-1 min-w-0">
                    <span className="text-[13px] text-gray-700 leading-snug">
                        {task.titolo}
                    </span>
                    {task.scadenza && (
                        <p className="text-[11px] text-gray-400 mt-0.5">
                            📅 {formatData(task.scadenza)}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-1 shrink-0 mt-0.5">
                    {task.assegnatarioNome && (
                        <span
                            className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center"
                            title={task.assegnatarioNome}
                        >
                            {task.assegnatarioNome.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                        </span>
                    )}
                    <button
                        onClick={(e) => { e.stopPropagation(); setEditingTask(task) }}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-500 transition-opacity text-sm leading-4"
                        title="Modifica"
                    >
                        ✎
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(task.id) }}
                        disabled={deletingId === task.id}
                        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-opacity text-base leading-4 disabled:opacity-30"
                        title="Elimina"
                    >
                        ×
                    </button>
                </div>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm py-3 md:py-4 px-4 md:px-6 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 md:gap-3 min-w-0">
                    <button
                        onClick={onBack}
                        className="bg-blue-100 text-blue-700 px-3 md:px-4 py-2 rounded-xl text-sm hover:bg-blue-200 transition-colors shrink-0"
                    >
                        <span className="md:hidden">←</span>
                        <span className="hidden md:inline">← Indietro</span>
                    </button>
                    <h1 className="text-base md:text-xl font-bold text-gray-800 truncate">{project.nome}</h1>
                </div>
                <div className="flex gap-1.5 md:gap-2 items-center shrink-0">
                    <button
                        onClick={() => setShowCollaboratori(!showCollaboratori)}
                        className="bg-purple-100 text-purple-700 px-2.5 md:px-4 py-2 rounded-xl text-sm hover:bg-purple-200 transition-colors"
                    >
                        <span>👥</span>
                        <span className="hidden md:inline ml-1">Collaboratori ({membri.length})</span>
                    </button>
                    <button
                        onClick={() => { setDefaultStatoForm("da_fare"); setShowForm(true) }}
                        className="bg-blue-100 text-blue-700 px-2.5 md:px-4 py-2 rounded-xl text-sm hover:bg-blue-200 transition-colors"
                    >
                        <span>+</span>
                        <span className="hidden md:inline ml-1">Nuovo task</span>
                    </button>
                </div>
            </header>

            {showCollaboratori && (
                <div className="bg-white border-b border-gray-100 px-4 md:px-6 py-4 max-w-4xl mx-auto mt-4 rounded-xl shadow-sm">
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

            <main className="max-w-7xl mx-auto px-4 py-6 md:py-8">
                {project.description && (
                    <p className="text-gray-500 text-sm mb-6">{project.description}</p>
                )}

                {errore && (
                    <div className="bg-red-50 text-red-500 text-sm px-4 py-3 rounded-xl mb-6">
                        {errore}
                    </div>
                )}

                {/* Toolbar ricerca + filtri */}
                {!loading && (
                    <div className="flex flex-wrap items-center gap-2 mb-5">
                        <div className="relative flex-1 min-w-48">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                            <input
                                type="text"
                                placeholder="Cerca task..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-8 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
                            />
                        </div>
                        <div className="flex gap-1">
                            {["tutte", "alta", "media", "bassa"].map(p => (
                                <button
                                    key={p}
                                    onClick={() => setFiltroPriorita(p)}
                                    className={`text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${filtroPriorita === p
                                        ? "bg-blue-50 text-blue-600 font-medium border border-blue-100"
                                        : "bg-white text-gray-400 border border-gray-200 hover:border-gray-300 hover:text-gray-500"}`}
                                >
                                    {p !== "tutte" && (
                                        <span className={`w-1.5 h-1.5 rounded-full ${p === "alta" ? "bg-rose-300" : p === "media" ? "bg-amber-300" : "bg-emerald-300"}`} />
                                    )}
                                    {p === "tutte" ? "Tutte" : p === "alta" ? "Alta" : p === "media" ? "Media" : "Bassa"}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {loading ? (
                    <p className="text-gray-400 text-center mt-12">Caricamento...</p>
                ) : (
                    <>
                        {/* ── Mobile: tab switcher ── */}
                        <div className="md:hidden flex mb-4 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden max-w-sm mx-auto">
                            {COLONNE.map(col => {
                                const count = getFilteredTasks(col.id).length
                                const isActive = colonnaAttivaMobile === col.id
                                return (
                                    <button
                                        key={col.id}
                                        onClick={() => setColonnaAttivaMobile(col.id)}
                                        className={`flex-1 py-2.5 text-xs font-medium flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
                                            isActive ? `${col.header} border-current` : "text-gray-400 border-transparent"
                                        }`}
                                    >
                                        <div className={`w-1.5 h-1.5 rounded-full ${col.dot}`} />
                                        {col.label}
                                        {count > 0 && (
                                            <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-semibold">
                                                {count}
                                            </span>
                                        )}
                                    </button>
                                )
                            })}
                        </div>

                        {/* ── Mobile: colonna attiva ── */}
                        <div className="md:hidden max-w-sm mx-auto">
                            {COLONNE.filter(col => col.id === colonnaAttivaMobile).map(col => {
                                const colTasks = getFilteredTasks(col.id)
                                return (
                                    <div key={col.id} className={`rounded-2xl p-3 ${col.bg}`}>
                                        <div className="flex flex-col gap-2 min-h-16">
                                            {colTasks.map(task => renderCard(task))}
                                            {colTasks.length === 0 && (
                                                <div className="rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center h-24">
                                                    <span className="text-xs text-gray-300">Nessun task</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* ── Desktop: griglia 3 colonne ── */}
                        <div className="hidden md:block overflow-x-auto -mx-4 px-4 pb-4">
                            <div className="grid grid-cols-3 gap-4 items-start min-w-160">
                                {COLONNE.map(col => {
                                    const colTasks = getFilteredTasks(col.id)
                                    const isDragOver = dragOverColonna === col.id

                                    return (
                                        <div
                                            key={col.id}
                                            onDragOver={(e) => handleDragOver(e, col.id)}
                                            onDrop={(e) => handleDrop(e, col.id)}
                                            onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOverColonna(null) }}
                                            className={`rounded-2xl p-3 transition-all ${col.bg} ${isDragOver ? "ring-2 ring-blue-400 ring-offset-1" : ""}`}
                                        >
                                            <div className="flex items-center justify-between mb-3 px-1">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                                                    <span className={`text-sm font-semibold ${col.header}`}>{col.label}</span>
                                                    <span className="text-xs bg-white border border-gray-200 text-gray-400 px-1.5 py-0.5 rounded-full font-medium">
                                                        {colTasks.length}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-2 min-h-12">
                                                {colTasks.map(task => renderCard(task))}

                                                {colTasks.length === 0 && (
                                                    <div className={`rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center h-20 transition-colors ${isDragOver ? "border-blue-300 bg-blue-50/50" : ""}`}>
                                                        <span className="text-xs text-gray-300">
                                                            {isDragOver ? "Rilascia qui" : "Nessun task"}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </>
                )}
            </main>

            {/* Bottone chat flottante */}
            <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
                {showChat && (
                    <div className="w-64 md:w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                        <Chat project={project} utente={utente} />
                    </div>
                )}
                <button
                    onClick={() => setShowChat(!showChat)}
                    className="w-12 h-12 bg-blue-400 text-white rounded-full shadow-md hover:bg-blue-500 transition-colors flex items-center justify-center"
                    title="Chat del progetto"
                >
                    {showChat
                        ? <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
                        : <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    }
                </button>
            </div>

            {showForm && (
                <TaskForm
                    project={project}
                    utente={utente}
                    onTaskAdded={fetchTasks}
                    onClose={() => setShowForm(false)}
                    defaultStato={defaultStatoForm}
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
