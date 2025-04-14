'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/contexts/user-context'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { 
  Plus, Calendar, BookOpen, BarChart2, Upload, 
  Clock, CheckCircle, PenTool, Lightbulb, AlertCircle,
  Trash2, MoreHorizontal
} from 'lucide-react'

interface Task {
  id: string
  user_id: string
  title: string
  due_date: string
  is_completed: boolean
  created_at: string
  course_id?: string
  description?: string
}

interface Course {
  id: string
  user_id: string
  course_name: string
  course_code?: string
  description?: string
  progress?: number
  last_activity?: string
  created_at: string
  total_files?: number
  completed_files?: number
}

interface StudyStats {
  totalTime: string
  weekStreak: number
  filesUploaded: number
  tutorSessions: number
}

export default function Dashboard() {
  const { user } = useUser()
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [newTask, setNewTask] = useState({ name: '', deadline: '' })
  const [newCourse, setNewCourse] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [weeklyProgress, setWeeklyProgress] = useState(75) 
  const [studyPlan, setStudyPlan] = useState<string | null>(null);
  const [showStudyPlanModal, setShowStudyPlanModal] = useState(false);// Example progress percentage
  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [courseFormData, setCourseFormData] = useState({
    name: '',
    description: '',
    code: ''
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [studyStats, setStudyStats] = useState<StudyStats>({
    totalTime: '0h 0m',
    weekStreak: 0,
    filesUploaded: 0,
    tutorSessions: 0
  })
  const [timerActive, setTimerActive] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerDuration, setTimerDuration] = useState(25 * 60) // Default 25 minutes
  const [showTimerModal, setShowTimerModal] = useState(false)
  const [showAddNoteModal, setShowAddNoteModal] = useState(false)
  const [noteForm, setNoteForm] = useState({
    title: '',
    content: '',
    courseId: ''
  })
  const [calendarDates, setCalendarDates] = useState<Date[]>([])
  const [calendarTasks, setCalendarTasks] = useState<{[key: string]: Task[]}>({})
  const [activeTab, setActiveTab] = useState('upcoming')

  // Demo courses for development
  

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

        // Use either real data or demo data for development
        if (coursesData && coursesData.length > 0) {
          setCourses(coursesData)
        } 
        
        if (tasksData) setTasks(tasksData)
        setIsLoading(false)
        
        // Initialize calendar
        initializeCalendar(tasksData || [])
      } catch (error) {
        console.error('Error:', error)
        // Fallback to demo data
        
        setIsLoading(false)
      }
    }

    checkSession()
  }, [router])

  // Timer functionality
  // Timer functionality
useEffect(() => {
  let interval: NodeJS.Timeout | null = null;

  if (timerActive && timerSeconds > 0) {
    interval = setInterval(() => {
      setTimerSeconds((seconds) => seconds - 1);
    }, 1000);
  } else if (timerSeconds === 0 && timerActive) {
    setTimerActive(false);
    if (timerDuration > 0) {
      alert("Time's up! Study session complete.");
      recordStudySession(timerDuration);
    }
  }

  return () => {
    if (interval) clearInterval(interval);
  };
}, [timerActive, timerSeconds, timerDuration]);

const startTimer = () => {
  setTimerSeconds(timerDuration);
  setTimerActive(true);
  setShowTimerModal(false);
};

const pauseTimer = () => {
  setTimerActive(false);
};

