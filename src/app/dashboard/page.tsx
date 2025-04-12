'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/contexts/user-context'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Plus } from 'lucide-react'

interface Task {
  id: string
  user_id: string
  title: string
  due_date: string
  is_completed: boolean
  created_at: string
}

interface Course {
  id: string
  user_id: string
  course_name: string
  course_code: string
  created_at: string
}

export default function Dashboard() {
  const { user } = useUser()
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [newTask, setNewTask] = useState({ name: '', deadline: '' })
  const [newCourse, setNewCourse] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [profileId, setProfileId] = useState<string | null>(null)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          router.push('/login')
          return
        }

        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (!userProfile) {
          router.push('/profile/setup')
          return
        }

        const { data: tasksData } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', session.user.id)
          .order('due_date', { ascending: true })

        const { data: coursesData } = await supabase
          .from('courses')
          .select('*')
          .eq('user_id', session.user.id)

        if (tasksData) setTasks(tasksData)
        if (coursesData) setCourses(coursesData)
        setIsLoading(false)
      } catch (error) {
        console.error('Error:', error)
        setIsLoading(false)
      }
    }

    checkSession()
  }, [router])

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !newTask.name || !newTask.deadline) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No active session')

      const { data, error } = await supabase
        .from('tasks')
        .insert([
          {
            user_id: session.user.id,
            title: newTask.name,
            due_date: new Date(newTask.deadline).toISOString(),
            is_completed: false,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single()

      if (error) throw error

      if (data) {
        setTasks([...tasks, data])
        setNewTask({ name: '', deadline: '' })
      }
    } catch (error: any) {
      console.error('Error details:', error)
      alert('Failed to add task. Please try again.')
    }
  }

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !newCourse) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No active session')

      const { data, error } = await supabase
        .from('courses')
        .insert([
          {
            user_id: session.user.id,
            course_name: newCourse,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single()

      if (error) throw error

      if (data) {
        setCourses([...courses, data])
        setNewCourse('')
      }
    } catch (error: any) {
      console.error('Error details:', error)
      alert('Failed to add course. Please try again.')
    }
  }

  if (isLoading) return <div>Loading...</div>

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
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
          <h2 className="text-xl font-bold text-white mb-4">Planner</h2>
          <form onSubmit={handleAddTask} className="mb-4 space-y-2">
            <input
              type="text"
              placeholder="New task name"
              value={newTask.name}
              onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
              className="w-full p-2 rounded-lg bg-white/20 backdrop-blur text-white placeholder-white/70"
            />
            <input
              type="date"
              value={newTask.deadline}
              onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
              className="w-full p-2 rounded-lg bg-white/20 backdrop-blur text-white"
            />
            <button
              type="submit"
              className="w-full bg-white/20 backdrop-blur p-2 rounded-lg text-white hover:bg-white/30"
            >
              Add Task
            </button>
          </form>

          <div className="space-y-3">
            {tasks.length === 0 ? (
              <div className="bg-white/20 backdrop-blur p-4 rounded-lg text-white text-center">
                No tasks scheduled
              </div>
            ) : (
              tasks.map((task) => (
                <div key={task.id} className="bg-white/20 backdrop-blur p-4 rounded-lg text-white">
                  <h3 className="font-medium">{task.title}</h3>
                  <p className="text-sm opacity-80">
                    {new Date(task.due_date).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Weekly Progress */}
        <div className="bg-gradient-to-br from-cyan-400 to-blue-500 p-6 rounded-2xl shadow-lg">
          <h2 className="text-xl font-bold text-white mb-4">Weekly Progress</h2>
          <div className="flex flex-col items-center justify-center h-48">
            <div className="relative w-32 h-32">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold text-white">75%</span>
              </div>
              <svg className="w-full h-full" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.2)"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
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
          <h2 className="text-xl font-bold text-white mb-4">Courses For You</h2>
          <form onSubmit={handleAddCourse} className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add new course"
                value={newCourse}
                onChange={(e) => setNewCourse(e.target.value)}
                className="flex-1 p-2 rounded-lg bg-white/20 backdrop-blur text-white placeholder-white/70"
              />
              <button
                type="submit"
                className="bg-white/20 backdrop-blur p-2 rounded-lg text-white hover:bg-white/30"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </form>

          <div className="space-y-3">
            {courses.length === 0 ? (
              <div className="bg-white/20 backdrop-blur p-4 rounded-lg text-white text-center">
                No courses added
              </div>
            ) : (
              courses.map((course) => (
                <div key={course.id} className="bg-white/20 backdrop-blur p-4 rounded-lg text-white flex justify-between items-center">
                  <span>{course.course_name}</span>
                  <button className="bg-white/20 p-2 rounded-full">➜</button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Calendar Section */}
        <div className="bg-gradient-to-br from-cyan-400 to-blue-500 p-6 rounded-2xl shadow-lg">
          <h2 className="text-xl font-bold text-white mb-4">Calendar</h2>
          <div className="flex flex-col items-center justify-center h-48">
            <span className="text-5xl mb-4">📅</span>
            <p className="text-white text-xl">3-Day Streak</p>
          </div>
        </div>
      </div>
    </div>
  )
}
