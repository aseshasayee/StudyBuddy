'use client'

import { useUser } from '@/contexts/user-context'
import { supabase } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface UserProfile {
  username: string
  full_name: string | null
  bio: string | null
  email: string
  created_at: string
}

export default function ProfilePage() {
  const { user } = useUser()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          router.push('/login')
          return
        }

        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single()

        if (error) throw error
        setProfile(data)
        setIsLoading(false)
      } catch (error) {
        console.error('Error fetching profile:', error)
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
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-32"></div>
        <div className="px-6 py-4">
          <div className="relative">
            <div className="absolute -top-16 left-1/2 transform -translate-x-1/2">
              <div className="w-32 h-32 rounded-full bg-gray-300 border-4 border-white dark:border-gray-800 overflow-hidden">
                <div className="w-full h-full flex items-center justify-center text-4xl bg-gray-200 dark:bg-gray-700">
                  {profile?.username?.[0]?.toUpperCase() || '?'}
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-20 text-center">
            <h1 className="text-2xl font-bold">{profile?.username}</h1>
            <p className="text-gray-600 dark:text-gray-400">{profile?.full_name || 'No name set'}</p>
          </div>

          <div className="mt-6 space-y-4">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h2 className="font-semibold mb-2">Bio</h2>
              <p className="text-gray-600 dark:text-gray-300">{profile?.bio || 'No bio yet'}</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h2 className="font-semibold mb-2">Contact</h2>
              <p className="text-gray-600 dark:text-gray-300">{profile?.email}</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h2 className="font-semibold mb-2">Member Since</h2>
              <p className="text-gray-600 dark:text-gray-300">
                {new Date(profile?.created_at || '').toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <button className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600">
              Edit Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}