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
import { motion } from 'framer-motion'

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5, staggerChildren: 0.2 } }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
  }

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
      <motion.div 
        className="relative container mx-auto px-4 py-8 space-y-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div 
          className="text-center space-y-4 py-12"
          variants={itemVariants}
        >
          <motion.div 
            className="flex items-center justify-center gap-2"
            whileHover={{ scale: 1.05 }}
          >
            <Image
              src={Logo}
              alt="StudyBuddy Logo"
              width={32}
              height={32}
              className="animate-pulse"
            />
            <span className="text-2xl font-semibold">StudyBuddy</span>
          </motion.div>
          
          <motion.h1 
            className="text-3xl font-bold"
            variants={itemVariants}
          >
            Welcome, {username || 'Guest'} 👋
          </motion.h1>

          <motion.div 
            className="inline-block bg-yellow-100 dark:bg-yellow-900/50 px-6 py-2 rounded-full"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link href="/leaderboard" className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/80 backdrop-blur-lg rounded-full text-white hover:bg-yellow-600/80 transition-all cursor-pointer">
              <Trophy className="w-5 h-5 animate-bounce" />
              Leaderboard
            </Link>
          </motion.div>
        </motion.div>

        <motion.div 
          className="max-w-4xl mx-auto bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-lg p-6"
          variants={itemVariants}
          whileHover={{ scale: 1.01 }}
        >
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
        </motion.div>

        <motion.div 
          className="max-w-4xl mx-auto"
          variants={itemVariants}
        >
          <h2 className="text-xl font-semibold mb-6">🚀 Quick Access</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: '📊', title: 'Dashboard', href: '/dashboard' },
              { icon: '📝', title: 'Flashcards', href: '/flashcards' },
              { icon: '📅', title: 'Study Planner', href: '/planner' },
              { icon: '🤖', title: 'AI Tutor', href: '/ai-tutor' }
            ].map((item, index) => (
              <motion.a
                key={item.title}
                href={item.href}
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-center cursor-pointer"
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)"
                }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <motion.span 
                  className="text-2xl mb-2 block"
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3
                  }}
                >
                  {item.icon}
                </motion.span>
                <p className="font-medium">{item.title}</p>
              </motion.a>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
