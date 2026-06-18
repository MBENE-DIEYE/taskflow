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
            const { error } = await supabase
                .from("users")
                .insert({ nome, cognome, email, password_hash: password })

            if (error) setErrore(error.message)
            else onLogin({ nome, cognome, email })
        } else {
            const { data, error } = await supabase
                .from("users")
                .select("*")
                .eq("email", email)
                .eq("password_hash", password)
                .single()

            if (error || !data) setErrore("Email o password errati !")
            else onLogin(data)
        }

        setLoading(false)
    }

    return (
        <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
            <div className='bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-md'>
                <h1 className='text-2xl font-bold text-gray-800 mb-2'>
                    {isRegistro ? "Crea account" : "Bentornata !"}
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
                        className='bg-blue-500 text-white px-6 py-2 rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50'
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