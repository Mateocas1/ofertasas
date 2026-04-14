'use client'

import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Página no encontrada</h2>
        <p className="text-gray-600 mb-6">
          La página que buscas no existe o fue movida.
        </p>
        <Button onClick={() => window.location.href = '/'}>
          Volver al inicio
        </Button>
      </div>
    </div>
  )
}