import {
  Wallet,
  FileText,
  CalendarDays,
  AlertTriangle,
  Megaphone,
  Wrench,
  PartyPopper,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  payments,
  announcements,
  formatCurrency,
  formatDate,
  type Announcement,
} from "@/lib/mock-data";

const categoryConfig: Record<
  Announcement["category"],
  { icon: typeof Megaphone; variant: "info" | "warning" | "danger" | "success"; label: string }
> = {
  general: { icon: Megaphone, variant: "info", label: "General" },
  maintenance: { icon: Wrench, variant: "warning", label: "Mantenimiento" },
  event: { icon: PartyPopper, variant: "success", label: "Evento" },
  urgent: { icon: AlertTriangle, variant: "danger", label: "Urgente" },
};

export default function DashboardPage() {
  const pendingPayments = payments.filter((p) => p.status !== "paid");
  const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
  const hasOverdue = pendingPayments.some((p) => p.status === "overdue");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text sm:text-2xl">
          Hola, Carlos
        </h1>
        <p className="text-sm text-text-secondary mt-0.5">
          Apto 402 · Torre A — Conjunto Residencial Los Robles
        </p>
      </div>

      {/* Payment summary */}
      <Card
        className={`${
          hasOverdue
            ? "!border-danger/30 bg-gradient-to-br from-surface to-danger-50"
            : "bg-gradient-to-br from-surface to-primary-50"
        }`}
        padding="lg"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-text-secondary">
              Saldo pendiente
            </p>
            <p
              className={`text-2xl font-bold mt-1 ${
                hasOverdue ? "text-danger" : "text-primary"
              }`}
            >
              {formatCurrency(totalPending)}
            </p>
            <div className="flex items-center gap-2 mt-2">
              {pendingPayments.map((p) => (
                <Badge
                  key={p.id}
                  variant={p.status === "overdue" ? "danger" : "info"}
                  dot
                >
                  {p.month.split(" ")[0]}
                </Badge>
              ))}
            </div>
          </div>
          <Link
            href="/pagos"
            className="shrink-0 flex items-center gap-1.5 bg-primary text-white text-sm font-medium px-4 py-2.5 rounded-[--radius-md] hover:bg-primary-light transition-colors shadow-sm"
          >
            <Wallet size={16} />
            Pagar
          </Link>
        </div>
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            href: "/pagos",
            icon: Wallet,
            label: "Pagos",
            color: "text-primary",
            bg: "bg-primary-50",
          },
          {
            href: "/solicitudes",
            icon: FileText,
            label: "Nueva solicitud",
            color: "text-secondary",
            bg: "bg-secondary-50",
          },
          {
            href: "/comunidad",
            icon: CalendarDays,
            label: "Reservar",
            color: "text-accent",
            bg: "bg-accent-50",
          },
        ].map((action) => (
          <Link key={action.href + action.label} href={action.href}>
            <Card className="flex flex-col items-center gap-2 text-center hover:shadow-[--shadow-dropdown] transition-shadow cursor-pointer">
              <div
                className={`h-10 w-10 rounded-full ${action.bg} ${action.color} flex items-center justify-center`}
              >
                <action.icon size={20} strokeWidth={1.8} />
              </div>
              <span className="text-xs font-medium text-text-secondary">
                {action.label}
              </span>
            </Card>
          </Link>
        ))}
      </div>

      {/* Announcements */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-text">Anuncios</h2>
          <Link
            href="/comunidad"
            className="text-xs font-medium text-secondary hover:underline flex items-center gap-0.5"
          >
            Ver todos <ChevronRight size={14} />
          </Link>
        </div>
        <div className="space-y-3">
          {announcements.slice(0, 3).map((ann) => {
            const config = categoryConfig[ann.category];
            const Icon = config.icon;
            return (
              <Card key={ann.id} padding="sm">
                <div className="flex gap-3">
                  <div
                    className={`shrink-0 h-9 w-9 rounded-[--radius-sm] flex items-center justify-center ${
                      config.variant === "danger"
                        ? "bg-danger-50 text-danger"
                        : config.variant === "warning"
                        ? "bg-accent-50 text-accent"
                        : config.variant === "success"
                        ? "bg-primary-50 text-primary"
                        : "bg-secondary-50 text-secondary"
                    }`}
                  >
                    <Icon size={18} strokeWidth={1.8} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-sm font-semibold text-text truncate">
                        {ann.title}
                      </h3>
                      <Badge variant={config.variant}>{config.label}</Badge>
                    </div>
                    <p className="text-xs text-text-secondary line-clamp-2">
                      {ann.body}
                    </p>
                    <p className="text-[11px] text-text-muted mt-1">
                      {ann.author} · {formatDate(ann.date)}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
