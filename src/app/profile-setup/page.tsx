'use client'

import React, { useState, useEffect } from 'react'
import { useUser } from '@/contexts/user-context'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ProfileSetup() {
  const { user } = useUser()
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [college, setCollege] = useState('')  // updated state variable
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function checkUserProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)  // changed from 'user_id' to 'id'
        .single()

      if (profile) {
        router.push('/')
      }
    }

    checkUserProfile()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Not logged in')
        return
      }

      const { data: existingUser } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .single()

      if (existingUser) {
        setError('Username already taken')
        return
      }

      const { error: insertError } = await supabase
        .from('users')
        .insert([
          {
            id: user.id,  // changed from user_id to id
            username,
            date_of_birth: dateOfBirth,
            college,  // updated to use 'college' instead of 'education'
          }
        ])

      if (insertError) throw insertError

      router.push('/')
    } catch (err: any) {
      setError(err.message || 'Error saving profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Complete Your Profile</h1>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 border rounded-md dark:bg-gray-700"
              pattern="[a-zA-Z0-9_]{3,20}"
              title="Username must be between 3 and 20 characters and can only contain letters, numbers, and underscores"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Date of Birth</label>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="w-full p-2 border rounded-md dark:bg-gray-700"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Place of Education</label>
            <input
              type="text"
              value={college}
              onChange={(e) => setCollege(e.target.value)}  // updated to setCollege
              className="w-full p-2 border rounded-md dark:bg-gray-700"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Complete Setup'}
          </button>
        </form>
      </div>
    </div>
  )
}
