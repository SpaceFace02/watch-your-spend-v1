import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Provider } from '@/components/ui/provider'
import { Toaster } from 'react-hot-toast'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata = {
  title: 'Watch Your Spend',
  description: 'Analyzes your bank statements and provides insights.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Provider>
          <Toaster />
          {children}
        </Provider>
      </body>
    </html>
  )
}
