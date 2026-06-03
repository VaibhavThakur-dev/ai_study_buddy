import type { Metadata, Viewport } from "next"
import { Poppins, Libre_Baskerville, IBM_Plex_Mono } from "next/font/google"
import { Providers } from "@/components/providers"
import BottomNav from "@/components/bottom-nav"
import "./globals.css"
import "katex/dist/katex.min.css"

const fontSans = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
})

const fontSerif = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-serif",
})

const fontMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "AI Study Buddy",
  description: "AI-powered learning platform — syllabus se padho, test do, progress track karo",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "StudyBuddy",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon-192.png", sizes: "192x192" },
    ],
    apple: "/icon-180.png",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F9FF" },
    { media: "(prefers-color-scheme: dark)", color: "#0F172A" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icon-180.png" />
        <link rel="apple-touch-startup-image" href="/icon-512.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="StudyBuddy" />
      </head>
      <body className={`${fontSans.variable} ${fontSerif.variable} ${fontMono.variable} antialiased`}>
        <Providers>
          {children}
          <BottomNav />
        </Providers>
      </body>
    </html>
  )
}
