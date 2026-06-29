import { useState } from 'react'
import { supabase } from '../supabase'

const ResetPassword = ({ onComplete }) => {
    const [password, setPassword] = useState("")
    const [conferma, setConferma] = useState("")
    const [loading, setLoading] = useState(false)
    const [errore, setErrore] = useState("")
    const [mostraPassword, setMostraPassword] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (password !== conferma) {
            setErrore("Le password non coincidono")
            return
        }
        if (password.length < 6) {
            setErrore("La password deve essere di almeno 6 caratteri")
            return
        }
        setLoading(true)
        setErrore("")
        const { error } = await supabase.auth.updateUser({ password })
        if (error) {
            setErrore(error.message)
            setLoading(false)
            return
        }
        onComplete()
    }

    const EyeIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
    )

    const EyeOffIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
    )

    return (
        <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
            <div className='bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-md'>
                <h1 className='text-2xl font-bold text-gray-800 mb-2'>Nuova password</h1>
                <p className='text-gray-500 text-sm mb-6'>Scegli una nuova password per il tuo account.</p>

                {errore && (
                    <div className='bg-red-50 text-red-500 text-sm px-4 py-3 rounded-xl mb-4'>{errore}</div>
                )}

                <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
                    <div className="relative">
                        <input
                            type={mostraPassword ? "text" : "password"}
                            placeholder="Nuova password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            autoComplete="new-password"
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-300 pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setMostraPassword(!mostraPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            {mostraPassword ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                    </div>

                    <input
                        type={mostraPassword ? "text" : "password"}
                        placeholder="Conferma nuova password"
                        value={conferma}
                        onChange={e => setConferma(e.target.value)}
                        required
                        autoComplete="new-password"
                        className="px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />

                    <button
                        type='submit'
                        disabled={loading}
                        className='bg-green-800 text-white px-6 py-2 rounded-xl hover:bg-green-900 transition-colors disabled:opacity-50'
                    >
                        {loading ? "Salvataggio..." : "Salva nuova password"}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default ResetPassword
