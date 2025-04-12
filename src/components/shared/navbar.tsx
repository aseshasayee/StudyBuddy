'use client'

import { useState } from 'react'
import { useUser } from '@/contexts/user-context'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function Navbar() {
  const { user, setUser } = useUser()  // Add setUser
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    if (isLoggingOut) return
    
    setIsLoggingOut(true)
    try {
      await supabase.auth.signOut()
      setUser(null)  // Clear user from context
      localStorage.clear()  // Clear any stored session data
      window.location.href = '/login'  // Redirect to login
    } catch (error) {
      console.error('Error logging out:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <nav className="backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <span className="text-2xl">📚</span>
          <span className="font-bold text-xl">StudyBuddy</span>
        </a>
        <div className="flex items-center gap-4">
          <a href="/" className="hover:text-blue-500">Home</a>
          {user ? (
            <>
              <a href="/dashboard" className="hover:text-blue-500">Dashboard</a>
              <a href="/ai-tutor" className="hover:text-blue-500">AI Tutor</a>
              <a href="/profile" className="hover:text-blue-500">Profile</a>
              <button 
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 disabled:opacity-50"
              >
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <a 
                href="/login"
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
              >
                Login
              </a>
              <a 
                href="/signup"
                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
              >
                Sign Up
              </a>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}