'use client'

import { useState } from 'react'
import { useUser } from '@/contexts/user-context'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
// Add this import at the top of the file
import Image from 'next/image'
import Logo from '../../../images/logo.svg'

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
    <nav className="backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-b border-gray-200 dark:border-gray-700 shadow-sm fixed w-full top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 hover:scale-105 transition-all duration-300">
          <Image
            src={Logo}
            alt="StudyBuddy Logo"
            width={32}
            height={32}
            className="hover:rotate-12 transition-transform duration-300"
          />
          <span className="font-bold text-xl bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">StudyBuddy</span>
        </a>
        <div className="flex-1 flex items-center justify-center space-x-8">
          <div className="flex items-center space-x-8">
            <a href="/" className="relative group px-2 py-1 hover:scale-105 transition-transform duration-300">
              <span className="relative z-10">Home</span>
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
            </a>
            {user ? (
              <>
                <a href="/dashboard" className="relative group px-2 py-1 hover:scale-105 transition-transform duration-300">
                  <span className="relative z-10">Dashboard</span>
                  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                </a>
                <a href="/ai-tutor" className="relative group px-2 py-1 hover:scale-105 transition-transform duration-300">
                  <span className="relative z-10">AI Tutor</span>
                  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                </a>
                <a href="/profile" className="relative group px-2 py-1 hover:scale-105 transition-transform duration-300">
                  <span className="relative z-10">Profile</span>
                  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                </a>
              </>
            ) : null}
          </div>
          {user ? (
            <button 
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="absolute right-4 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 disabled:opacity-50 hover:scale-105 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </button>
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