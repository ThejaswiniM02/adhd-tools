import './globals.css'

export const metadata = {
  title: 'brain dump 🧠',
  description: 'ADHD todo + priority tracker',
  icons: { icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🧠</text></svg>' }
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <nav>
          <a href="/">brain dump</a>
          <a href="/tasks">active tasks</a>
          <a href="/completed">completed</a>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  )
}