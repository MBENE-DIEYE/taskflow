import { useState } from 'react'
import { supabase } from '../supabase'

const Login = ({ onLogin }) => {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isRegistro, setIsRegistro] = useState(false)
    const [nome, setNome] = useState("")
    const [cognome, setCognome] = useState("")
    const [loading, setLoading] = useState(false)
    const [errore, setErrore] = useState("")
    const [mostraPassword, setMostraPassword] = useState(false)
    const [isRecupero, setIsRecupero] = useState(false)
    const [emailRecupero, setEmailRecupero] = useState("")
    const [messaggioRecupero, setMessaggioRecupero] = useState("")

    const handleRecupero = async (e) => {
        e.preventDefault()
        setLoading(true)
        setErrore("")
        const { error } = await supabase.auth.resetPasswordForEmail(emailRecupero, {
            redirectTo: window.location.origin
        })
        if (error) {
            setErrore(error.message)
        } else {
            setMessaggioRecupero("Email inviata! Controlla la tua casella di posta.")
        }
        setLoading(false)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setErrore("")

        if (isRegistro) {
            const { data, error } = await supabase.auth.signUp({ email, password })

            if (error) {
                setErrore(error.message)
                setLoading(false)
                return
            }

            const { error: insertError } = await supabase
                .from("users")
                .insert({ id: data.user.id, nome, cognome, email })

            if (insertError) setErrore(insertError.message)
            else onLogin({ id: data.user.id, nome, cognome, email })
        } else {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password })

            if (error) {
                setErrore("Email o password errati !")
                setLoading(false)
                return
            }

            const { data: userData, error: userError } = await supabase
                .from("users")
                .select("*")
                .eq("id", data.user.id)
                .single()

            if (userError || !userData) setErrore("Utente non trovato")
            else onLogin(userData)
        }

        setLoading(false)
    }

    if (isRecupero) {
        return (
            <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
                <div className='bg-white rounded-2xl shadow-sm border border-blue-200 p-8 w-full max-w-md'>
                    <h1 className='text-2xl font-bold text-gray-800 mb-2'>Recupera password</h1>
                    <p className='text-gray-500 text-sm mb-6'>
                        Inserisci la tua email e ti mandiamo un link per reimpostare la password.
                    </p>

                    {errore && (
                        <div className='bg-red-50 text-red-500 text-sm px-4 py-3 rounded-xl mb-4'>{errore}</div>
                    )}
                    {messaggioRecupero ? (
                        <div className='bg-green-50 text-green-600 text-sm px-4 py-3 rounded-xl mb-4'>
                            {messaggioRecupero}
                        </div>
                    ) : (
                        <form onSubmit={handleRecupero} className='flex flex-col gap-4'>
                            <input
                                type="email"
                                name="email"
                                placeholder="La tua email"
                                value={emailRecupero}
                                onChange={e => setEmailRecupero(e.target.value)}
                                required
                                autoComplete="email"
                                className="px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
                            />
                            <button
                                type='submit'
                                disabled={loading}
                                className='bg-blue-500 text-white px-6 py-2 rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50'
                            >
                                {loading ? "Invio..." : "Invia link di recupero"}
                            </button>
                        </form>
                    )}

                    <p className="text-sm text-gray-500 text-center mt-4">
                        <button onClick={() => { setIsRecupero(false); setErrore(""); setMessaggioRecupero("") }}
                            className="text-blue-500 hover:underline">
                            ← Torna al login
                        </button>
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
            <div className='bg-white rounded-2xl shadow-sm border border-blue-200 p-8 w-full max-w-md'>
                <h1 className='text-2xl font-bold text-gray-800 mb-2'>
                    {isRegistro ? "Crea account" : "Bentornato !"}
                </h1>
                <p className='text-gray-500 text-sm mb-6'>
                    {isRegistro ? "Registrati su TaskFlow" : "Accedi a TaskFlow"}
                </p>

                {errore && (
                    <div className='bg-red-50 text-red-500 text-sm px-4 py-3 rounded-xl mb-4'>
                        {errore}
                    </div>
                )}

                <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
                    {isRegistro && (
                        <>
                            <input
                                type="text"
                                name="given-name"
                                placeholder='Nome'
                                value={nome}
                                onChange={e => setNome(e.target.value)}
                                required
                                autoComplete="given-name"
                                className='px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-300'
                            />
                            <input
                                type="text"
                                name="family-name"
                                placeholder='Cognome'
                                value={cognome}
                                onChange={e => setCognome(e.target.value)}
                                required
                                autoComplete="family-name"
                                className='px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-300'
                            />
                        </>
                    )}
                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        className="px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                    <div className="relative">
                        <input
                            type={mostraPassword ? "text" : "password"}
                            name="password"
                            placeholder="Password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            autoComplete={isRegistro ? "new-password" : "current-password"}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-300 pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setMostraPassword(!mostraPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            {mostraPassword ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            )}
                        </button>
                    </div>
                    <button
                        type='submit'
                        disabled={loading}
                        className='bg-blue-100 text-blue-700 px-6 py-2 rounded-xl hover:bg-blue-200 transition-colors disabled:opacity-50'
                    >
                        {loading ? "Caricamento..." : isRegistro ? "Registrati" : "Accedi"}
                    </button>
                </form>

                <p className="text-sm text-gray-500 text-center mt-4">
                    {isRegistro ? "Hai già un account ?" : "Non hai un account ?"}
                    <button
                        onClick={() => setIsRegistro(!isRegistro)}
                        className="text-blue-500 ml-1 hover:underline"
                    >
                        {isRegistro ? "Accedi" : "Registrati"}
                    </button>
                </p>

                {!isRegistro && (
                    <p className="text-sm text-gray-500 text-center mt-2">
                        <button
                            onClick={() => { setIsRecupero(true); setErrore("") }}
                            className="text-gray-400 hover:text-blue-500 hover:underline transition-colors"
                        >
                            Password dimenticata?
                        </button>
                    </p>
                )}
            </div>
        </div>
    )
}

export default Login
