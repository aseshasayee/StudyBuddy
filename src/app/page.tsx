'use client'

import React, { useState, useEffect } from 'react'
import { useUser } from '@/contexts/user-context'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import styles from './gaming-styles.module.css'
import { 
  Trophy, Bookmark, Calendar, BookOpen, 
  BarChart2, Activity, BookMarked, Bot,
  Clock, Plus, Lightbulb,
  Flame, Star, Zap, Shield
} from 'lucide-react'
import darkForest from '../../images/dark-forest.png'

type QuickAccessCardProps = {
  icon: React.ReactNode;
  title: string;
  href: string;
  onClick: () => void;
  bgColor?: string;
};

const QuickAccessCard: React.FC<QuickAccessCardProps> = ({ icon, title, href, onClick, bgColor = "from-blue-600/30 to-purple-700/30" }) => (
  <div 
    onClick={onClick}
    className={`${styles.glowContainer} ${styles.pixelBorder} bg-gradient-to-br ${bgColor} backdrop-blur-md p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer text-center flex flex-col items-center justify-center gap-4 border border-white/20`}
  >
    <div className="p-3 bg-white/10 rounded-full">
      {icon}
    </div>
    <p className="font-medium text-white">{title}</p>
  </div>
);

// Update the quickAccessItems array to use proper router reference
const quickAccessItems = [
  { 
    icon: <BarChart2 className="w-8 h-8 text-blue-400" />, 
    title: "Dashboard", 
    href: "/dashboard",
    onClick: () => user ? router.push('/dashboard') : router.push('/login'),
    bgColor: "from-blue-600/20 to-purple-700/20"
  },
  { 
    icon: <BookMarked className="w-8 h-8 text-purple-400" />, 
    title: "Flashcards", 
    href: "/flashcards",
    onClick: () => user ? router.push('/flashcards') : router.push('/login'),
    bgColor: "from-purple-700/20 to-blue-600/20"
  },
  { 
    icon: <Calendar className="w-8 h-8 text-blue-400" />, 
    title: "Study Planner", 
    href: "/planner",
    onClick: () => user ? router.push('/planner') : router.push('/login'),
    bgColor: "from-blue-600/20 to-purple-700/20"
  },
  { 
    icon: <Bot className="w-8 h-8 text-purple-400" />,
    title: "AI Tutor", 
    href: "/ai-tutor",
    onClick: () => router.push('/ai-tutor'),
    bgColor: "from-purple-700/20 to-blue-600/20"
  }
];

type StudyPlanItemProps = {
  emoji: string;
  title: string;
  time: string;
  onClick: () => void;
  progress?: number;
};

const StudyPlanItem: React.FC<StudyPlanItemProps> = ({ emoji, title, time, onClick, progress = 0 }) => (
  <div className="flex items-center justify-between p-5 bg-gradient-to-r from-gray-800/80 to-gray-700/80 backdrop-blur-md rounded-xl shadow-md hover:shadow-lg transition-all duration-200 border border-white/10">
    <div className="flex items-center gap-4">
      <div className="text-2xl w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-br from-purple-500/30 to-purple-500/30 border border-white/20">
        {emoji}
      </div>
      <div>
        <h3 className="font-semibold text-white">{title}</h3>
        <p className="text-sm text-gray-300">{time}</p>
      </div>
    </div>
    <div className="flex items-center gap-4">
      <div className="hidden md:block">
        <div className="w-24 h-2 bg-gray-700 rounded-full">
          <div 
            className="h-full bg-gradient-to-r from-red-500 to-gray-500 rounded-full" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
      <button 
        onClick={onClick}
        className={`${styles.pixelButton} ${styles.hoverScale}`}
      >
        Start
      </button>
    </div>
  </div>
);

