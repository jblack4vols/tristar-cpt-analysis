import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/lib/theme'
import { ToastProvider } from '@/components/Toast'

export const metadata: Metadata = {
  title: 'Tristar PT — CPT Analytics',
  description: 'CPT Revenue Analytics for Tristar Physical Therapy',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 antialiased">
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
