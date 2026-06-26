import { useState, useEffect } from "react"
import { supabase } from "../supabase"

const TaskForm = ({ project, utente, onTaskAdded, onClose }) => {
    const [titolo, setTitolo] = useState("")
    const [description, setDescription] = useState("")
    const [scadenza, setScadenza] = useState("")
    const [priorita, setPriorita] = useState("media")
    const [assegnatoA, setAssegnatoA] = useState("")
    const [collaboratori, setCollaboratori] = useState([])
    const [loading, setLoading] = useState(false)
    const [errore, setErrore] = useState("")

    // Carichiamo i collaboratori del progetto
    // così possiamo scegliere a chi assegnare la task
    useEffect(() => {
        const fetchCollaboratori = async () => {
            const { data: membriData } = await supabase
                .from("project_members")
                .select("*")
                .eq("project_id", project.id)

            const membriConUtenti = await Promise.all(
                (membriData ?? []).map(async (membro) => {
                    const { data: utenteData } = await supabase
                        .from("users")
                        .select("id, nome, cognome")
                        .eq("id", membro.user_id)
                        .single()
                    return { ...membro, users: utenteData }
                })
            )
            setCollaboratori(membriConUtenti)
        }
        fetchCollaboratori()
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setErrore("")

        const { error } = await supabase
            .from("tasks")
            .insert({
                titolo,
                description,
                scadenza: scadenza || null,
                priorita,
                assegnato_a: assegnatoA || null,
                project_id: project.id,
                user_id: utente.id,
                stato: "da_fare"
            })

        if (error) setErrore(error.message)
        else {
            onTaskAdded()
            onClose()
        }

        setLoading(false)
    }

    // Colori per la priorità
    const prioritaColore = {
        alta: "text-red-500",
        media: "text-yellow-500",
        bassa: "text-green-500"
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-xl">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Nuovo task</h2>

                {errore && (
                    <div className="bg-red-50 text-red-500 text-sm px-4 py-3 rounded-xl mb-4">
                        {errore}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <input
                        type="text"
                        placeholder="Titolo del task"
                        value={titolo}
                        onChange={e => setTitolo(e.target.value)}
                        required
                        className="px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                    <textarea
                        placeholder="Descrizione (opzionale)"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        rows={3}
                        className="px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                    />

                    {/* Data scadenza */}
                    <div>
                        <label className="text-xs text-gray-400 mb-1 block">📅 Scadenza</label>
                        <input
                            type="date"
                            value={scadenza}
                            onChange={e => setScadenza(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        />
                    </div>

                    {/* Priorità — NUOVO */}
                    <div>
                        <label className="text-xs text-gray-400 mb-1 block">🎯 Priorità</label>
                        <select
                            value={priorita}
                            onChange={e => setPriorita(e.target.value)}
                            className={`w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-300 font-medium ${prioritaColore[priorita]}`}
                        >
                            <option value="alta">🔴 Alta</option>
                            <option value="media">🟡 Media</option>
                            <option value="bassa">🟢 Bassa</option>
                        </select>
                    </div>

                    {/* Assegnatario — NUOVO */}
                    <div>
                        <label className="text-xs text-gray-400 mb-1 block">👤 Assegna a</label>
                        <select
                            value={assegnatoA}
                            onChange={e => setAssegnatoA(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        >
                            <option value="">— Nessuno —</option>
                            {/* L'utente corrente (te stessa) */}
                            <option value={utente.id}>
                                {utente.nome} {utente.cognome} (tu)
                            </option>
                            {/* I collaboratori del progetto */}
                            {collaboratori.map(membro => (
                                <option key={membro.id} value={membro.user_id}>
                                    {membro.users?.nome} {membro.users?.cognome}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-3 mt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                            Annulla
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50"
                        >
                            {loading ? "Salvataggio..." : "Crea task"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default TaskForm