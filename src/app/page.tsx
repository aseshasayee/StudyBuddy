'use client'

import React, { useState, useEffect } from 'react'  // Add explicit React import
import { useUser } from '@/contexts/user-context'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Trophy } from 'lucide-react'
import Image from 'next/image'
import darkForest from '../../images/dark-forest.png'
import Logo from '../../images/logo.svg'

export default function Home() {
  const { user } = useUser()
  const router = useRouter()
  const [username, setUsername] = useState('')  // Now useState should be defined

  useEffect(() => {
    async function fetchUsername() {
      if (user) {
        const { data } = await supabase
          .from('users')
          .select('username, name')
          .eq('id', user.id)
          .single()
        
        if (data) {
          setUsername(data.username || data.name || 'User')
        }
      }
    }
    fetchUsername()
  }, [user])

  return (
    <div 
      style={{ 
        backgroundImage: `url(${darkForest.src})`,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        minHeight: '100vh',
        width: '100vw',
        overflowX: 'hidden'
      }}
    >
      <div className="relative container mx-auto px-4 py-8 space-y-8">
        <div className="text-center space-y-4 py-12">
          <div className="flex items-center justify-center gap-2">
            <Image
              src={Logo}
              alt="StudyBuddy Logo"
              width={32}
              height={32}
            />
            <span className="text-2xl font-semibold">StudyBuddy</span>
          </div>
          <h1 className="text-3xl font-bold">
            Welcome, {username || 'Guest'} 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Let's make today productive!
          </p>
          <div className="inline-block bg-yellow-100 dark:bg-yellow-900/50 px-6 py-2 rounded-full">
            <Link 
              href="/leaderboard"
              className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/80 backdrop-blur-lg rounded-full text-white hover:bg-yellow-600/80 transition-all cursor-pointer"
            >
              <Trophy className="w-5 h-5" />
              Leaderboard
            </Link>
          </div>
        </div>

        <div className="max-w-4xl mx-auto bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-6">☁️ Today's Smart Plan</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <span>📚</span>
                <div>
                  <h3 className="font-medium">Math</h3>
                  <p className="text-sm text-gray-500">10:00 AM - 11:00 AM</p>
                </div>
              </div>
              <button className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600">
                Start
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <span>✏️</span>
                <div>
                  <h3 className="font-medium">Physics</h3>
                  <p className="text-sm text-gray-500">2:00 PM - 3:00 PM</p>
                </div>
              </div>
              <button className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600">
                Start
              </button>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            📊 Progress: 0%
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold mb-6">🚀 Quick Access</h2>
          <div className="grid grid-cols-3 gap-4">
            <a 
              href="/dashboard" 
              onClick={(e) => {
                e.preventDefault()
                if (user) {
                  router.push('/dashboard')
                } else {
                  router.push('/login')
                }
              }}
              className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-center hover:shadow-xl transition-shadow cursor-pointer"
            >
              <span className="text-2xl mb-2">📊</span>
              <p className="font-medium">Dashboard</p>
            </a>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-center hover:shadow-xl transition-shadow cursor-pointer">
              <span className="text-2xl mb-2">📝</span>
              <p className="font-medium">Flashcards</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-center hover:shadow-xl transition-shadow cursor-pointer">
              <span className="text-2xl mb-2">📅</span>
              <p className="font-medium">Study Planner</p>
            </div>
            <a href="/ai-tutor" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-center hover:shadow-xl transition-shadow cursor-pointer">
              <span className="text-2xl mb-2">🤖</span>
              <p className="font-medium">AI Tutor</p>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
