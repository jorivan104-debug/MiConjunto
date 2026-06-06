import Link from "next/link";
import {
  Home,
  Mail,
  Phone,
  Calendar,
  Percent,
  Shield,
  ChevronRight,
  LogOut,
  FileText,
  Bell,
  HelpCircle,
  LayoutDashboard,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { currentUser, formatDate } from "@/lib/mock-data";

const roleLabels: Record<string, string> = {
  owner: "Propietario",
  tenant: "Arrendatario",
  resident: "Residente",
};

const menuSections = [
  {
    title: "Cuenta",
    items: [
      { icon: Bell, label: "Notificaciones", href: "#" },
      { icon: Shield, label: "Seguridad y contraseña", href: "#" },
    ],
  },
  {
    title: "Información",
    items: [
      { icon: FileText, label: "Documentos del conjunto", href: "#" },
      { icon: HelpCircle, label: "Ayuda y soporte", href: "#" },
    ],
  },
];

export default function PerfilPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-text sm:text-2xl">Mi perfil</h1>

      {/* User card */}
      <Card padding="lg">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-secondary text-white text-xl font-bold flex items-center justify-center shrink-0">
            CM
          </div>
          <div>
            <h2 className="text-lg font-bold text-text">{currentUser.name}</h2>
            <p className="text-sm text-text-secondary">
              {currentUser.unit} · {currentUser.tower}
            </p>
            <span className="inline-block mt-1 text-xs font-semibold bg-primary-50 text-primary px-2 py-0.5 rounded-full">
              {roleLabels[currentUser.role]}
            </span>
          </div>
        </div>
      </Card>

      {/* Details */}
      <Card padding="md">
        <h3 className="text-sm font-semibold text-text mb-3">
          Datos personales
        </h3>
        <div className="space-y-3">
          {[
            { icon: Mail, label: "Correo", value: currentUser.email },
            { icon: Phone, label: "Teléfono", value: currentUser.phone },
            {
              icon: Home,
              label: "Unidad",
              value: `${currentUser.unit} — ${currentUser.tower}`,
            },
            {
              icon: Percent,
              label: "Coeficiente",
              value: `${currentUser.coefficient}%`,
            },
            {
              icon: Calendar,
              label: "Residente desde",
              value: formatDate(currentUser.since),
            },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-[--radius-sm] bg-surface-alt flex items-center justify-center text-text-muted shrink-0">
                <item.icon size={16} strokeWidth={1.8} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-text-muted">{item.label}</p>
                <p className="text-sm text-text truncate">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Menu sections */}
      {menuSections.map((section) => (
        <Card key={section.title} padding="sm">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide px-2 pt-1 pb-2">
            {section.title}
          </h3>
          {section.items.map((item, i) => (
            <a
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-2 py-3 hover:bg-surface-alt rounded-[--radius-sm] transition-colors ${
                i < section.items.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <item.icon size={18} className="text-text-muted" strokeWidth={1.8} />
              <span className="flex-1 text-sm text-text">{item.label}</span>
              <ChevronRight size={16} className="text-text-muted" />
            </a>
          ))}
        </Card>
      ))}

      <Card padding="sm">
        <Link
          href="/admin"
          className="flex items-center gap-3 px-2 py-3 hover:bg-surface-alt rounded-[--radius-sm] transition-colors"
        >
          <LayoutDashboard size={18} className="text-secondary" strokeWidth={1.8} />
          <span className="flex-1 text-sm font-medium text-secondary">
            Panel administración (demo)
          </span>
          <ChevronRight size={16} className="text-text-muted" />
        </Link>
      </Card>

      {/* Logout */}
      <button className="flex items-center justify-center gap-2 w-full py-3 text-sm font-medium text-danger hover:bg-danger-50 rounded-[--radius-md] transition-colors">
        <LogOut size={18} strokeWidth={1.8} />
        Cerrar sesión
      </button>
    </div>
  );
}
