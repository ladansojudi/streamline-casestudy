import type { Metadata } from "next"
import { Geist, Geist_Mono, Noto_Sans } from "next/font/google"

import "./globals.css"
import { cn } from "@/lib/utils"
import { DashboardLayout } from "@/layouts/dashboard-layout"
import { ThemeProvider } from "@/layouts/theme-provider"

const geistHeading = Geist({subsets:['latin'],variable:'--font-heading'})
const notoSans = Noto_Sans({subsets:['latin'],variable:'--font-sans'})
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })

export const metadata: Metadata = {
  title: "Insider One — Dashboard",
  description: "Insider One case study dashboard.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
              "h-full antialiased font-sans",
              geistMono.variable
            , "font-sans", notoSans.variable, geistHeading.variable)}
    >
      <body className="min-h-full">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <DashboardLayout>{children}</DashboardLayout>
        </ThemeProvider>
      </body>
    </html>
  )
}
