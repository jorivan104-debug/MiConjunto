import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { ClipboardList } from 'lucide-react'

export default function RequestsAdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-ink-900">Solicitudes (PQRS)</h1>
        <p className="text-ink-500 mt-1">Bandeja de peticiones, quejas, reclamos y sugerencias.</p>
      </div>

      <Card tone="blue">
        <CardHeader>
          <div>
            <CardTitle>Bandeja de PQRS</CardTitle>
            <CardDescription>Las solicitudes se gestionan desde el módulo de Comunidad como categoría especializada.</CardDescription>
          </div>
          <ClipboardList className="h-5 w-5 text-brand-blue" />
        </CardHeader>
        <p className="text-sm text-ink-700">
          Crea una categoría de tipo "complaint" o "suggestion" en el módulo de Comunidad para canalizar las PQRS aquí.
          Las denuncias se asignan automáticamente a un caso con seguimiento, severidad y estado.
        </p>
      </Card>
    </div>
  )
}
