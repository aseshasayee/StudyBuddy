'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Book, BookOpen, Brain, FileText } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { startChat } from '@/lib/gemini'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface StudyMaterials {
  summary: string;
  flashcards: Array<{ question: string; answer: string }>;
  mcqs: Array<{
    question: string;
    options: string[];
    answer: string;
    userAnswer?: string;
  }>;
}

export default function StudyMaterialsPage() {
  const [materials, setMaterials] = useState<StudyMaterials>({
    summary: '',
    flashcards: [],
    mcqs: []
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [score, setScore] = useState<number | null>(null)
  const [showAnswers, setShowAnswers] = useState(false)

  useEffect(() => {
    const generateMaterials = async () => {
      const summary = localStorage.getItem('pdfSummary')
      if (!summary) return

      setLoading(true)
      try {
        const chat = await startChat()
        
        // Generate flashcards
        const flashcardsResult = await chat.sendMessage(
          `Create 5 flashcards from this summary. Return ONLY a JSON array with this format: [{"question": "...", "answer": "..."}]. Summary: ${summary}`
        )
        const flashcardsText = await flashcardsResult.response.text()
        const flashcards = JSON.parse(flashcardsText.replace(/```json\n|\n```/g, '').trim())

        // Generate MCQs
        const mcqsResult = await chat.sendMessage(
          `Create 5 multiple choice questions from this summary. Return ONLY a JSON array with this format: [{"question": "...", "options": ["...", "...", "...", "..."], "answer": "..."}]. Summary: ${summary}`
        )
        const mcqsText = await mcqsResult.response.text()
        const mcqs = JSON.parse(mcqsText.replace(/```json\n|\n```/g, '').trim())

        setMaterials({
          summary,
          flashcards,
          mcqs: mcqs.map(mcq => ({ ...mcq, userAnswer: undefined }))
        })
      } catch (err) {
        setError('Failed to generate study materials')
      } finally {
        setLoading(false)
      }
    }

    generateMaterials()
  }, [])

  const handleAnswerSelect = (questionIndex: number, selectedOption: string) => {
    setMaterials(prev => ({
      ...prev,
      mcqs: prev.mcqs.map((q, i) => 
        i === questionIndex ? { ...q, userAnswer: selectedOption } : q
      )
    }))
  }

  const calculateScore = () => {
    const correctAnswers = materials.mcqs.filter(q => q.userAnswer === q.answer).length
    const totalQuestions = materials.mcqs.length
    setScore((correctAnswers / totalQuestions) * 100)
    setShowAnswers(true)
  }

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Generating study materials...</div>
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold mb-4">📚 Study Materials</h1>
          <p className="text-xl text-gray-300">Your personalized learning resources</p>
        </motion.div>

        <Tabs defaultValue="summary" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800/50 p-1 rounded-xl">
            <TabsTrigger 
              value="summary" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <FileText className="w-4 h-4 mr-2" />
              Summary
            </TabsTrigger>
            <TabsTrigger 
              value="flashcards"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Flashcards
            </TabsTrigger>
            <TabsTrigger 
              value="quiz"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <Brain className="w-4 h-4 mr-2" />
              Quiz
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl shadow-xl"
            >
              <ScrollArea className="h-[600px]">
                <div className="prose prose-invert max-w-none">
                  {materials.summary.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-4">{paragraph}</p>
                  ))}
                </div>
              </ScrollArea>
            </motion.div>
          </TabsContent>

          <TabsContent value="flashcards" className="space-y-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid md:grid-cols-2 gap-6"
            >
              {materials.flashcards.map((card, index) => (
                <Card key={index} className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 backdrop-blur-sm border-gray-700 p-6">
                  <h3 className="font-semibold text-xl mb-4">Q: {card.question}</h3>
                  <p className="text-gray-300">A: {card.answer}</p>
                </Card>
              ))}
            </motion.div>
          </TabsContent>

          <TabsContent value="quiz" className="space-y-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6"
            >
              {materials.mcqs.map((mcq, index) => (
                <div key={index} className="mb-8 last:mb-0">
                  <h3 className="font-semibold text-xl mb-4">Q: {mcq.question}</h3>
                  <ul className="space-y-3">
                    {mcq.options.map((option, optIndex) => (
                      <li 
                        key={optIndex}
                        onClick={() => !showAnswers && handleAnswerSelect(index, option)}
                        className={`p-4 rounded-lg cursor-pointer transition-all ${
                          showAnswers
                            ? option === mcq.answer
                              ? 'bg-green-600/20 border border-green-500'
                              : option === mcq.userAnswer
                              ? 'bg-red-600/20 border border-red-500'
                              : 'bg-gray-700/30'
                            : mcq.userAnswer === option
                            ? 'bg-blue-600/20 border border-blue-500'
                            : 'bg-gray-700/30 hover:bg-gray-700/50'
                        }`}
                      >
                        {option}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {!showAnswers && (
                <Button
                  onClick={calculateScore}
                  disabled={!materials.mcqs.every(q => q.userAnswer)}
                  className="w-full md:w-auto mx-auto block mt-8 bg-blue-600 hover:bg-blue-700"
                >
                  Submit Answers
                </Button>
              )}

              {score !== null && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center text-2xl font-semibold mt-8"
                >
                  Your Score: {score}%
                </motion.div>
              )}
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}