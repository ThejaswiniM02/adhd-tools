'use client'
import { useState, useEffect } from 'react'
import './globals.css'

export default function RootLayout({ children }) {
  const [theme, setTheme] = useState('dark')

  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'dark'
    setTheme(saved)
    document.documentElement.setAttribute('data-theme', saved)
  }, [])

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('theme', next)
    document.documentElement.setAttribute('data-theme', next)
  }

  return (
    <html lang="en">
      <head>
        <title>brain dump 🧠</title>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🧠</text></svg>" />
      </head>
      <body>
        <nav>
          <a href="/">brain dump</a>
          <a href="/tasks">active tasks</a>
          <a href="/completed">completed</a>
          <button className="theme-toggle" onClick={toggle}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  )
}