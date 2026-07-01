import { useState } from "react"

const NAV = [
    { id: "progetti", label: "Progetti", icon: "📋" },
    { id: "task",     label: "Task miei", icon: "✅" },
    { id: "impostazioni", label: "Impostazioni", icon: "⚙️" },
]

const Layout = ({ utente, onLogout, vistaAttiva, onNavClick, taskAssegnatiCount, children }) => {
    const [showMobileMenu, setShowMobileMenu] = useState(false)

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
                            onClick={() => { onNavClick(item.id); setShowMobileMenu(false) }}
                            className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                                vistaAttiva === item.id ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-500 hover:bg-gray-50"
                            }`}
                        >
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                            {item.id === "task" && taskAssegnatiCount > 0 && (
                                <span className="ml-auto text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-semibold">{taskAssegnatiCount}</span>
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
                <div className="px-5 py-5">
                    <h1 className="text-base font-bold text-gray-800 tracking-tight">TaskFlow</h1>
                </div>
                <nav className="flex-1 px-3 flex flex-col gap-0.5">
                    {NAV.map(item => (
                        <button
                            key={item.id}
                            onClick={() => onNavClick(item.id)}
                            className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                                vistaAttiva === item.id
                                    ? "bg-blue-50 text-blue-700 font-medium"
                                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                            }`}
                        >
                            <span className="text-base">{item.icon}</span>
                            <span>{item.label}</span>
                            {item.id === "task" && taskAssegnatiCount > 0 && (
                                <span className="ml-auto text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-semibold">
                                    {taskAssegnatiCount}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>
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
                    <button onClick={onLogout} className="text-xs text-red-400 hover:text-red-600 transition-colors">
                        Esci
                    </button>
                </div>
            </aside>

            {/* ── Contenuto ── */}
            <div className="md:ml-52 flex-1">
                {children}
            </div>
        </div>
    )
}

export default Layout
