import type { Metadata, Viewport } from 'next'
import { Montserrat } from 'next/font/google'
import './globals.css'
import { LojaProvider } from '@/lib/loja'
import { AvisosProvider } from '@/components/ds/Avisos'

const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-montserrat', display: 'swap' })

export const metadata: Metadata = {
  title: 'Parceiros | Raul Consórcio',
  description: 'Programa de parceiros do Raul Consórcio',
}

export const viewport: Viewport = { themeColor: '#F3F3F4', width: 'device-width', initialScale: 1 }

const temaInicial = `try{if(localStorage.getItem('rc-tema')==='dark')document.documentElement.classList.add('dark')}catch(e){}`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={montserrat.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: temaInicial }} />
      </head>
      <body>
        <LojaProvider>
          <AvisosProvider>{children}</AvisosProvider>
        </LojaProvider>
      </body>
    </html>
  )
}
