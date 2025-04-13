'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useUser } from '@/contexts/user-context'
import { FileText, Book } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { startChat } from '@/lib/gemini'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'

// Remove the direct import of pdfjs
// import * as pdfjs from 'pdfjs-dist'

interface PdfFile {
  name: string
  created_at: string
  url: string
}

// Add new state variables at the top of the component
export default function PdfAnalysis() {
  const searchParams = useSearchParams()
  const fileName = searchParams.get('fileName')
  const fileId = searchParams.get('fileId')

  useEffect(() => {
    if (fileName && fileId) {
      // Auto-select the recently uploaded PDF
      const recentFile = {
        name: fileName,
        url: supabase.storage.from('pdfs').getPublicUrl(fileId).data.publicUrl
      }
      setSelectedPdf(recentFile.url)
      setSelectedPdfName(recentFile.name)
    }
  }, [fileName, fileId])
  const { user } = useUser()
  const [file, setFile] = useState<File | null>(null)
  const [analysis, setAnalysis] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pdfs, setPdfs] = useState<PdfFile[]>([])
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null)
  const [summary, setSummary] = useState('')
  const [selectedPdfName, setSelectedPdfName] = useState('')
  const [flashcards, setFlashcards] = useState<Array<{ question: string; answer: string }>>([])
  const [mcqs, setMcqs] = useState<Array<{ question: string; options: string[]; answer: string }>>([])
  const router = useRouter()

  useEffect(() => {
    if (user) {
      fetchUserPdfs()
    }
  }, [user])

  const fetchUserPdfs = async () => {
    try {
      const { data, error } = await supabase
        .storage
        .from('pdfs')
        .list(`${user?.id}`)

      if (error) throw error

      const pdfList = await Promise.all(data.map(async (file) => {
        const { data: { publicUrl } } = supabase
          .storage
          .from('pdfs')
          .getPublicUrl(`${user?.id}/${file.name}`)

        return {
          name: file.name.split('-').slice(1).join('-'), // Remove timestamp prefix
          created_at: file.created_at,  // Keep the full timestamp
          url: publicUrl
        }
      }))

      setPdfs(pdfList)
    } catch (err) {
      console.error('Error fetching PDFs:', err)
    }
  }

  const extractTextFromPdf = async (file: File) => {
    try {
      // Dynamically import pdfjs only on client side
      const pdfjs = await import('pdfjs-dist')
      
      // Set worker source directly
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.mjs',
        import.meta.url
      ).toString()
      
      console.log('Starting PDF extraction...')
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise
      console.log(`PDF loaded. Total pages: ${pdf.numPages}`)
      
      let fullText = ''
      
      for (let i = 1; i <= pdf.numPages; i++) {
        console.log(`Processing page ${i}...`)
        const page = await pdf.getPage(i)
        const textContent = await page.getTextContent()
        const pageText = textContent.items.map((item: any) => item.str).join(' ')
        fullText += pageText + '\n'
      }
      
      console.log('Text extraction completed')
      if (!fullText.trim()) {
        throw new Error('No text was extracted from the PDF')
      }
      
      return fullText
    } catch (error) {
      console.error('Error extracting text from PDF:', error)
      throw new Error('Failed to extract text from PDF')
    }
  }

  const analyzePdf = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !user) return

    setLoading(true)
    setError('')

    try {
      // Upload and extract text as before
      const fileName = `${user.id}/${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase
        .storage
        .from('pdfs')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const extractedText = await extractTextFromPdf(file)
      
      // Use chat AI to summarize
      const chat = await startChat()
      const result = await chat.sendMessage(`Please summarize this text: ${extractedText}`)
      const summary = await result.response
      setAnalysis(summary.text())
      
      await fetchUserPdfs()
    } catch (err: any) {
      console.error('Error:', err)
      setError(err.message || 'Failed to analyze PDF')
    } finally {
      setLoading(false)
    }
  }

  const handleAnalyze = async () => {
    if (!selectedPdf) return
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch(selectedPdf)
      const pdfBlob = await response.blob()
      const extractedText = await extractTextFromPdf(new File([pdfBlob], selectedPdfName))
      
      // Use chat AI to summarize
      const chat = await startChat()
      const result = await chat.sendMessage(`Please summarize this text: ${extractedText}`)
      const summary = await result.response
      
      // Store the summary in localStorage and navigate
      localStorage.setItem('pdfSummary', summary.text())
      router.push('/study-materials')
    } catch (err: any) {
      console.error('Error:', err)
      setError(err.message || 'Failed to analyze PDF')
    } finally {
      setLoading(false)
    }
  }

  const generateStudyMaterials = async (text: string) => {
    try {
      const chat = await startChat()
      
      // Generate flashcards with clearer formatting instructions
      const flashcardsResult = await chat.sendMessage(
        `Generate 5 flashcards from this text. Respond ONLY with a JSON array in this exact format, with no additional text or markdown:
        [
          {"question": "Q1 here", "answer": "A1 here"},
          {"question": "Q2 here", "answer": "A2 here"}
        ]`
      )
      const flashcardsText = await flashcardsResult.response.text()
      // Clean the response before parsing
      const cleanFlashcardsText = flashcardsText.replace(/```json\n|\n```/g, '').trim()
      setFlashcards(JSON.parse(cleanFlashcardsText))

      // Generate MCQs with clearer formatting instructions
      const mcqsResult = await chat.sendMessage(
        `Generate 5 multiple choice questions from this text. Respond ONLY with a JSON array in this exact format, with no additional text or markdown:
        [
          {
            "question": "Q1 here",
            "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
            "answer": "Correct option here"
          }
        ]`
      )
      const mcqsText = await mcqsResult.response.text()
      // Clean the response before parsing
      const cleanMcqsText = mcqsText.replace(/```json\n|\n```/g, '').trim()
      setMcqs(JSON.parse(cleanMcqsText))
    } catch (err) {
      console.error('Error generating study materials:', err)
      setError('Failed to generate study materials')
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">PDF Analysis</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* PDF Upload and List Section */}
          <div className="md:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <form onSubmit={analyzePdf} className="mb-8">
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Upload PDF</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={loading || !file}
                className="w-full bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? 'Analyzing...' : 'Upload & Analyze'}
              </button>
            </form>

            <div className="space-y-2">
              <h2 className="text-lg font-semibold mb-4">Your PDFs</h2>
              {pdfs.map((pdf) => (
                <div 
                  key={`${pdf.name}-${pdf.created_at}`}  // Use combination of name and timestamp
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                  onClick={() => {
                    setSelectedPdf(pdf.url)
                    setSelectedPdfName(pdf.name)
                  }}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    <span className="text-sm truncate">{pdf.name}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      // Add analyze functionality for existing PDFs
                    }}
                    className="text-blue-500 hover:text-blue-600"
                  >
                    <Book className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* PDF Viewer and Analysis Section */}
          <div className="md:col-span-2">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {selectedPdf && (
              <>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-4">
                  <h2 className="text-lg font-semibold mb-2">{selectedPdfName}</h2>
                  <iframe
                    src={selectedPdf}
                    className="w-full h-[500px] rounded-lg"
                    title="PDF Viewer"
                  />
                  <Button
                    onClick={handleAnalyze}
                    disabled={loading}
                    className="mt-4 w-full"
                  >
                    {loading ? 'Analyzing...' : 'Generate Summary'}
                  </Button>
                </div>

                {summary && (
                  <>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-4">
                      <h2 className="text-lg font-semibold mb-4">Summary</h2>
                      <div className="prose dark:prose-invert max-w-none">
                        {summary.split('\n').map((paragraph, index) => (
                          <p key={index} className="mb-4">{paragraph}</p>
                        ))}
                      </div>
                    </div>

                    {flashcards.length > 0 && (
                      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-4">
                        <h2 className="text-lg font-semibold mb-4">Flashcards</h2>
                        <div className="space-y-4">
                          {flashcards.map((card, index) => (
                            <div key={index} className="border rounded-lg p-4">
                              <h3 className="font-medium mb-2">Q: {card.question}</h3>
                              <p className="text-gray-600 dark:text-gray-300">A: {card.answer}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {mcqs.length > 0 && (
                      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <h2 className="text-lg font-semibold mb-4">Multiple Choice Questions</h2>
                        <div className="space-y-6">
                          {mcqs.map((mcq, index) => (
                            <div key={index} className="border rounded-lg p-4">
                              <h3 className="font-medium mb-3">Q: {mcq.question}</h3>
                              <ul className="space-y-2">
                                {mcq.options.map((option, optIndex) => (
                                  <li 
                                    key={optIndex}
                                    className={`p-2 rounded ${
                                      option === mcq.answer 
                                        ? 'bg-green-100 dark:bg-green-900' 
                                        : 'bg-gray-50 dark:bg-gray-700'
                                    }`}
                                  >
                                    {option}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}