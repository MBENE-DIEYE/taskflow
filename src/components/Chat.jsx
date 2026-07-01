import { useState, useEffect, useRef } from "react"
import { supabase } from "../supabase"

const Chat = ({ project, utente }) => {
    const [messaggi, setMessaggi] = useState([])
    const [nuovoMessaggio, setNuovoMessaggio] = useState("")
    const [loading, setLoading] = useState(true)
    const [erroreChat, setErroreChat] = useState("")
    const [loadingInvio, setLoadingInvio] = useState(false)
    const fineChat = useRef(null)

    const fetchMessaggi = async () => {
        const { data: messaggiData } = await supabase
            .from("messages")
            .select("*")
            .eq("project_id", project.id)
            .order("created_at", { ascending: true })

        if (!messaggiData) { setLoading(false); return }

        // Batch: una sola query per tutti gli utenti invece di N query
        const userIds = [...new Set(messaggiData.map(m => m.user_id))]
        let usersMap = {}
        if (userIds.length > 0) {
            const { data: usersData } = await supabase
                .from("users")
                .select("id, nome, cognome")
                .in("id", userIds)
            usersData?.forEach(u => { usersMap[u.id] = u })
        }

        setMessaggi(messaggiData.map(msg => ({ ...msg, utente: usersMap[msg.user_id] })))
        setLoading(false)
    }

    const inviaMessaggio = async () => {
        if (!nuovoMessaggio.trim()) return
        setLoadingInvio(true)
        setErroreChat("")

        const { error } = await supabase.from("messages").insert({
            contenuto: nuovoMessaggio,
            project_id: project.id,
            user_id: utente.id
        })

        if (error) {
            setErroreChat("Errore nell'invio del messaggio.")
            setLoadingInvio(false)
            return
        }

        setNuovoMessaggio("")
        setLoadingInvio(false)
        fetchMessaggi()
    }

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            inviaMessaggio()
        }
    }

    useEffect(() => {
        fineChat.current?.scrollIntoView({ behavior: "smooth" })
    }, [messaggi])

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

        return () => supabase.removeChannel(canale)
    }, [])

    const formatOra = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString("it-IT", {
            hour: "2-digit",
            minute: "2-digit"
        })
    }

    return (
        <div className="flex flex-col h-96 bg-blue-50/30 rounded-xl border border-gray-100 shadow-sm">
            <div className="px-4 py-3 border-b border-gray-200 bg-white">
                <h3 className="font-semibold text-gray-700 text-sm">
                    💬 Chat del progetto
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                {loading ? (
                    <p className="text-gray-400 text-sm text-center">Caricamento...</p>
                ) : messaggi.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center mt-8">
                        Nessun messaggio ancora — inizia la conversazione!
                    </p>
                ) : (
                    messaggi.map(msg => {
                        const isMio = msg.user_id === utente.id

                        return (
                            <div
                                key={msg.id}
                                className={`flex flex-col ${isMio ? "items-end" : "items-start"}`}
                            >
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

                                <span className="text-xs text-gray-300 mt-1">
                                    {formatOra(msg.created_at)}
                                </span>
                            </div>
                        )
                    })
                )}
                <div ref={fineChat} />
            </div>

            {erroreChat && (
                <p className="px-4 pb-1 text-xs text-red-500">{erroreChat}</p>
            )}
            <div className="px-4 py-3 border-t border-gray-200 flex gap-2 bg-white">
                <input
                    type="text"
                    placeholder="Scrivi un messaggio... (Invio per inviare)"
                    value={nuovoMessaggio}
                    onChange={e => setNuovoMessaggio(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={loadingInvio}
                    className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50"
                />
                <button
                    onClick={inviaMessaggio}
                    disabled={loadingInvio}
                    className="bg-blue-500 text-white px-4 py-2 rounded-xl text-sm hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                    {loadingInvio ? "..." : "Invia"}
                </button>
            </div>
        </div>
    )
}

export default Chat
