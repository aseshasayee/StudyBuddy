'use client'

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Grid3X3, Upload, CalendarCheck, ClipboardList, 
  HelpCircle, PenTool, Send, Loader2 
} from "lucide-react"
import { startChat } from "@/lib/gemini"

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function AskBuddyPage() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [chatSession, setChatSession] = useState<any>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const tools = [
    { icon: <ClipboardList className="w-5 h-5 mr-2" />, label: "Generate Flashcards", color: "from-pink-500 to-rose-500" },
    { icon: <Upload className="w-5 h-5 mr-2" />, label: "Upload File/Folder", color: "from-purple-500 to-indigo-500" },
    { icon: <HelpCircle className="w-5 h-5 mr-2" />, label: "Solve a Doubt", color: "from-blue-500 to-cyan-500" },
    { icon: <PenTool className="w-5 h-5 mr-2" />, label: "Solve a Problem", color: "from-green-500 to-emerald-500" },
    { icon: <CalendarCheck className="w-5 h-5 mr-2" />, label: "Plan My Schedule", color: "from-yellow-500 to-orange-500" },
    { icon: <Grid3X3 className="w-5 h-5 mr-2" />, label: "Create Revision Test", color: "from-red-500 to-pink-500" },
  ]

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    const initChat = async () => {
      try {
        const chat = await startChat()
        setChatSession(chat)
        const response = await chat.sendMessage("You are a professional and knowledgeable AI tutor. Your role is to help students learn and understand academic concepts. Please introduce yourself briefly.")
        const result = await response.response
        setMessages([{ role: 'assistant', content: result.text() }])
      } catch (error) {
        console.error('Error initializing chat:', error)
      }
    }
    initChat()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim() || isLoading || !chatSession) return

    const userQuery = query.trim()
    setIsLoading(true)
    setMessages(prev => [...prev, { role: 'user', content: userQuery }])
    setQuery("")

    try {
      const response = await chatSession.sendMessage(userQuery)
      const result = await response.response
      setMessages(prev => [...prev, { role: 'assistant', content: result.text() }])
    } catch (error) {
      console.error('Error getting response:', error)
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I apologize, but I encountered an error. Please try asking your question again."
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">👋 Meet Buddy – Your AI Academic Assistant</h1>
        <p className="text-gray-600 dark:text-gray-300">Your personal AI tutor, available 24/7</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool, idx) => {
          const isUploadTool = tool.label === "Upload File/Folder"
          return (
            <Card 
              key={idx} 
              onClick={() => {
                if (isUploadTool) router.push('/upload')
              }}
              className="cursor-pointer hover:shadow-lg transition overflow-hidden"
            >
              <CardContent className={`flex items-center p-4 bg-gradient-to-r ${tool.color} text-white`}>
                {tool.icon}
                <span className="text-base font-medium">{tool.label}</span>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="mt-6">
        <CardContent className="p-4">
          <ScrollArea className="h-[400px] pr-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((message, idx) => (
                <div
                  key={idx}
                  className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.role === 'assistant'
                        ? 'bg-gray-100 dark:bg-gray-800'
                        : 'bg-blue-500 text-white'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
            <Input
              placeholder="Ask anything..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-grow"
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
