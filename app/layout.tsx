import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "PinkSync - Deaf-First AI Accessibility Platform",
  description:
    "Where Deaf Syncs with Power. Automate accessibility, sync humans with AI, and elevate deaf technology ecosystems.",
  keywords: ["accessibility", "deaf", "sign language", "AI", "translation", "interpreters"],
  authors: [{ name: "PinkSync Team" }],
  openGraph: {
    title: "PinkSync - Deaf-First AI Accessibility Platform",
    description: "Revolutionary accessibility platform built with Deaf people at the center",
    url: "https://pinksync.io",
    siteName: "PinkSync",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "PinkSync Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PinkSync - Deaf-First AI Accessibility Platform",
    description: "Revolutionary accessibility platform built with Deaf people at the center",
    images: ["/og-image.png"],
  },
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#FF1CCB",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
