'use client'

import { useState } from 'react'
import { useUser } from '@/contexts/user-context'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Upload, FileText, CheckCircle, XCircle } from 'lucide-react'

export default function UploadPage() {
  const { user } = useUser()
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (selectedFile.type !== 'application/pdf') {
        setErrorMessage('Please select a PDF file')
        return
      }
      setFile(selectedFile)
      setErrorMessage('')
      setUploadStatus('idle')
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setErrorMessage('No file selected')
      return
    }

    if (!user) {
      setErrorMessage('User not logged in')
      return
    }

    try {
      setUploading(true)
      setErrorMessage('')

      // Get session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session?.user) {
        throw new Error('Unable to retrieve session')
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
      const filePath = `${session.user.id}/${fileName}`

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('pdfs')
        .upload(filePath, file)

      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        throw new Error('File upload to storage failed')
      }

      // Insert into resources
      const { data, error: dbError } = await supabase
        .from('resources')
        .insert([
          {
            user_id: session.user.id,
            resource_type: 'pdf',
            title: file.name,
            file_url: filePath,
            content_text: '',
            created_at: new Date().toISOString(),
            // subject_id: 'your-subject-id-here' // <- If required, add this
          }
        ])
        .select() // get back data to verify success

      if (dbError) {
        console.error('DB insert error:', dbError)
        // Cleanup file if DB insert fails
        await supabase.storage.from('pdfs').remove([filePath])
        throw new Error('Database insert failed')
      }

      console.log('Upload complete:', data)

      setUploadStatus('success')
      setFile(null)
      const fileInput = document.getElementById('file-input') as HTMLInputElement
      if (fileInput) fileInput.value = ''
    } catch (error: any) {
      console.error('Upload error:', error)
      setUploadStatus('error')
      setErrorMessage(error.message || 'Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-gradient-to-br from-cyan-400 to-blue-500 p-8 rounded-2xl shadow-lg">
          <h1 className="text-2xl font-bold text-white mb-6">Upload Documents</h1>
          
          <div className="bg-white/20 backdrop-blur-lg p-6 rounded-xl mb-6">
            <div className="border-2 border-dashed border-white/40 rounded-lg p-8 text-center">
              <input
                type="file"
                id="file-input"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="file-input"
                className="flex flex-col items-center cursor-pointer"
              >
                <Upload className="w-12 h-12 text-white mb-4" />
                <span className="text-white text-lg mb-2">
                  {file ? file.name : 'Choose a PDF file'}
                </span>
                <span className="text-white/70 text-sm">
                  Click to browse or drag and drop
                </span>
              </label>
            </div>
          </div>

          {errorMessage && (
            <div className="bg-red-500/20 backdrop-blur-lg text-white p-4 rounded-lg mb-4 flex items-center">
              <XCircle className="w-5 h-5 mr-2" />
              {errorMessage}
            </div>
          )}

          {uploadStatus === 'success' && (
            <div className="bg-green-500/20 backdrop-blur-lg text-white p-4 rounded-lg mb-4 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              File uploaded successfully!
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg text-white transition-all
                ${!file || uploading
                  ? 'bg-white/20 cursor-not-allowed'
                  : 'bg-white/30 hover:bg-white/40'
                }`}
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  <span>Upload Document</span>
                </>
              )}
            </button>

            <button
              onClick={() => router.back()}
              className="px-6 py-3 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
