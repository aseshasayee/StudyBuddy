'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useUser } from '@/contexts/user-context'
import { FileText, Book } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Remove the direct import of pdfjs
// import * as pdfjs from 'pdfjs-dist'

interface PdfFile {
  name: string
  created_at: string
  url: string
}

export default function PdfAnalysis() {
  const { user } = useUser()
  const [file, setFile] = useState<File | null>(null)
  const [analysis, setAnalysis] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pdfs, setPdfs] = useState<PdfFile[]>([])
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null)
  const [summary, setSummary] = useState('')
  const [selectedPdfName, setSelectedPdfName] = useState('')

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
      // Upload file to Supabase Storage
      const fileName = `${user.id}/${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase
        .storage
        .from('pdfs')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Extract text from PDF
      const extractedText = await extractTextFromPdf(file)

      // Send to Gemini API
      const prompt = `
        Analyze this study material and summarize the main points:
        ${extractedText}
      `

      const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_GEMINI_API_KEY}`
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048
          }
        }),
      })

      const result = await response.json()
      console.log('API Response:', result)

      if (result.error) {
        throw new Error(result.error.message || 'API Error')
      }

      setAnalysis(result.candidates[0].content.parts[0].text)
      await fetchUserPdfs()
    } catch (err: any) {
      console.error('Error:', err)
      setError(err.message || 'Failed to analyze PDF')
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
      
      console.log('Extracted text length:', extractedText.length)
      if (!extractedText.trim()) {
        throw new Error('No text was extracted from the PDF')
      }
      
      const prompt = `Please provide a concise summary of this text: ${extractedText}`
      const aiResponse = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_GEMINI_API_KEY}`
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048
          }
        }),
      })

      const result = await aiResponse.json()
      console.log('API Response:', result)

      if (result.error) {
        throw new Error(result.error.message || 'API Error')
      }

      setSummary(result.candidates[0].content.parts[0].text)
    } catch (err: any) {
      console.error('Error:', err)
      setError(err.message || 'Failed to analyze PDF')
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
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-4">Summary</h2>
                    <div className="prose dark:prose-invert max-w-none">
                      {summary.split('\n').map((paragraph, index) => (
                        <p key={index} className="mb-4">{paragraph}</p>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}