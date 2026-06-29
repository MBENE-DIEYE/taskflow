import { useState, useEffect } from "react"
import { supabase } from "../supabase"
import TaskForm from "../components/TaskForm"
import Chat from "../components/Chat"

const Project = ({ project, utente, onBack, onLogout }) => {
    const [tasks, setTasks] = useState([])
    const [showForm, setShowForm] = useState(false)
    const [loading, setLoading] = useState(true)

    // --- NUOVO: stato per i collaboratori ---
    const [membri, setMembri] = useState([])
    const [emailInvito, setEmailInvito] = useState("")
    const [messaggioInvito, setMessaggioInvito] = useState("")
    const [showCollaboratori, setShowCollaboratori] = useState(false)

    // Fetch delle task
    const fetchTasks = async () => {
        const { data, error } = await supabase
            .from("tasks")
            .select("*")
            .eq("project_id", project.id)
            .order("created_at", { ascending: false })

        if (error) {
            console.error(error)
            setLoading(false)
            return
        }

        // Per ogni task carichiamo il nome dell'assegnatario
        const tasksConAssegnatario = await Promise.all(
            (data ?? []).map(async (task) => {
                if (!task.assegnato_a) return { ...task, assegnatarioNome: null }

                const { data: utenteData } = await supabase
                    .from("users")
                    .select("nome, cognome")
                    .eq("id", task.assegnato_a)
                    .single()

                return {
                    ...task,
                    assegnatarioNome: utenteData
                        ? `${utenteData.nome} ${utenteData.cognome}`
                        : null
                }
            })
        )

        setTasks(tasksConAssegnatario)
        setLoading(false)
    }
    const fetchMembri = async () => {
        // Prima prendiamo i membri del progetto
        const { data: membriData, error } = await supabase
            .from("project_members")
            .select("*")
            .eq("project_id", project.id)

        if (error) {
            console.error(error)
            return
        }

        // Poi per ogni membro prendiamo i dati dell'utente separatamente
        const membriConUtenti = await Promise.all(
            (membriData ?? []).map(async (membro) => {
                const { data: utenteData } = await supabase
                    .from("users")
                    .select("nome, cognome, email")
                    .eq("id", membro.user_id)
                    .single()

                return { ...membro, users: utenteData }
            })
        )

        setMembri(membriConUtenti)
    }

    // --- NUOVO: invitare un collaboratore tramite email ---
    const invitaCollaboratore = async () => {
        setMessaggioInvito("")

        if (!emailInvito.trim()) {
            setMessaggioInvito("Inserisci un'email valida")
            return
        }

        // 1. Cerchiamo l'utente con quella email nella tabella users
        const { data: utenteTrovato, error: erroreRicerca } = await supabase
            .from("users")
            .select("id, nome, email")
            .eq("email", emailInvito.trim())
            .single()

        if (erroreRicerca || !utenteTrovato) {
            setMessaggioInvito("Nessun utente trovato con questa email")
            return
        }

        // 2. Verifichiamo che non sia già membro
        const giaPresente = membri.find(m => m.user_id === utenteTrovato.id)
        if (giaPresente) {
            setMessaggioInvito("Questo utente è già collaboratore del progetto")
            return
        }

        // 3. Aggiungiamo l'utente a project_members
        const { error: erroreInserimento } = await supabase
            .from("project_members")
            .insert({
                project_id: project.id,
                user_id: utenteTrovato.id,
                ruolo: "membro"
            })

        if (erroreInserimento) {
            setMessaggioInvito("Errore durante l'aggiunta del collaboratore")
            console.error(erroreInserimento)
            return
        }

        // 4. Tutto ok!
        setMessaggioInvito(`✅ ${utenteTrovato.nome} aggiunto con successo!`)
        setEmailInvito("")
        fetchMembri()
    }

    // --- NUOVO: rimuovere un collaboratore ---
    const rimuoviMembro = async (membroId) => {
        if (!window.confirm("Rimuovere questo collaboratore?")) return
        await supabase.from("project_members").delete().eq("id", membroId)
        fetchMembri()
    }

    const handleDelete = async (id) => {
        if (!window.confirm("Sei sicuro di voler eliminare questo task?")) return
        await supabase.from("tasks").delete().eq("id", id)
        fetchTasks()
    }

    useEffect(() => {
        fetchTasks()
        fetchMembri()
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
                <div className="flex gap-2">
                    {/* NUOVO: bottone collaboratori */}
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

            {/* NUOVO: pannello collaboratori — appare solo quando clicchi il bottone */}
            {showCollaboratori && (
                <div className="bg-white border-b border-gray-100 px-6 py-4 max-w-4xl mx-auto mt-4 rounded-xl shadow-sm">
                    <h2 className="font-semibold text-gray-700 mb-3">Collaboratori del progetto</h2>

                    {/* Form invito */}
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
                            className="bg-purple-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-600 transition-colors"
                        >
                            Aggiungi
                        </button>
                    </div>

                    {/* Messaggio di feedback */}
                    {messaggioInvito && (
                        <p className="text-sm mb-3 text-gray-600">{messaggioInvito}</p>
                    )}

                    {/* Lista membri */}
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
                                        <span className="text-xs text-gray-400 ml-2">
                                            {membro.users?.email}
                                        </span>
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
                                        {task.priorita && (
                                            <span className={`font-medium ${task.priorita === "alta" ? "text-red-500" :
                                                task.priorita === "media" ? "text-yellow-500" :
                                                    "text-green-500"
                                                }`}>
                                                {task.priorita === "alta" ? "🔴" :
                                                    task.priorita === "media" ? "🟡" : "🟢"} {task.priorita}
                                            </span>
                                        )}
                                        {task.assegnatarioNome && (
                                            <span>👤 {task.assegnatarioNome}</span>
                                        )}
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
                {/* Chat del progetto */}
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
        </div>
    )
}

export default Project