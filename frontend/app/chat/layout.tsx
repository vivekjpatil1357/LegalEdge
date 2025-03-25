'use client'
import type { ReactNode } from 'react'
import ChatSidebar from '@/components/ChatSidebar'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Toaster } from 'sonner'
interface LayoutProps {
  children: ReactNode
}
export default function EventLayout({ children }: LayoutProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  if (!mounted) {
    return null
  }
  return (
    <div className={`flex h-screen ${theme === 'dark' ? 'dark' : ''}`}>
      {/* <Toaster richColors/> */}
      <ChatSidebar />
      <div className='w-full flex flex-1 flex-col'>
        
        <main className='flex-1 overflow-auto p-6 bg-white dark:bg-[#0F0F12]'>
          {children}
        </main>
      </div>
    </div>
  )
}