import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { motion } from 'framer-motion';

export const SignIn: React.FC = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { signIn } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        const { error } = await signIn(email, password)

        if (error) {
            setError(error.message)
            setLoading(false)
        } else {
            navigate('/dashboard')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-950 p-4 relative overflow-hidden">
            <div className="absolute inset-0 z-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #333 1px, transparent 0)', backgroundSize: '40px 40px' }} />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative w-full max-w-md z-10"
            >
                <div className="bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-800 p-8 space-y-8">

                    <div className="text-center space-y-2">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-neutral-800 rounded-xl mb-4 border border-neutral-700">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-semibold text-white tracking-tight">Welcome back</h1>
                        <p className="text-neutral-400 text-sm">Enter your credentials to access your account</p>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2"
                        >
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="email" className="block text-xs font-medium text-neutral-400 uppercase tracking-wider">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 transition-all text-sm"
                                placeholder="name@company.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label htmlFor="password" className="block text-xs font-medium text-neutral-400 uppercase tracking-wider">
                                    Password
                                </label>
                                <a href="#" className="text-xs text-neutral-500 hover:text-white transition-colors">Forgot password?</a>
                            </div>
                            <input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 transition-all text-sm"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 bg-white hover:bg-neutral-200 text-black font-medium rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-black" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Processing
                                </span>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    <div className="text-center pt-2">
                        <p className="text-sm text-neutral-500">
                            Don't have an account?{' '}
                            <Link to="/signup" className="text-white font-medium hover:underline">
                                Create account
                            </Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
