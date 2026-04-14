'use client'

import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Algo salió mal</h2>
        <p className="text-red-500 mb-6">
          {error.message || "Ocurrió un error inesperado"}
        </p>
        <div className="flex gap-4">
          <Button onClick={() => reset()}>Reintentar</Button>
          <Button variant="outline" onClick={() => window.location.href = '/'}>
            Volver al inicio
          </Button>
        </div>
      </div>
    </div>
  )
}