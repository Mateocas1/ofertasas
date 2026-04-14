import { ReactNode } from 'react'

export function Footer() {
  return (
    <footer className="border-t py-6 md:py-8">
      <div className="container flex flex-col items-center justify-center gap-4 md:flex-row">
        <p className="text-center text-sm text-gray-500">
          © {new Date().getFullYear()} oferTASAS. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  )
}