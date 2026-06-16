import './globals.css'

export const metadata = { title: 'ADHD Tools', description: 'brain dump todo' }

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body><main>{children}</main></body>
    </html>
  )
}
