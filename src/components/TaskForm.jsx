import { useState } from "react"
import { supabase } from "../supabase"

const TaskForm = ({ project, utente, onTaskAdded, onClose }) => {
    const [titolo, setTitolo] = useState("")
    const [description, setDescription] = useState("")
    const [scadenza, setScadenza] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        const { error } = await supabase
            .from("tasks")
            .insert({
                titolo,
                description,
                scadenza: scadenza || null,
                project_id: project.id,
                user_id: utente.id,
                stato: "da_fare"
            })

        if (error) console.error(error)
        else {
            onTaskAdded()
            onClose()
        }

        setLoading(false)
    }

    return (
        <div className="fixed inset-0 bg-gray-50 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-xl">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Nuovo task</h2>

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
                    <input
                        type="date"
                        value={scadenza}
                        onChange={e => setScadenza(e.target.value)}
                        className="px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
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