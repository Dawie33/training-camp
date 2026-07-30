import { ThemeProvider } from "@/components/layout/theme-provider"
import { AuthProvider } from "@/contexts/AuthContext"
import { IOSInstallBanner } from "@/components/layout/ios-install-banner"
import { cn } from "@/lib/utils"
import { Geist_Mono, Fraunces, Inter_Tight } from "next/font/google"
import type { Metadata } from "next"
import { Toaster } from "sonner"
import "./globals.css"

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const interTight = Inter_Tight({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const fraunces = Fraunces({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['400', '600', '900'],
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
        className={cn(interTight.variable, fraunces.variable, geistMono.variable, "font-sans", "antialiased", "h-full", "bg-background text-foreground")}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <IOSInstallBanner />
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
