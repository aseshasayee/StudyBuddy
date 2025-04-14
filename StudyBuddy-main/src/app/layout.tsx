import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { Navbar } from '@/components/shared/navbar'
import './globals.css'
import { UserProvider } from '@/contexts/user-context'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  adjustFontFallback: true
})

export const metadata = {
  title: 'StudyBuddy - Study Smarter',
  description: 'AI-powered study platform to help you learn effectively',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="min-h-screen bg-white dark:bg-gray-900">
        <UserProvider>
          <ThemeProvider>
            <div className="flex flex-col min-h-screen">
              <div className="z-50 fixed w-full top-0">
                <Navbar />
              </div>
              <main className="flex-1 mt-16">
                {children}
              </main>
            </div>
          </ThemeProvider>
        </UserProvider>
      </body>
    </html>
  )
}
