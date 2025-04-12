'use client'

import { useState } from 'react'
import { useUser } from '@/contexts/user-context'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ProfileSetup() {
  const { user } = useUser()
  const router = useRouter()
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    username: '',
    college: '',
    semester: 1,
    level: 1
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      if (!user) throw new Error('No user found')

      const { error: updateError } = await supabase
        .from('users')
        .update({
          username: formData.username,
          college: formData.college,
          semester: formData.semester,
          level: formData.level,
          login_streak: 1
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      router.push('/dashboard')
    } catch (err: any) {
      console.error('Error:', err)
      setError('Error saving profile')
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-white mb-6">Complete Your Profile</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-300 mb-2">Username</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full p-3 rounded bg-gray-700 text-white"
              required
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">College</label>
            <input
              type="text"
              value={formData.college}
              onChange={(e) => setFormData({ ...formData, college: e.target.value })}
              className="w-full p-3 rounded bg-gray-700 text-white"
              required
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Semester</label>
            <input
              type="number"
              min="1"
              max="8"
              value={formData.semester}
              onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}
              className="w-full p-3 rounded bg-gray-700 text-white"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-3 rounded hover:bg-blue-600"
          >
            Complete Setup
          </button>
        </form>
      </div>
    </div>
  )
}