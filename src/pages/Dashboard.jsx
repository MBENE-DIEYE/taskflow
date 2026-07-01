import { useState, useEffect } from "react"
import { supabase } from "../supabase"
import ProjectForm from "../components/ProjectForm"

const BAND_COLORS = [
    "bg-purple-100",
    "bg-blue-100",
    "bg-emerald-100",
]

const NAV = [
    { id: "progetti", label: "Progetti", icon: "📋" },
    { id: "task",     label: "Task miei", icon: "✅" },
    { id: "impostazioni", label: "Impostazioni", icon: "⚙️" },
]

const Dashboard = ({ utente, onLogout, onSelectProject }) => {
    const [vistaAttiva, setVistaAttiva] = useState("progetti")
    const [projects, setProjects] = useState([])
    const [taskAssegnati, setTaskAssegnati] = useState([])
    const [showForm, setShowForm] = useState(false)
    const [editingProject, setEditingProject] = useState(null)
    const [searchProgetti, setSearchProgetti] = useState("")
    const [showMobileMenu, setShowMobileMenu] = useState(false)
    const [loading, setLoading] = useState(true)

    const fetchTaskAssegnati = async () => {
        const { data } = await supabase
            .from("tasks")
            .select("*, projects(nome)")
            .eq("assegnato_a", utente.id)
            .neq("stato", "completato")
            .order("created_at", { ascending: false })
        setTaskAssegnati(data ?? [])
    }

    const fetchProjects = async () => {
        const { data: owned } = await supabase
            .from("projects")
            .select("*, tasks(stato)")
            .eq("user_id", utente.id)

        const ownedIds = (owned ?? []).map(p => p.id)

        const { data: myTasks } = await supabase
            .from("tasks")
            .select("project_id")
            .eq("assegnato_a", utente.id)

        const sharedIds = [...new Set((myTasks ?? []).map(t => t.project_id))]
            .filter(id => !ownedIds.includes(id))

        let shared = []
        if (sharedIds.length > 0) {
            const { data } = await supabase
                .from("projects")
                .select("*, tasks(stato)")
                .in("id", sharedIds)
            shared = data ?? []
        }

        setProjects([...(owned ?? []), ...shared])
        setLoading(false)
    }

    const handleDeleteProject = async (e, projectId) => {
        e.stopPropagation()
        if (!window.confirm("Eliminare questo progetto? Tutti i task verranno eliminati.")) return
        await supabase.from("projects").delete().eq("id", projectId)
        fetchProjects()
    }

    useEffect(() => {
        fetchProjects()
        fetchTaskAssegnati()
    }, [])

    return (
        <div className="min-h-screen bg-gray-50 flex">

            {/* ── Top bar mobile ── */}
            <div className="md:hidden bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between fixed top-0 left-0 right-0 z-20">
                <h1 className="text-base font-bold text-gray-800">TaskFlow</h1>
                <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="text-gray-500 text-xl">☰</button>
            </div>
            {showMobileMenu && (
                <div className="md:hidden fixed top-12 left-0 right-0 bg-white border-b border-gray-100 px-3 py-2 flex flex-col gap-1 z-20 shadow-md">
                    {NAV.map(item => (
                        <button
                            key={item.id}
                            onClick={() => { setVistaAttiva(item.id); setShowMobileMenu(false) }}
                            className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                                vistaAttiva === item.id ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-500 hover:bg-gray-50"
                            }`}
                        >
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                            {item.id === "task" && taskAssegnati.length > 0 && (
                                <span className="ml-auto text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-semibold">{taskAssegnati.length}</span>
                            )}
                        </button>
                    ))}
                    <div className="px-3 py-2 border-t border-gray-100 mt-1">
                        <button onClick={onLogout} className="text-xs text-red-400 hover:text-red-600">Esci</button>
                    </div>
                </div>
            )}

            {/* ── Sidebar desktop ── */}
            <aside className="hidden md:flex w-52 bg-white border-r border-gray-100 flex-col fixed left-0 top-0 bottom-0 z-10">
                {/* Logo */}
                <div className="px-5 py-5">
                    <h1 className="text-base font-bold text-gray-800 tracking-tight">TaskFlow</h1>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 flex flex-col gap-0.5">
                    {NAV.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setVistaAttiva(item.id)}
                            className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                                vistaAttiva === item.id
                                    ? "bg-blue-50 text-blue-700 font-medium"
                                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                            }`}
                        >
                            <span className="text-base">{item.icon}</span>
                            <span>{item.label}</span>
                            {item.id === "task" && taskAssegnati.length > 0 && (
                                <span className="ml-auto text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-semibold">
                                    {taskAssegnati.length}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>

                {/* User */}
                <div className="px-4 py-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">
                            {utente.nome?.[0]}{utente.cognome?.[0]}
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-700 truncate">{utente.nome} {utente.cognome}</p>
                            <p className="text-[10px] text-gray-400 truncate">{utente.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={onLogout}
                        className="text-xs text-red-400 hover:text-red-600 transition-colors"
                    >
                        Esci
                    </button>
                </div>
            </aside>

            {/* ── Contenuto principale ── */}
            <main className="md:ml-52 flex-1 px-4 md:px-8 py-8 mt-12 md:mt-0 min-h-screen">

                {/* Vista Progetti */}
                {vistaAttiva === "progetti" && (
                    <>
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-semibold text-gray-800">I tuoi progetti</h2>
                        </div>

                        <div className="relative mb-5 max-w-sm">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                            <input
                                type="text"
                                placeholder="Cerca progetto..."
                                value={searchProgetti}
                                onChange={e => setSearchProgetti(e.target.value)}
                                className="w-full pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
                            />
                        </div>

                        {loading ? (
                            <p className="text-gray-400 text-center mt-16">Caricamento...</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl">
                                {projects.filter(p => p.nome.toLowerCase().includes(searchProgetti.toLowerCase())).map((project, i) => {
                                    const totale = project.tasks?.length ?? 0
                                    const completati = project.tasks?.filter(t => t.stato === "completato").length ?? 0
                                    const progressoPct = totale > 0 ? Math.round((completati / totale) * 100) : 0
                                    const bandColor = BAND_COLORS[i % BAND_COLORS.length]

                                    return (
                                        <div
                                            key={project.id}
                                            onClick={() => onSelectProject(project)}
                                            className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden"
                                        >
                                            <div className={`${bandColor} h-10 relative`}>
                                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setEditingProject(project) }}
                                                        className="w-5 h-5 flex items-center justify-center rounded-full bg-white/60 hover:bg-white text-gray-500 hover:text-blue-500 text-xs transition-all"
                                                        title="Modifica progetto"
                                                    >
                                                        ✎
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDeleteProject(e, project.id)}
                                                        className="w-5 h-5 flex items-center justify-center rounded-full bg-white/60 hover:bg-white text-gray-500 hover:text-red-500 text-xs transition-all"
                                                        title="Elimina progetto"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="px-4 py-4">
                                                <h3 className="font-semibold text-gray-800 text-sm mb-1 truncate">{project.nome}</h3>
                                                {project.description ? (
                                                    <p className="text-xs text-gray-400 line-clamp-2 mb-4 leading-relaxed">{project.description}</p>
                                                ) : (
                                                    <div className="mb-4" />
                                                )}
                                                <div className="bg-gray-100 rounded-full h-1.5 mb-2">
                                                    <div
                                                        className="bg-emerald-400 rounded-full h-1.5 transition-all"
                                                        style={{ width: `${progressoPct}%` }}
                                                    />
                                                </div>
                                                <p className="text-xs text-gray-400">
                                                    {totale === 0 ? "Nessun task" : `${completati} di ${totale} completati`}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })}

                                <button
                                    onClick={() => setShowForm(true)}
                                    className="group bg-white rounded-2xl border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all flex flex-col items-center justify-center gap-2 min-h-36"
                                >
                                    <span className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center text-gray-400 group-hover:text-blue-500 text-xl transition-colors">+</span>
                                    <span className="text-xs text-gray-400 group-hover:text-blue-500 font-medium transition-colors">Nuovo progetto</span>
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* Vista Task miei */}
                {vistaAttiva === "task" && (
                    <>
                        <div className="mb-6">
                            <h2 className="text-lg font-semibold text-gray-800">Task assegnati a te</h2>
                            <p className="text-sm text-gray-400 mt-1">Task attivi nei progetti a cui partecipi</p>
                        </div>

                        {taskAssegnati.length === 0 ? (
                            <p className="text-gray-400 text-center mt-16">Nessun task assegnato al momento.</p>
                        ) : (
                            <div className="flex flex-col gap-3 max-w-2xl">
                                {taskAssegnati.map(task => (
                                    <div key={task.id} className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm">
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">{task.titolo}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">📁 {task.projects?.nome}</p>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0 ml-4">
                                            {task.scadenza && (
                                                <span className="text-xs text-gray-400">
                                                    📅 {new Date(task.scadenza + "T00:00:00").toLocaleDateString("it-IT")}
                                                </span>
                                            )}
                                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                                                task.stato === "in_corso"
                                                    ? "bg-amber-100 text-amber-600"
                                                    : "bg-gray-100 text-gray-500"
                                            }`}>
                                                {task.stato === "in_corso" ? "In corso" : "Da fare"}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* Vista Impostazioni */}
                {vistaAttiva === "impostazioni" && (
                    <>
                        <div className="mb-6">
                            <h2 className="text-lg font-semibold text-gray-800">Impostazioni</h2>
                            <p className="text-sm text-gray-400 mt-1">Gestisci il tuo profilo</p>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-md">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 text-lg font-bold flex items-center justify-center">
                                    {utente.nome?.[0]}{utente.cognome?.[0]}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-800">{utente.nome} {utente.cognome}</p>
                                    <p className="text-sm text-gray-400">{utente.email}</p>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </main>

            {showForm && (
                <ProjectForm
                    utente={utente}
                    onProjectAdded={fetchProjects}
                    onClose={() => setShowForm(false)}
                />
            )}
            {editingProject && (
                <ProjectForm
                    utente={utente}
                    project={editingProject}
                    onProjectAdded={fetchProjects}
                    onClose={() => setEditingProject(null)}
                />
            )}
        </div>
    )
}

export default Dashboard
