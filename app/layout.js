import './globals.css'

export const metadata = {
  title: 'ADHD Tools',
  description: 'Todo + Priority Calculator',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <nav>
          <a href="/">brain dump</a>
          <a href="/priority">priority calc</a>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  )
}
