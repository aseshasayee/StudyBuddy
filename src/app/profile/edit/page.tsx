'use client'

import { useUser } from '@/contexts/user-context'
import { supabase } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function EditProfilePage() {
  const { user } = useUser()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    username: '',
    name: '',
    bio: '',
    college: '',
    semester: 1,
  })

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        router.push('/login')
        return
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .select('username, name, bio, college, semester')
          .eq('id', user.id)
          .single()

        if (error) throw error

        if (data) {
          setFormData({
            username: data.username || '',
            name: data.name || '',
            bio: data.bio || '',
            college: data.college || '',
            semester: data.semester || 1,
          })
        }
      } catch (error: any) {
        console.error('Error fetching profile:', error)
        setError('Failed to fetch profile')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (!user) throw new Error('No session')

      const { error } = await supabase
        .from('users')
        .update({
          username: formData.username,
          name: formData.name,
          bio: formData.bio || null,
          college: formData.college,
          semester: formData.semester,
        })
        .eq('id', user.id)

      if (error) throw error

      router.push('/profile')
    } catch (error: any) {
      console.error('Update error:', error)
      setError('Failed to update profile')
    }
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>

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
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full p-2 border rounded-md dark:bg-gray-700"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Full Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2 border rounded-md dark:bg-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full p-2 border rounded-md dark:bg-gray-700"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">College</label>
            <input
              type="text"
              value={formData.college}
              onChange={(e) => setFormData({ ...formData, college: e.target.value })}
              className="w-full p-2 border rounded-md dark:bg-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Semester</label>
            <input
              type="number"
              value={formData.semester}
              onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) || 1 })}
              className="w-full p-2 border rounded-md dark:bg-gray-700"
              min="1"
              max="8"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600"
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={() => router.push('/profile')}
              className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
