import React from 'react'
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Talking Tanuki - AI Japanese Language Learning',
  description: 'Learn Japanese through natural conversation with your AI-powered language partner',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-white">{children}</body>
    </html>
  )
}
