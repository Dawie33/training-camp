import { ThemeProvider } from "@/components/layout/theme-provider"
import { AuthProvider } from "@/contexts/AuthContext"
import { SportProvider } from "@/contexts/SportContext"
import { cn } from "@/lib/utils"
import { Geist_Mono, Poppins } from "next/font/google"
import { Toaster } from "sonner"
import "./globals.css"

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800']
})


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html suppressHydrationWarning lang="en" className="h-full">
      <body
        className={cn(poppins.variable, geistMono.variable, "antialiased", "h-full")}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <SportProvider>
              {children}
              <Toaster />
            </SportProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
