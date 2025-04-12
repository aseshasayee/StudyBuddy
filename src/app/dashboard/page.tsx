'use client'

import { useUser } from '@/contexts/user-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function Dashboard() {
  const { user } = useUser()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [username, setUsername] = useState('')

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          router.push('/login')
          return
        }

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('username')
          .eq('user_id', session.user.id)
          .single()
        
        if (profile) {
          setUsername(profile.username)
        }
        setIsLoading(false)
      } catch (error) {
        console.error('Error checking session:', error)
        setIsLoading(false)
      }
    }

    checkSession()
  }, [router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null // Router will handle redirect
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search..."
          className="w-full p-3 pl-10 rounded-lg bg-white/10 backdrop-blur-lg border border-gray-200 dark:border-gray-700"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2">🔍</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Planner Section */}
        <div className="bg-gradient-to-br from-cyan-400 to-blue-500 p-6 rounded-2xl shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Planner</h2>
            <button className="text-white hover:opacity-80">View All</button>
          </div>
          <div className="space-y-3">
            <div className="bg-white/20 backdrop-blur p-4 rounded-lg text-white">
              <div className="flex items-center gap-2">
                <span>📚</span>
                <div>
                  <h3 className="font-medium">Math Homework</h3>
                  <p className="text-sm opacity-80">10:00AM to 11:00AM</p>
                </div>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur p-4 rounded-lg text-white">
              <div className="flex items-center gap-2">
                <span>🧪</span>
                <div>
                  <h3 className="font-medium">Chemistry Homework</h3>
                  <p className="text-sm opacity-80">12:00PM to 01:00PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Progress */}
        <div className="bg-gradient-to-br from-cyan-400 to-blue-500 p-6 rounded-2xl shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Weekly Progress</h2>
            <button className="text-white hover:opacity-80">View All</button>
          </div>
          <div className="flex flex-col items-center justify-center h-48">
            <div className="relative w-32 h-32">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold text-white">75%</span>
              </div>
              <svg className="w-full h-full" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.2)"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="3"
                  strokeDasharray="75, 100"
                />
              </svg>
            </div>
            <p className="text-white mt-4">75% Progress</p>
          </div>
        </div>

        {/* Courses Section */}
        <div className="bg-gradient-to-br from-cyan-400 to-blue-500 p-6 rounded-2xl shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Courses For You</h2>
            <button className="text-white hover:opacity-80">View All</button>
          </div>
          <div className="space-y-3">
            <div className="bg-white/20 backdrop-blur p-4 rounded-lg text-white flex justify-between items-center">
              <span>Prompt Engineering</span>
              <button className="bg-white/20 p-2 rounded-full">➜</button>
            </div>
            <div className="bg-white/20 backdrop-blur p-4 rounded-lg text-white flex justify-between items-center">
              <span>Data Analytics</span>
              <button className="bg-white/20 p-2 rounded-full">➜</button>
            </div>
          </div>
        </div>

        {/* Calendar Section */}
        <div className="bg-gradient-to-br from-cyan-400 to-blue-500 p-6 rounded-2xl shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Calendar</h2>
            <button className="text-white hover:opacity-80">View All</button>
          </div>
          <div className="flex flex-col items-center justify-center h-48">
            <span className="text-5xl mb-4">📅</span>
            <p className="text-white text-xl">3-Day Streak</p>
          </div>
        </div>
      </div>
    </div>
  )
}