import type { Metadata } from "next"
import { Architects_Daughter } from "next/font/google"
import { Providers } from "@/components/providers"
import "./globals.css"
import "katex/dist/katex.min.css"

const fontSans = Architects_Daughter({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "AI Study Buddy",
  description: "AI-powered study platform for smarter learning",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fontSans.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}