const resetTimer = () => {
  setTimerActive(false);
  setTimerSeconds(timerDuration);
};

  const recordStudySession = async (durationMinutes: number) => {
    if (!user) return;
    
    try {
      // First, get current stats
      const { data: currentStats, error: statsError } = await supabase
        .from('study_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (statsError && statsError.code !== 'PGRST116') {
        throw statsError;
      }
      
      const minutesStudied = Math.floor(durationMinutes / 60);
      
      if (currentStats) {
        // Update existing stats
        await supabase
          .from('study_stats')
          .update({
            total_time_minutes: currentStats.total_time_minutes + minutesStudied
          })
          .eq('user_id', user.id);
      } else {
        // Create new stats record
        await supabase
          .from('study_stats')
          .insert([{
            user_id: user.id,
            total_time_minutes: minutesStudied,
            week_streak: 1,
            files_uploaded: 0,
            tutor_sessions: 0
          }]);
      }
      
      // Update local state
      setStudyStats(prev => ({
        ...prev,
        totalTime: formatStudyTime((parseInt(prev.totalTime.split('h')[0]) * 60) + 
                 (parseInt(prev.totalTime.split('h')[1].replace('m', '').trim()) || 0) + 
                 minutesStudied)
      }));
      
    } catch (error) {
      console.error('Error recording study session:', error);
    }
  };

  const formatTimerDisplay = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calendar initialization
  const initializeCalendar = (tasksList: Task[]) => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Get the first day of the month
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    
    // Get the last day of the month
    const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Create calendar dates array
    const dates: Date[] = [];
    
    // Add empty slots for days before the first of the month
    for (let i = 0; i < firstDay; i++) {
      dates.push(null as unknown as Date); // Push empty slots
    }
    
    // Add dates for the current month
    for (let i = 1; i <= lastDay; i++) {
      dates.push(new Date(currentYear, currentMonth, i));
    }
    
    setCalendarDates(dates);
    
    // Group tasks by date for the calendar
    const tasksByDate: {[key: string]: Task[]} = {};
    
    tasksList.forEach(task => {
      const dateKey = new Date(task.due_date).toDateString();
      if (!tasksByDate[dateKey]) {
        tasksByDate[dateKey] = [];
      }
      tasksByDate[dateKey].push(task);
    });
    
    setCalendarTasks(tasksByDate);
  };

  // Study stats formatting and fetching
  const formatStudyTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  useEffect(() => {
    const fetchStudyStats = async () => {
      if (!user) return;
      try {
        const { data: stats, error } = await supabase
          .from('study_stats')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') throw error;

        if (stats) {
          setStudyStats({
            totalTime: formatStudyTime(stats.total_time_minutes),
            weekStreak: stats.week_streak,
            filesUploaded: stats.files_uploaded,
            tutorSessions: stats.tutor_sessions
          });
        }
      } catch (error) {
        console.error('Error fetching study stats:', error);
      }
    };

    fetchStudyStats();
  }, [user]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTask.name || !newTask.deadline) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');

      const newTaskData = {
        user_id: session.user.id,
        title: newTask.name,
        due_date: new Date(newTask.deadline).toISOString(),
        is_completed: false,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert([newTaskData])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setTasks([...tasks, data]);
        setNewTask({ name: '', deadline: '' });
        
        // Update calendar
        const dateKey = new Date(data.due_date).toDateString();
        setCalendarTasks(prev => ({
          ...prev,
          [dateKey]: [...(prev[dateKey] || []), data]
        }));
      }
    } catch (error: any) {
      console.error('Error details:', error);
      alert('Failed to add task. Please try again.');
    }
  };
  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newCourse) return;
  
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');
  
      const newCourseData = {
        user_id: session.user.id,
        course_name: newCourse,
        course_code: '',
        description: '',
        progress: 0,
        last_activity: new Date().toISOString(),
        created_at: new Date().toISOString(),
        total_files: 0,        
      };
  
      console.log('Inserting course:', newCourseData);
  
      const { data, error } = await supabase
        .from('courses')
        .insert([newCourseData])
        .select()
        .single();
  
      if (error) {
        console.error('Supabase Insert Error:', error);
        alert(`Failed to add course: ${error.message}`);
        return;
      }
  
      console.log('Course added successfully:', data);
  
      if (data) {
        setCourses([...courses, data]);
        setNewCourse('');
      }
    } catch (error: any) {
      console.error('Error details:', error);
      alert(`Failed to add course: ${error.message}`);
    }
  };
  const handleDeleteCourse = async (e: React.MouseEvent, courseId: string) => {
    e.stopPropagation();
  
    if (!confirm("Are you sure you want to delete this course?")) return;
  
    try {
      console.log('Deleting course with ID:', courseId);
  
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);
  
      if (error) {
        console.error('Supabase Delete Error:', error);
        alert(`Failed to delete course: ${error.message}`);
        return;
      }
  
      setCourses(courses.filter(course => course.id !== courseId));
      alert('Course deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting course:', error);
      alert(`Failed to delete course: ${error.message}`);
    }
  };

  const handleTaskCompletion = async (taskId: string, isCompleted: boolean) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({ is_completed: isCompleted })
        .eq('id', taskId)
        .select()
        .single();
        
      if (error) throw error;

      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, is_completed: isCompleted } : task
      ));
      
      // Update weekly progress when tasks are completed
      calculateWeeklyProgress();
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task status');
    }
  };

  const calculateWeeklyProgress = () => {
    // Get tasks due this week
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    const thisWeekTasks = tasks.filter(task => {
      const taskDate = new Date(task.due_date);
      return taskDate >= startOfWeek && taskDate <= endOfWeek;
    });
    
    if (thisWeekTasks.length === 0) {
      setWeeklyProgress(100); // No tasks = 100% complete
      return;
    }
    
    const completedTasks = thisWeekTasks.filter(task => task.is_completed).length;
    const progressPercentage = Math.round((completedTasks / thisWeekTasks.length) * 100);
    
    setWeeklyProgress(progressPercentage);
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !noteForm.title || !noteForm.content) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');
      
      const newNote = {
        user_id: session.user.id,
        title: noteForm.title,
        content: noteForm.content,
        course_id: noteForm.courseId || null,
        created_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('notes')
        .insert([newNote]);
      
      if (error) throw error;
      
      // Reset form and close modal
      setNoteForm({ title: '', content: '', courseId: '' });
      setShowAddNoteModal(false);
      
      alert('Note added successfully!');
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Failed to add note. Please try again.');
    }
  };
  const generateStudyPlan = () => {
    try {
      // Sort courses by progress (ascending) and pick the three with the least progress
      const sortedCourses = [...courses].sort((a, b) => (a.progress || 0) - (b.progress || 0));
      const selectedCourses = sortedCourses.slice(0, 3);
  
      // Allocate 3 hours (180 minutes) among the selected courses
      const totalMinutes = 180;
      const timePerCourse = Math.floor(totalMinutes / selectedCourses.length);
  
      const plan = selectedCourses.map((course, index) => {
        const time = index === selectedCourses.length - 1
          ? totalMinutes - timePerCourse * (selectedCourses.length - 1) // Assign remaining time to the last course
          : timePerCourse;
        return `- ${course.course_name} (${time} min): Focus on improving progress.`;
      }).join('\n');
  
      // Remove unnecessary leading/trailing whitespace
      const generatedPlan = `# Today's Study Plan\n\n${plan}`.trim();
  
      // Set the plan and show the modal
      setStudyPlan(generatedPlan);
      setShowStudyPlanModal(true);
    } catch (error) {
      console.error('Error generating study plan:', error);
      alert('Failed to generate study plan. Please try again.');
    }
  };
  const getProgressColor = (progress: number) => {
    if (progress < 30) return 'from-red-400 to-red-500';
    if (progress < 70) return 'from-yellow-400 to-yellow-500';
    return 'from-green-400 to-green-500';
  };

  const filteredCourses = courses.filter(course =>
    course.course_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (      
    <>
    {showStudyPlanModal && (
  <div className="fixed inset-0 flex items-center justify-center z-50">
    {/* Modal container */}
    <div className="relative bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg">
      <h2 className="text-2xl font-extrabold text-center mb-6 text-gray-900">
        🌟 Today's Study Plan 🌟
      </h2>
      <pre className="bg-gray-50 p-6 rounded-lg text-sm whitespace-pre-wrap text-gray-900 font-mono">
        {studyPlan}
      </pre>
      <div className="flex justify-end gap-4 mt-6">
        <button
          onClick={() => setShowStudyPlanModal(false)}
          className="px-6 py-2 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 shadow-lg transition"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Your existing content */}
      <div className="flex flex-col lg:flex-row justify-between items-center mb-8 gap-4">
        {/* Today's Plan Generator */}
        <div className="w-full lg:w-auto">          
        </div>
        {/* Other content */}
      </div>
    </div>

    {/* Study Plan Modal */}
    {showStudyPlanModal && (
  <div className="fixed inset-0 flex items-center justify-center z-50">
    {/* Modal container */}
    <div className="relative bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg">
      <h2 className="text-2xl font-extrabold text-center mb-6 text-gray-900">
        🌟 Today's Study Plan 🌟
      </h2>
      <pre className="bg-gray-50 p-6 rounded-lg text-sm whitespace-pre-wrap text-gray-900 font-mono">
        {studyPlan}
      </pre>
      <div className="flex justify-end gap-4 mt-6">
        <button
          onClick={() => setShowStudyPlanModal(false)}
          className="px-6 py-2 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 shadow-lg transition"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}
          
    
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Top Bar with Search and Actions */}
      <div className="flex flex-col lg:flex-row justify-between items-center mb-8 gap-4">
        {/* Today's Plan Generator (Top Left) */}
        <div className="w-full lg:w-auto">
          <button 
            onClick={generateStudyPlan}
            className="w-full lg:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2"
          >
            <Lightbulb className="w-5 h-5" />
            <span>Generate Today's Study Plan</span>
          </button>
        </div>
        
        {/* Search Bar */}
        <div className="relative w-full lg:w-1/3">
          <input
            type="text"
            placeholder="Search courses, tasks, and notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-3 pl-10 rounded-xl bg-white/10 backdrop-blur-lg border border-gray-200 dark:border-gray-700 shadow-sm"/>
            <span className="absolute left-3 top-1/2 -translate-y-1/2">🔍</span>
        </div>
        
        {/* Weekly Progress (Top Right) */}
        <div className="w-full lg:w-auto flex items-center gap-3 bg-gradient-to-r from-blue-500 to-cyan-400 p-3 rounded-xl text-white shadow-lg">
          <div className="relative w-12 h-12">
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
                strokeDasharray={`${weeklyProgress}, 100`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold">{weeklyProgress}%</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold">Weekly Progress</p>
            <p className="text-xs opacity-80">3-Day Streak</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
            <h2 className="text-lg font-bold mb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => router.push('/upload')} className="flex flex-col items-center justify-center p-3 bg-blue-50 dark:bg-gray-700 rounded-lg hover:bg-blue-100 dark:hover:bg-gray-600 transition">
                <Upload className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                <span className="text-xs mt-1">Upload File</span>
              </button>
              <button 
                onClick={() => setShowAddNoteModal(true)} 
                className="flex flex-col items-center justify-center p-3 bg-purple-50 dark:bg-gray-700 rounded-lg hover:bg-purple-100 dark:hover:bg-gray-600 transition"
              >
                <PenTool className="w-6 h-6 text-purple-500 dark:text-purple-400" />
                <span className="text-xs mt-1">Add Note</span>
              </button>
              <button 
                onClick={() => setShowTimerModal(true)}
                className="flex flex-col items-center justify-center p-3 bg-green-50 dark:bg-gray-700 rounded-lg hover:bg-green-100 dark:hover:bg-gray-600 transition"
              >
                <Clock className="w-6 h-6 text-green-500 dark:text-green-400" />
                <span className="text-xs mt-1">Start Timer</span>
              </button>
              <button 
                  onClick={() => router.push('/ai-tutor')} 
                  className="flex flex-col items-center justify-center p-3 bg-amber-50 dark:bg-gray-700 rounded-lg hover:bg-amber-100 dark:hover:bg-gray-600 transition"
>
                 <AlertCircle className="w-6 h-6 text-amber-500 dark:text-amber-400" />
                <span className="text-xs mt-1">Ask Buddy</span>
                  </button>
            </div>
          </div>

          {/* Tasks / Planner */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-bold">Tasks</h2>
              <div className="flex space-x-2">
                <button 
                  onClick={() => setActiveTab('upcoming')}
                  className={`text-sm px-2 py-1 rounded ${activeTab === 'upcoming' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200' : 'text-gray-500'}`}
                >
                  Upcoming
                </button>
                <button 
                  onClick={() => setActiveTab('completed')} 
                  className={`text-sm px-2 py-1 rounded ${activeTab === 'completed' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200' : 'text-gray-500'}`}
                >
                  Completed
                </button>
              </div>
            </div>
            
            <form onSubmit={handleAddTask} className="mb-4 space-y-2">
              <input
                type="text"
                placeholder="New task name"
                value={newTask.name}
                onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                className="w-full p-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
              />
              <div className="flex gap-2">
                <input
                  type="date"
                  value={newTask.deadline}
                  onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                  className="flex-grow p-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
                />
                <button
                  type="submit"
                  className="bg-blue-500 p-2 rounded-lg text-white hover:bg-blue-600"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </form>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {tasks.length === 0 ? (
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg text-center text-gray-500 dark:text-gray-400">
                  No tasks scheduled
                </div>
              ) : (
                tasks
                  .filter(task => activeTab === 'upcoming' ? !task.is_completed : task.is_completed)
                  .map((task) => (
                    <div key={task.id} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg flex justify-between items-center">
                      <div className={task.is_completed ? "text-gray-400 line-through" : ""}>
                        <h3 className="font-medium">{task.title}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(task.due_date).toLocaleDateString()}
                        </p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={task.is_completed}
                        onChange={() => handleTaskCompletion(task.id, !task.is_completed)}
                        className="h-5 w-5 rounded text-blue-500"
                      />
                    </div>
                  ))
                )}
                </div>
                          </div>
                        </div>
                
                        {/* Center - Course Grid */}
                        <div className="lg:col-span-2">
                          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
                            <div className="flex justify-between items-center mb-4">
                              <h2 className="text-lg font-bold">My Courses</h2>
                              <form onSubmit={handleAddCourse} className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="Add new course"
                                  value={newCourse}
                                  onChange={(e) => setNewCourse(e.target.value)}
                                  className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm w-40 md:w-auto"
                                />
                                <button
                                  type="submit"
                                  className="bg-blue-500 p-2 rounded-lg text-white hover:bg-blue-600"
                                >
                                  <Plus className="w-5 h-5" />
                                </button>
                              </form>
                            </div>
                
                            {/* 3x3 Grid of Courses */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto p-1">
                              {filteredCourses.length === 0 ? (
                                <div className="col-span-3 bg-gray-50 dark:bg-gray-700 p-6 rounded-lg text-center">
                                  <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                                  <p>No courses added yet</p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">Add your first course to get started</p>
                                </div>
                              ) : (
                                filteredCourses.map((course) => (
                                  <div 
                                    key={course.id} 
                                    className="bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-xl shadow-sm hover:shadow-md transition cursor-pointer overflow-hidden"
                                  >
                                    <div className={`h-2 bg-gradient-to-r ${getProgressColor(course.progress || 0)}`}></div>
                                    <div className="p-4" onClick={() => handleCourseClick(course.id)}>
                                      <h3 className="font-medium text-lg mb-2 line-clamp-1">{course.course_name}</h3>
                                      <div className="flex justify-between items-center text-sm">
                                        <div className="flex items-center">
                                          <BarChart2 className="w-4 h-4 mr-1 text-gray-500 dark:text-gray-400" />
                                          <span>{course.progress || 0}% Complete</span>
                                        </div>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                          {course.last_activity ? new Date(course.last_activity).toLocaleDateString() : 'No activity'}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex justify-end px-4 pb-2">
                                      <button 
                                        onClick={(e) => handleDeleteCourse(e, course.id)}
                                        className="text-red-500 hover:text-red-700 p-1 rounded"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                
                        {/* Right Sidebar */}
                        <div className="lg:col-span-1 space-y-6">
                          {/* Timer Component */}
                                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 text-center">
                                      <h2 className="text-lg font-bold mb-3">Study Timer</h2>
                                      <div className="text-4xl font-mono font-bold mb-3">
                                        {formatTimerDisplay(timerSeconds)}
                                      </div>
                                      <div className="flex justify-center gap-2">
                                        {timerActive ? (
                                          <button
                                            onClick={pauseTimer}
                                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg"
                                          >
                                            Pause
                                          </button>
                                        ) : (
                                          <button
                                            onClick={() => setTimerActive(true)}
                                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
                                          >
                                            Resume
                                          </button>
                                        )}
                                        <button
                                          onClick={resetTimer}
                                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
                                        >
                                          Reset
                                        </button>
                                      </div>
                                    </div>
                        
                          {/* Calendar */}
                          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
                            <div className="flex justify-between items-center mb-3">
                              <h2 className="text-lg font-bold">Calendar</h2>
                              <Calendar className="w-5 h-5 text-blue-500" />
                            </div>
                            
                            {/* Simple Calendar UI */}
                            <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
                              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                                <div key={i} className="p-1 font-bold">{day}</div>
                              ))}
                              {calendarDates.map((date, i) => {
                                if (!date) return <div key={`empty-${i}`} className="p-2"></div>;
                                
                                const dateString = date.toDateString();
                                const isToday = new Date().toDateString() === dateString;
                                const hasTasks = calendarTasks[dateString] && calendarTasks[dateString].length > 0;
                                
                                return (
                                  <div 
                                    key={i} 
                                    className={`p-1 rounded-full w-8 h-8 mx-auto flex items-center justify-center cursor-pointer
                                      ${isToday ? 'bg-blue-500 text-white' : ''}
                                      ${hasTasks && !isToday ? 'bg-blue-100 dark:bg-blue-900' : ''}
                                      hover:bg-gray-200 dark:hover:bg-gray-600
                                    `}
                                    title={hasTasks ? `${calendarTasks[dateString].length} tasks due` : ''}
                                  >
                                    {date.getDate()}
                                  </div>
                                );
                              })}
                            </div>
                            
                            {/* Next 3 upcoming tasks */}
                            <div className="mt-4">
                              <h3 className="text-sm font-medium mb-2">Upcoming</h3>
                              <div className="space-y-2">
                                {tasks.filter(t => !t.is_completed).slice(0, 3).length > 0 ? (
                                  tasks.filter(t => !t.is_completed).slice(0, 3).map((task, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-sm p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                      <span className="flex-grow truncate">{task.title}</span>
                                      <span className="text-xs text-gray-500">
                                        {new Date(task.due_date).toLocaleDateString()}
                                      </span>
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-sm text-gray-500 text-center p-2">
                                    No upcoming tasks
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Study Stats */}
                          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
                            <h2 className="text-lg font-bold mb-3">Study Stats</h2>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm">Total Study Time</span>
                                <span className="font-medium">{studyStats.totalTime}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm">Week Streak</span>
                                <span className="font-medium">{studyStats.weekStreak} days</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm">Files Uploaded</span>
                                <span className="font-medium">{studyStats.filesUploaded}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm">AI Tutor Sessions</span>
                                <span className="font-medium">{studyStats.tutorSessions}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Timer Modal */}
                      {showTimerModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
                            <h2 className="text-xl font-bold mb-4">Start Study Timer</h2>
                            <div className="mb-4">
                              <label className="block text-sm font-medium mb-1">Duration</label>
                              <select 
                                value={timerDuration}
                                onChange={(e) => setTimerDuration(parseInt(e.target.value))}
                                className="w-full p-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
                              >
                                <option value={15 * 60}>15 minutes</option>
                                <option value={25 * 60}>25 minutes</option>
                                <option value={30 * 60}>30 minutes</option>
                                <option value={45 * 60}>45 minutes</option>
                                <option value={60 * 60}>1 hour</option>
                                <option value={90 * 60}>1 hour 30 minutes</option>
                                <option value={120 * 60}>2 hours</option>
                              </select>
                            </div>
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => setShowTimerModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-lg"
                              >
                                Cancel
                              </button>
                              <button 
                                onClick={startTimer}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                              >
                                Start Timer
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Add Note Modal */}
                      {showAddNoteModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
                            <h2 className="text-xl font-bold mb-4">Add New Note</h2>
                            <form onSubmit={handleAddNote} className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium mb-1">Title</label>
                                <input
                                  type="text"
                                  value={noteForm.title}
                                  onChange={(e) => setNoteForm({...noteForm, title: e.target.value})}
                                  className="w-full p-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
                                  placeholder="Note title"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium mb-1">Course (Optional)</label>
                                <select
                                  value={noteForm.courseId}
                                  onChange={(e) => setNoteForm({...noteForm, courseId: e.target.value})}
                                  className="w-full p-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
                                >
                                  <option value="">Not associated with a course</option>
                                  {courses.map(course => (
                                    <option key={course.id} value={course.id}>
                                      {course.course_name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium mb-1">Content</label>
                                <textarea
                                  value={noteForm.content}
                                  onChange={(e) => setNoteForm({...noteForm, content: e.target.value})}
                                  className="w-full p-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 min-h-[150px]"
                                  placeholder="Enter your note here..."
                                />
                              </div>
                              
                              <div className="flex justify-end gap-2">
                                <button 
                                  type="button"
                                  onClick={() => setShowAddNoteModal(false)}
                                  className="px-4 py-2 border border-gray-300 rounded-lg"
                                >
                                  Cancel
                                </button>
                                <button 
                                  type="submit"
                                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                                >
                                  Save Note
                                </button>
                              </div>
                            </form>
                          </div>
                        </div>
                      )}
                    </div>
                    </>
                  );
                }