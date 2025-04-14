'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { startChat } from '@/lib/gemini'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'

import { useUser } from '@/contexts/user-context'
import { supabase } from '@/lib/supabase/client'
import { useRef } from 'react'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export default function AITutor() {
  const router = useRouter()
  const { user } = useUser()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Add this to your existing state declarations
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hi! 👋 I\'m your AI study buddy. Feel free to ask me anything about your studies, and I\'ll do my best to help you understand!'
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSendMessage = async () => {
    if (!input.trim()) return

    setLoading(true)
    setMessages(prev => [...prev, { role: 'user', content: input }])
    setInput('')

    try {
      const chat = await startChat()
      const result = await chat.sendMessage(`
        As a friendly and supportive teacher, please help with this question. 
        If your response contains code, wrap it in triple backticks with the language.
        Maintain proper spacing and formatting: ${input}
      `)
      const response = await result.response
      const formattedResponse = response.text()
        .replace(/```(\w+)?\n/g, '<pre class="code-block">')
        .replace(/```/g, '</pre>')
        .replace(/\n/g, '<br/>')
        .trim()
      setMessages(prev => [...prev, { role: 'assistant', content: formattedResponse }])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold mb-4">👋 Meet Buddy – Your AI Academic Assistant</h1>
          <p className="text-xl text-gray-300">Your personal AI tutor, available 24/7</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 mt-12">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.02 }}
            className="relative group"
          >
            <div 
              className="bg-gradient-to-br from-purple-500 to-indigo-600 p-6 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".pdf"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file || !user) return

                  try {
                    const fileName = `${user.id}/${Date.now()}-${file.name}`
                    const { error: uploadError } = await supabase
                      .storage
                      .from('pdfs')
                      .upload(fileName, file)

                    if (uploadError) throw uploadError

                    router.push(`/pdf-analysis?fileName=${encodeURIComponent(file.name)}&fileId=${encodeURIComponent(fileName)}`)
                  } catch (err) {
                    console.error('Error uploading file:', err)
                  }
                }}
              />
              <div className="flex flex-col items-center text-center space-y-4 cursor-pointer">
                <div className="p-4 bg-white/10 rounded-full">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold">Upload File/Folder</h2>
                <p className="text-gray-300">Upload your study materials for AI analysis</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.02 }}
            className="relative group"
          >
            <div 
              className="bg-gradient-to-br from-blue-500 to-cyan-400 p-6 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300"
              onClick={() => router.push('/pdf-analysis')}
            >
              <div className="flex flex-col items-center text-center space-y-4 cursor-pointer">
                <div className="p-4 bg-white/10 rounded-full">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold">PDF Analysis</h2>
                <p className="text-gray-300">Get AI-powered insights from your PDFs</p>
              </div>
            </div>
          </motion.div>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-xl p-6"
        >
          <motion.h2 
            className="text-2xl font-semibold mb-6 flex items-center gap-2"
            initial={{ x: -20 }}
            animate={{ x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-3xl">🤖</span> 
            <span>Ask me anything</span>
          </motion.h2>
          
          <ScrollArea className="h-[400px] rounded-xl bg-gray-900/50 p-4 mb-6">
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`mb-4 flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`p-4 rounded-2xl max-w-[80%] ${
                    message.role === 'user'
                      ? 'bg-blue-600/90 text-white shadow-lg'
                      : 'bg-gray-700/90 text-gray-100 shadow-lg'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <motion.span 
                      className="text-sm text-blue-300 font-medium"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      AI Assistant
                    </motion.span>
                  )}
                  <div 
                    className="mt-1 message-content leading-relaxed"
                    dangerouslySetInnerHTML={{ 
                      __html: message.content 
                    }} 
                  />
                </div>
              </motion.div>
            ))}
            {loading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-blue-400 p-2"
              >
                <div className="w-2 h-2 rounded-full animate-bounce bg-blue-400"></div>
                <div className="w-2 h-2 rounded-full animate-bounce bg-blue-400 delay-75"></div>
                <div className="w-2 h-2 rounded-full animate-bounce bg-blue-400 delay-150"></div>
              </motion.div>
            )}
          </ScrollArea>

          <div className="flex gap-3 items-end">
            <motion.div 
              className="flex-1 relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything! I'm here to help..."
                className="min-h-[60px] bg-gray-700/50 border-gray-600 focus:border-blue-500 rounded-xl pr-24 text-lg transition-all duration-200 focus:shadow-lg"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
              />
              <Button
                onClick={handleSendMessage}
                disabled={loading || !input.trim()}
                className="absolute bottom-2 right-2 bg-blue-600 hover:bg-blue-700 rounded-lg px-4 py-2 transition-all duration-200 hover:scale-105"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full animate-pulse bg-white"></div>
                    <div className="w-1.5 h-1.5 rounded-full animate-pulse bg-white delay-75"></div>
                    <div className="w-1.5 h-1.5 rounded-full animate-pulse bg-white delay-150"></div>
                  </span>
                ) : (
                  <motion.span 
                    whileHover={{ scale: 1.1 }}
                    className="flex items-center gap-2"
                  >
                    Send
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </motion.span>
                )}
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
