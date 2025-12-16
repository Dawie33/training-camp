import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ThemeProvider } from "@/components/layout/theme-provider"
import { AuthProvider } from "@/contexts/AuthContext"
import { SportProvider } from "@/contexts/SportContext"
import { cn } from "@/lib/utils"
import { Geist_Mono, Poppins } from "next/font/google"
import type { Metadata } from "next"
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

export const metadata: Metadata = {
  title: "Training Camp",
  description: "Votre application de coaching sportif",
  manifest: "/manifest.json",
  themeColor: "#000000",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Training Camp",
  },
  icons: {
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
}

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
          defaultTheme="light"
          forcedTheme="light"
          disableTransitionOnChange
        >
          <AuthProvider>
            <SportProvider>
              <DashboardLayout>
                {children}
              </DashboardLayout>
              <Toaster />
            </SportProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
