import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { SidebarDemo } from '@/components/ui/sidebar-demo'
import { SignIn } from '@/pages/SignIn'
import { SignUp } from '@/pages/SignUp'
import './App.css'

function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    {/* Public routes */}
                    <Route path="/signin" element={<SignIn />} />
                    <Route path="/signup" element={<SignUp />} />

                    {/* Protected routes */}
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <div className="w-full h-screen">
                                    <SidebarDemo />
                                </div>
                            </ProtectedRoute>
                        }
                    />

                    {/* Default redirect */}
                    <Route path="/" element={<Navigate to="/signin" replace />} />
                    <Route path="*" element={<Navigate to="/signin" replace />} />
                </Routes>
            </AuthProvider>
        </Router>
    )
}

export default App

