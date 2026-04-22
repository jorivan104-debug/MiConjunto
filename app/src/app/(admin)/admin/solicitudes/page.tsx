import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { pqrsBandeja } from "@/lib/admin-mock-data";

function estadoVariant(
  e: (typeof pqrsBandeja)[0]["estado"]
): "success" | "info" | "warning" {
  if (e === "Resuelto") return "success";
  if (e === "En curso") return "info";
  return "warning";
}

function categoriaVariant(
  c: (typeof pqrsBandeja)[0]["categoria"]
): "info" | "danger" | "warning" | "neutral" {
  const map = {
    Petición: "info" as const,
    Queja: "danger" as const,
    Reclamo: "warning" as const,
    Sugerencia: "neutral" as const,
  };
  return map[c];
}

export default function AdminSolicitudesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-text sm:text-2xl">Solicitudes</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Bandeja PQRS del conjunto (mock)
          </p>
        </div>
        <Button variant="secondary" size="sm" type="button">
          Exportar CSV
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {["Todos", "Pendiente", "En curso", "Resuelto"].map((f, i) => (
          <button
            key={f}
            type="button"
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              i === 0
                ? "bg-secondary text-white"
                : "bg-surface border border-border text-text-secondary hover:border-secondary/40"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {pqrsBandeja.map((p) => (
          <Card key={p.id} padding="md">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono text-text-muted">
                    {p.radicado}
                  </span>
                  <Badge variant={categoriaVariant(p.categoria)}>
                    {p.categoria}
                  </Badge>
                  <Badge variant={estadoVariant(p.estado)} dot>
                    {p.estado}
                  </Badge>
                </div>
                <h2 className="text-sm font-semibold text-text mt-2">{p.asunto}</h2>
                <p className="text-xs text-text-muted mt-1">
                  Unidad: {p.unidad} · Radicado {p.fecha}
                </p>
                {p.responsable && (
                  <p className="text-xs text-text-secondary mt-1">
                    Responsable: {p.responsable}
                  </p>
                )}
              </div>
              <div className="flex gap-2 shrink-0 sm:flex-col">
                <Button variant="ghost" size="sm" type="button">
                  Ver detalle
                </Button>
                <Button variant="primary" size="sm" type="button">
                  Actualizar
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
