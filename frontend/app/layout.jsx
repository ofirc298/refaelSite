import './styles.css'

export const metadata = { title: 'RAFCO', description: 'Catalog' }

export default function RootLayout({ children }){
  return (
    <html lang="he" dir="rtl" data-theme="light">
      <body>
        <header className="header">
          <div className="container nav">
            <a href="/catalog" className="brand" title="דף מוצרים">RAFCO</a>
            <nav style={{display:'flex', gap:8}}>
              <a href="/catalog">מוצרים</a>
              <a href="/checkout">עגלה</a>
            </nav>
          </div>
        </header>
        <main className="container">{children}</main>
        <footer className="footer">RAFCO ©</footer>
      </body>
    </html>
  )
}
