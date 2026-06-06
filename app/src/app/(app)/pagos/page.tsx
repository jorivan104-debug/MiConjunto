"use client";

import { useState } from "react";
import {
  Wallet,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronDown,
  Download,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  payments,
  formatCurrency,
  formatDate,
  getPaymentStatusLabel,
  type PaymentStatus,
} from "@/lib/mock-data";

type FilterTab = "all" | PaymentStatus;

const statusConfig: Record<
  PaymentStatus,
  { icon: typeof CheckCircle2; variant: "success" | "info" | "danger" }
> = {
  paid: { icon: CheckCircle2, variant: "success" },
  pending: { icon: Clock, variant: "info" },
  overdue: { icon: AlertTriangle, variant: "danger" },
};

export default function PagosPage() {
  const [filter, setFilter] = useState<FilterTab>("all");

  const filtered =
    filter === "all"
      ? payments
      : payments.filter((p) => p.status === filter);

  const totalPending = payments
    .filter((p) => p.status !== "paid")
    .reduce((s, p) => s + p.amount, 0);

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "Todos" },
    { key: "pending", label: "Pendientes" },
    { key: "overdue", label: "Vencidos" },
    { key: "paid", label: "Pagados" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text sm:text-2xl">Pagos</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Historial y estado de tus cuotas
          </p>
        </div>
        <Button variant="ghost" size="sm">
          <Download size={16} />
          Estado de cuenta
        </Button>
      </div>

      {/* Summary */}
      <Card className="bg-gradient-to-br from-surface to-secondary-50" padding="lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-text-secondary font-medium">
              Total pendiente
            </p>
            <p className="text-2xl font-bold text-secondary mt-1">
              {formatCurrency(totalPending)}
            </p>
          </div>
          <div className="h-12 w-12 rounded-full bg-secondary/10 text-secondary flex items-center justify-center">
            <Wallet size={24} strokeWidth={1.8} />
          </div>
        </div>
      </Card>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-surface-alt p-1 rounded-[--radius-md]">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex-1 text-xs font-medium py-2 rounded-[--radius-sm] transition-colors ${
              filter === tab.key
                ? "bg-surface text-text shadow-sm"
                : "text-text-secondary hover:text-text"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Payment list */}
      <div className="space-y-3">
        {filtered.map((payment) => {
          const config = statusConfig[payment.status];
          const Icon = config.icon;
          return (
            <Card key={payment.id} padding="sm">
              <div className="flex items-center gap-3">
                <div
                  className={`shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                    payment.status === "paid"
                      ? "bg-primary-50 text-primary"
                      : payment.status === "overdue"
                      ? "bg-danger-50 text-danger"
                      : "bg-secondary-50 text-secondary"
                  }`}
                >
                  <Icon size={20} strokeWidth={1.8} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-text truncate pr-2">
                      {payment.concept}
                    </h3>
                    <span
                      className={`text-sm font-bold shrink-0 ${
                        payment.status === "paid"
                          ? "text-primary"
                          : payment.status === "overdue"
                          ? "text-danger"
                          : "text-text"
                      }`}
                    >
                      {formatCurrency(payment.amount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-text-muted">{payment.month}</p>
                    <Badge variant={config.variant} dot>
                      {getPaymentStatusLabel(payment.status)}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    {payment.status === "paid" && payment.paidDate
                      ? `Pagado el ${formatDate(payment.paidDate)}`
                      : `Vence ${formatDate(payment.dueDate)}`}
                  </p>
                </div>
              </div>

              {payment.status !== "paid" && (
                <div className="mt-3 pt-3 border-t border-border">
                  <Button
                    variant={
                      payment.status === "overdue" ? "danger" : "primary"
                    }
                    size="sm"
                    fullWidth
                  >
                    <Wallet size={14} />
                    Pagar {formatCurrency(payment.amount)}
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-text-muted text-sm">
          No hay pagos en esta categoría.
        </div>
      )}
    </div>
  );
}
