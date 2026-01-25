import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface ProtectedRouteProps {
    children: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
                <div className="text-center space-y-4">
                    <div className="inline-block p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full animate-pulse">
                        <svg className="w-12 h-12 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </div>
                    <p className="text-white text-lg font-medium">Loading...</p>
                </div>
            </div>
        )
    }

    if (!user) {
        return <Navigate to="/signin" replace />
    }

    return <>{children}</>
}
