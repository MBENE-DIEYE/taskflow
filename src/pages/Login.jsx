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

    return (
        <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
            <div className='bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-md'>
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
                                placeholder='Nome'
                                value={nome}
                                onChange={e => setNome(e.target.value)}
                                required
                                className='px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-300'
                            />
                            <input
                                type="text"
                                placeholder='Cognome'
                                value={cognome}
                                onChange={e => setCognome(e.target.value)}
                                required
                                className='px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-300'
                            />
                        </>
                    )}
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        className="px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        className="px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                    <button
                        type='submit'
                        disabled={loading}
                        className='bg-green-800 text-white px-6 py-2 rounded-xl hover:bg-green-900 transition-colors disabled:opacity-50'
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
            </div>
        </div>
    )
}

export default Login
