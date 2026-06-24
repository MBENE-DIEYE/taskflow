import { useState } from "react"
import { supabase } from "../supabase"

const ProjectForm = ({ utente, onProjectAdded, onClose }) => {
    const [nome, setNome] = useState("")
    const [description, setDescription] = useState("")
    const [loading, setLoading] = useState(false)

    const [errore, setErrore] = useState("")

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setErrore("")

        const { error } = await supabase
            .from("projects")
            .insert({
                nome,
                description,
                user_id: utente.id
            })

        if (error) setErrore(error.message)
        else {
            onProjectAdded()
            onClose()
        }

        setLoading(false)
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-xl">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Nuovo progetto</h2>

                {errore && (
                    <div className="bg-red-50 text-red-500 text-sm px-4 py-3 rounded-xl mb-2">
                        {errore}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <input
                        type="text"
                        placeholder="Nome del progetto"
                        value={nome}
                        onChange={e => setNome(e.target.value)}
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
                            {loading ? "Salvataggio..." : "Crea progetto"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default ProjectForm