export default function Home() {
  const { user } = useUser()
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [studyPlan, setStudyPlan] = useState(null)
  const [showStudyPlanModal, setShowStudyPlanModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [dailyStreak, setDailyStreak] = useState(7)
  const [xpPoints, setXpPoints] = useState(346)
  const [level, setLevel] = useState(4)

  useEffect(() => {
    async function fetchUserData() {
      if (user) {
        setIsLoading(true);
        
        try {
          // Fetch username
          const { data: userData } = await supabase
            .from('users')
            .select('username, name')
            .eq('id', user.id)
            .single();
          
          if (userData) {
            setUsername(userData.username || userData.name || 'User');
          }
          
          // Fetch courses for study plan
          const { data: coursesData } = await supabase
            .from('courses')
            .select('*')
            .eq('user_id', user.id);
          
          if (coursesData && coursesData.length > 0) {
            generateStudyPlan(coursesData);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    }
    
    fetchUserData();
  }, [user]);

  const generateStudyPlan = (courses: { id: string; course_name: string; progress?: number }[]) => {
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
        
        // Generate realistic time slots
        const startHour = 9 + index * 2; // Starting at 9 AM, with 2-hour gaps
        const endHour = startHour + Math.floor(time / 60);
        const timeSlot = `${startHour}:00 - ${endHour}:00`;
        
        return {
          id: course.id,
          title: course.course_name,
          time: timeSlot,
          duration: time,
          progress: course.progress || Math.floor(Math.random() * 40) // Random progress for visualization
        };
      });
  
      setStudyPlan(plan as any);
    } catch (error) {
      console.error('Error generating study plan:', error);
    }
  };

  const handleShowFullPlan = () => {
    setShowStudyPlanModal(true);
  };

  // Quick access items with gamified colors
  // Quick access items with gamified colors
  const quickAccessItems = [
    { 
      icon: <BarChart2 className="w-8 h-8 text-emerald-400" />, 
      title: "Dashboard", 
      href: "/dashboard",
      onClick: () => user ? router.push('/dashboard') : router.push('/login'),
      bgColor: "from-emerald-600/30 to-teal-700/30"
    },
    { 
      icon: <BookMarked className="w-8 h-8 text-sky-400" />, 
      title: "Flashcards", 
      href: "/flashcards",
      onClick: () => user ? router.push('/flashcards') : router.push('/login'),
      bgColor: "from-sky-600/30 to-blue-700/30"
    },
    { 
      icon: <Calendar className="w-8 h-8 text-violet-400" />, 
      title: "Study Planner", 
      href: "/planner",
      onClick: () => user ? router.push('/planner') : router.push('/login'),
      bgColor: "from-violet-600/30 to-purple-700/30"
    },
    { 
      icon: <Bot className="w-8 h-8 text-amber-400" />,
      title: "AI Tutor", 
      href: "/ai-tutor",
      onClick: () => router.push('/ai-tutor'),
      bgColor: "from-amber-600/30 to-orange-700/30"
    }
  ];

  // Default study plan if none exists, with random progress for visualization
  const defaultStudyPlan = [
    { id: 1, title: "Mathematics", time: "10:00 - 11:30", emoji: "📚", progress: 30 },
    { id: 2, title: "Physics", time: "13:00 - 14:30", emoji: "🔬", progress: 15 }
  ];

  const displayStudyPlan = studyPlan || defaultStudyPlan;

  return (
    <div 
      className="relative min-h-screen w-full overflow-x-hidden bg-gradient-to-b from-gray-900 to-gray-800"
      style={{ 
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.8)), url(${darkForest.src})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-b-4 border-purple-500"></div>
        </div>
      ) : (
        <div className={`container mx-auto px-4 sm:px-6 py-8 max-w-6xl ${styles.glowContainer}`}>
          {/* Header with gamified elements */}
          <header className="mb-10 pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">StudyBuddy</h1>
              </div>
              
              <div className="flex items-center gap-4">
                {user && (
                  <div className="hidden md:flex items-center gap-8 px-6 py-2 bg-gray-800/60 backdrop-blur-md rounded-full">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-purple-400" />
                      <span className="text-white font-semibold">Level {level}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-400" />
                      <span className="text-white font-semibold">{xpPoints} XP</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Flame className="w-5 h-5 text-orange-400" />
                      <span className="text-white font-semibold">{dailyStreak} days</span>
                    </div>
                  </div>
                )}
                
                <Link 
                  href="/leaderboard"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-gray-800 to-blue-900 hover:from-blue-900 hover:to-gray-800 backdrop-blur-lg rounded-full text-white transition-all shadow-lg border border-white/10 transform hover:scale-105"
                >
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  Leaderboard
                </Link>
              </div>
            </div>
          </header>
          
          {/* Welcome Section with game-like elements */}
          <section className="mb-12 text-center">
            <div className="bg-gradient-to-r from-blue-600/20 to-purple-700/20 backdrop-blur-md rounded-3xl p-8 md:p-12 shadow-xl border border-white/10 relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl"></div>
              
              <h1 className={`text-4xl md:text-5xl font-bold mb-4 text-white ${styles.glowText}`}>
                Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">{username || 'Guest'}</span> 👋
              </h1>
              
              {user && (
                <div className="mb-8 flex justify-center">
                  <div className="px-6 py-3 bg-gray-800/60 backdrop-blur-md rounded-full flex items-center gap-4 md:hidden">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-purple-400" />
                      <span className="text-white text-sm">Lvl {level}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span className="text-white text-sm">{xpPoints} XP</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-orange-400" />
                      <span className="text-white text-sm">{dailyStreak}d</span>
                    </div>
                  </div>
                </div>
              )}
              
              <p className="text-xl text-gray-300 mb-8">
                Ready to unlock your learning achievements today?
              </p>
              
              {!user && (
                <div className="flex flex-wrap gap-4 justify-center">
                  <Link 
                    href="/login"
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg transition-all hover:shadow-xl transform hover:scale-105"
                  >
                    Log In
                  </Link>
                  <Link 
                    href="/signup" // Change from /register to /signup
                    className="px-8 py-3 bg-white hover:bg-gray-100 text-blue-600 font-semibold rounded-xl shadow-lg transition-all hover:shadow-xl transform hover:scale-105"
                  >
                    Start Your Journey
                  </Link>
                </div>
              )}
            </div>
          </section>
          
          {/* Today's Quest (Study Plan) Section */}
          <section className="mb-12">
            <div className="bg-gray-800/50 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/10">
              <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Lightbulb className="w-6 h-6 text-yellow-400" />
                  Today's Quests
                </h2>
                
                {user && (
                  <button 
                    onClick={handleShowFullPlan}
                    className="text-sm bg-purple-600/40 hover:bg-purple-600/60 text-white px-4 py-2 rounded-lg transition-all transform hover:scale-105"
                  >
                    Quest Log
                  </button>
                )}
              </div>
              
              <div className="space-y-4">
                {displayStudyPlan.map((item, index) => (
                  <StudyPlanItem 
                    key={index}
                    emoji={item.emoji || "📚"}
                    title={item.title}
                    time={item.time}
                    progress={item.progress}
                    onClick={() => router.push('/dashboard')}
                  />
                ))}
              </div>
              
              <div className="mt-6 text-white/70">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Daily Quest Progress</span>
                  <span className="text-sm font-medium">0%</span>
                </div>
                <div className="w-full h-3 bg-gray-700 rounded-full mt-2 overflow-hidden">
                  <div className="w-0 h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full"></div>
                </div>
              </div>
            </div>
          </section>
          
          {/* Quick Access Section - Gamified */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
              <Zap className="w-6 h-6 text-red-400" />
              Power-ups
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {quickAccessItems.map((item, index) => (
                <QuickAccessCard 
                  key={index}
                  icon={item.icon}
                  title={item.title}
                  href={item.href}
                  onClick={item.onClick}
                  bgColor={item.bgColor}
                />
              ))}
            </div>
          </section>
          
          {/* Additional Features - Gamified */}
          <section className="mb-12">
            <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/10">
              <h2 className="text-2xl font-bold mb-6 text-white">Special Tools</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-800/30 to-blue-600/30 hover:from-blue-800/40 hover:to-blue-600/40 transition-all p-6 rounded-xl flex items-start gap-4 border border-white/10 transform hover:scale-105">
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-400/30">
                    <Clock className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Focus Booster</h3>
                    <p className="text-gray-300">Achieve perfect focus with timed study sessions</p>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-800/30 to-purple-600/30 hover:from-purple-800/40 hover:to-purple-600/40 transition-all p-6 rounded-xl flex items-start gap-4 border border-white/10 transform hover:scale-105">
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-400/30">
                    <BookOpen className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Knowledge Vault</h3>
                    <p className="text-gray-300">Store and search your magical study notes</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
          
          {/* Footer */}
          <footer className="py-8 border-t border-white/10 text-center text-gray-400">
            <p>© 2025 StudyBuddy. Level up your learning journey.</p>
          </footer>
        </div>
      )}
      
      {/* Study Plan Modal - Gamified */}
      {showStudyPlanModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70 backdrop-blur-sm">
          <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl p-8 w-full max-w-lg border border-white/20">
            <div className="absolute inset-0 rounded-2xl overflow-hidden opacity-20">
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-500/30 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-500/30 rounded-full blur-3xl"></div>
            </div>
            
            <h2 className="text-2xl font-extrabold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              🌟 Quest Log 🌟
            </h2>
            
            <div className="space-y-4 relative">
              {studyPlan ? (
                (studyPlan as any[]).map((item, index) => (
                  <div key={index} className="p-4 bg-gray-700/50 backdrop-blur-md rounded-lg border border-white/10 hover:bg-gray-700/70 transition-all">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium text-lg text-white">{item.title}</h3>
                      <div className="text-xs px-2 py-1 bg-blue-500/30 rounded-full text-blue-200">+{item.duration/2} XP</div>
                    </div>
                    <p className="text-gray-300">{item.time} ({item.duration} min)</p>
                    <div className="mt-2 w-full h-2 bg-gray-800 rounded-full">
                      <div 
                        className="h-full bg-gradient-to-r from-gray-600 to-blue-800 rounded-full animate-gradient" 
                        style={{ width: `${item.progress}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-400">No quests available yet. Start your journey!</p>
              )}
            </div>
            
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => setShowStudyPlanModal(false)}
                className="px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-600 text-white font-bold rounded-lg hover:from-purple-600 hover:to-blue-700 shadow-lg transition transform hover:scale-105"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}