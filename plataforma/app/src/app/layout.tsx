import type { Metadata, Viewport } from 'next'
import { Archivo, Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { LojaProvider } from '@/lib/loja'
import { AvisosProvider } from '@/components/ds/Avisos'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const archivo = Archivo({ subsets: ['latin'], weight: ['600', '700', '800'], variable: '--font-archivo', display: 'swap' })
const jetbrains = JetBrains_Mono({ subsets: ['latin'], weight: ['500', '600'], variable: '--font-jetbrains', display: 'swap' })

export const metadata: Metadata = {
  title: 'Parceiros | Raul Consórcios',
  description: 'Plataforma de indicações e prêmios do Raul Consórcios Multimarcas',
}

export const viewport: Viewport = { themeColor: '#F1F2F4', width: 'device-width', initialScale: 1 }

const temaInicial = `try{if(localStorage.getItem('rc-tema')==='dark')document.documentElement.classList.add('dark')}catch(e){}`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={`${inter.variable} ${archivo.variable} ${jetbrains.variable}`}>
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
