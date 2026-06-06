"use client";

import { useState } from "react";
import {
  Plus,
  Clock,
  Loader2,
  CheckCircle2,
  Send,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  pqrsRequests,
  formatDate,
  getPQRSCategoryLabel,
  getPQRSStatusLabel,
  type PQRSRequest,
} from "@/lib/mock-data";

const statusConfig: Record<
  PQRSRequest["status"],
  { icon: typeof Clock; variant: "warning" | "info" | "success" }
> = {
  pending: { icon: Clock, variant: "warning" },
  in_progress: { icon: Loader2, variant: "info" },
  resolved: { icon: CheckCircle2, variant: "success" },
};

const categoryVariant: Record<PQRSRequest["category"], "info" | "danger" | "warning" | "neutral"> = {
  petition: "info",
  complaint: "danger",
  claim: "warning",
  suggestion: "neutral",
};

export default function SolicitudesPage() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text sm:text-2xl">
            Solicitudes
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Peticiones, quejas, reclamos y sugerencias
          </p>
        </div>
        <Button
          variant={showForm ? "ghost" : "primary"}
          size="sm"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "Cancelar" : "Nueva"}
        </Button>
      </div>

      {/* New request form */}
      {showForm && (
        <Card padding="lg" className="!border-primary/30">
          <h2 className="text-base font-semibold text-text mb-4">
            Nueva solicitud
          </h2>
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Categoría
              </label>
              <select className="w-full rounded-[--radius-md] border border-border bg-surface px-3 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
                <option value="">Seleccionar...</option>
                <option value="petition">Petición</option>
                <option value="complaint">Queja</option>
                <option value="claim">Reclamo</option>
                <option value="suggestion">Sugerencia</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Asunto
              </label>
              <input
                type="text"
                placeholder="Describe brevemente tu solicitud"
                className="w-full rounded-[--radius-md] border border-border bg-surface px-3 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Descripción
              </label>
              <textarea
                rows={4}
                placeholder="Proporciona todos los detalles relevantes..."
                className="w-full rounded-[--radius-md] border border-border bg-surface px-3 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
              />
            </div>
            <Button variant="primary" size="md" fullWidth>
              <Send size={16} />
              Enviar solicitud
            </Button>
          </form>
        </Card>
      )}

      {/* Request list */}
      <div className="space-y-3">
        {pqrsRequests.map((req) => {
          const sConfig = statusConfig[req.status];
          const StatusIcon = sConfig.icon;
          return (
            <Card key={req.id} padding="sm">
              <div className="flex items-start gap-3">
                <div
                  className={`shrink-0 mt-0.5 h-9 w-9 rounded-full flex items-center justify-center ${
                    req.status === "resolved"
                      ? "bg-primary-50 text-primary"
                      : req.status === "in_progress"
                      ? "bg-secondary-50 text-secondary"
                      : "bg-accent-50 text-accent"
                  }`}
                >
                  <StatusIcon size={18} strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-text">
                      {req.subject}
                    </h3>
                    <Badge variant={sConfig.variant} dot>
                      {getPQRSStatusLabel(req.status)}
                    </Badge>
                  </div>
                  <p className="text-xs text-text-secondary line-clamp-2 mt-1">
                    {req.description}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge variant={categoryVariant[req.category]}>
                      {getPQRSCategoryLabel(req.category)}
                    </Badge>
                    <span className="text-[11px] text-text-muted">
                      {req.id}
                    </span>
                    <span className="text-[11px] text-text-muted">
                      {formatDate(req.date)}
                    </span>
                  </div>
                  {req.status !== "resolved" && (
                    <p className="text-[11px] text-text-muted mt-1">
                      Última actualización: {formatDate(req.lastUpdate)}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
