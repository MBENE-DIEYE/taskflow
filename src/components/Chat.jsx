import { useState, useEffect, useRef } from "react"
import { supabase } from "../supabase"

const Chat = ({ project, utente }) => {
    const [messaggi, setMessaggi] = useState([])
    const [nuovoMessaggio, setNuovoMessaggio] = useState("")
    const [loading, setLoading] = useState(true)
    const fineChat = useRef(null)

    // Carica i messaggi del progetto
    const fetchMessaggi = async () => {
        const { data: messaggiData } = await supabase
            .from("messages")
            .select("*")
            .eq("project_id", project.id)
            .order("created_at", { ascending: true })

        // Per ogni messaggio carichiamo il nome di chi l'ha scritto
        const messaggiConUtenti = await Promise.all(
            (messaggiData ?? []).map(async (msg) => {
                const { data: utenteData } = await supabase
                    .from("users")
                    .select("nome, cognome")
                    .eq("id", msg.user_id)
                    .single()
                return { ...msg, utente: utenteData }
            })
        )

        setMessaggi(messaggiConUtenti)
        setLoading(false)
    }

    // Invia un nuovo messaggio
    const inviaMessaggio = async () => {
        if (!nuovoMessaggio.trim()) return

        await supabase.from("messages").insert({
            contenuto: nuovoMessaggio,
            project_id: project.id,
            user_id: utente.id
        })

        setNuovoMessaggio("")
        fetchMessaggi()
    }

    // Manda il messaggio premendo Invio
    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            inviaMessaggio()
        }
    }

    // Scrolla automaticamente all'ultimo messaggio
    useEffect(() => {
        fineChat.current?.scrollIntoView({ behavior: "smooth" })
    }, [messaggi])

    // Aggiorna i messaggi in tempo reale
    // ogni volta che qualcuno scrive, la chat si aggiorna automaticamente
    useEffect(() => {
        fetchMessaggi()

        const canale = supabase
            .channel(`chat-${project.id}`)
            .on("postgres_changes", {
                event: "INSERT",
                schema: "public",
                table: "messages",
                filter: `project_id=eq.${project.id}`
            }, () => {
                fetchMessaggi()
            })
            .subscribe()

        // Quando il componente viene rimosso, chiudiamo il canale
        return () => supabase.removeChannel(canale)
    }, [])

    const formatOra = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString("it-IT", {
            hour: "2-digit",
            minute: "2-digit"
        })
    }

    return (
        <div className="flex flex-col h-96 bg-white rounded-xl border border-gray-100 shadow-sm">
            {/* Header chat */}
            <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="font-semibold text-gray-700 text-sm">
                    💬 Chat del progetto
                </h3>
            </div>

            {/* Lista messaggi */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                {loading ? (
                    <p className="text-gray-400 text-sm text-center">Caricamento...</p>
                ) : messaggi.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center mt-8">
                        Nessun messaggio ancora — inizia la conversazione!
                    </p>
                ) : (
                    messaggi.map(msg => {
                        // Controlliamo se il messaggio è nostro o di qualcun altro
                        const isMio = msg.user_id === utente.id

                        return (
                            <div
                                key={msg.id}
                                className={`flex flex-col ${isMio ? "items-end" : "items-start"}`}
                            >
                                {/* Nome mittente — solo per i messaggi degli altri */}
                                {!isMio && (
                                    <span className="text-xs text-gray-400 mb-1 ml-1">
                                        {msg.utente?.nome} {msg.utente?.cognome}
                                    </span>
                                )}

                                <div className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${isMio
                                        ? "bg-blue-500 text-white rounded-br-none"
                                        : "bg-gray-100 text-gray-800 rounded-bl-none"
                                    }`}>
                                    {msg.contenuto}
                                </div>

                                {/* Ora del messaggio */}
                                <span className="text-xs text-gray-300 mt-1">
                                    {formatOra(msg.created_at)}
                                </span>
                            </div>
                        )
                    })
                )}
                {/* Elemento invisibile per lo scroll automatico */}
                <div ref={fineChat} />
            </div>

            {/* Input messaggio */}
            <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
                <input
                    type="text"
                    placeholder="Scrivi un messaggio... (Invio per inviare)"
                    value={nuovoMessaggio}
                    onChange={e => setNuovoMessaggio(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
                <button
                    onClick={inviaMessaggio}
                    className="bg-blue-500 text-white px-4 py-2 rounded-xl text-sm hover:bg-blue-600 transition-colors"
                >
                    Invia
                </button>
            </div>
        </div>
    )
}

export default Chat