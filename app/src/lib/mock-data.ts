export type PaymentStatus = "paid" | "pending" | "overdue";

export interface Payment {
  id: string;
  concept: string;
  month: string;
  amount: number;
  status: PaymentStatus;
  dueDate: string;
  paidDate?: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  author: string;
  date: string;
  category: "general" | "maintenance" | "event" | "urgent";
}

export interface CommunityPost {
  id: string;
  author: string;
  unit: string;
  avatar: string;
  content: string;
  date: string;
  likes: number;
  comments: number;
}

export interface PQRSRequest {
  id: string;
  subject: string;
  description: string;
  category: "petition" | "complaint" | "claim" | "suggestion";
  status: "pending" | "in_progress" | "resolved";
  date: string;
  lastUpdate: string;
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  unit: string;
  tower: string;
  role: "owner" | "tenant" | "resident";
  coefficient: number;
  since: string;
}

export const currentUser: UserProfile = {
  name: "Carlos Mendoza",
  email: "carlos.mendoza@email.com",
  phone: "+57 310 456 7890",
  unit: "Apto 402",
  tower: "Torre A",
  role: "owner",
  coefficient: 2.34,
  since: "2021-03-15",
};

export const payments: Payment[] = [
  {
    id: "pay-001",
    concept: "Cuota ordinaria",
    month: "Abril 2026",
    amount: 385000,
    status: "pending",
    dueDate: "2026-04-30",
  },
  {
    id: "pay-002",
    concept: "Cuota extraordinaria - Fachada",
    month: "Abril 2026",
    amount: 150000,
    status: "overdue",
    dueDate: "2026-04-15",
  },
  {
    id: "pay-003",
    concept: "Cuota ordinaria",
    month: "Marzo 2026",
    amount: 385000,
    status: "paid",
    dueDate: "2026-03-31",
    paidDate: "2026-03-28",
  },
  {
    id: "pay-004",
    concept: "Cuota ordinaria",
    month: "Febrero 2026",
    amount: 385000,
    status: "paid",
    dueDate: "2026-02-28",
    paidDate: "2026-02-25",
  },
  {
    id: "pay-005",
    concept: "Cuota ordinaria",
    month: "Enero 2026",
    amount: 385000,
    status: "paid",
    dueDate: "2026-01-31",
    paidDate: "2026-01-30",
  },
  {
    id: "pay-006",
    concept: "Reserva Salón Social",
    month: "Enero 2026",
    amount: 80000,
    status: "paid",
    dueDate: "2026-01-20",
    paidDate: "2026-01-18",
  },
];

export const announcements: Announcement[] = [
  {
    id: "ann-001",
    title: "Corte de agua programado",
    body: "El día jueves 24 de abril se realizará mantenimiento en la red hidráulica. El servicio se suspenderá de 8:00 a.m. a 2:00 p.m.",
    author: "Administración",
    date: "2026-04-21",
    category: "maintenance",
  },
  {
    id: "ann-002",
    title: "Asamblea ordinaria 2026",
    body: "Se convoca a todos los copropietarios a la asamblea ordinaria el próximo sábado 3 de mayo a las 9:00 a.m. en el salón social.",
    author: "Consejo de Administración",
    date: "2026-04-20",
    category: "general",
  },
  {
    id: "ann-003",
    title: "Jornada de integración familiar",
    body: "Este domingo 27 de abril celebramos el Día del Niño con actividades recreativas en la zona BBQ de 10:00 a.m. a 4:00 p.m.",
    author: "Comité Social",
    date: "2026-04-18",
    category: "event",
  },
  {
    id: "ann-004",
    title: "Cuota extraordinaria - Fachada",
    body: "Recordamos que la fecha límite para el pago de la cuota extraordinaria aprobada en asamblea fue el 15 de abril. Quienes no han pagado, favor acercarse a administración.",
    author: "Administración",
    date: "2026-04-16",
    category: "urgent",
  },
];

export const communityPosts: CommunityPost[] = [
  {
    id: "post-001",
    author: "María García",
    unit: "Apto 201 - Torre B",
    avatar: "MG",
    content:
      "¿Alguien sabe si ya abrieron las inscripciones para las clases de yoga los sábados? El año pasado estuvieron muy buenas.",
    date: "2026-04-22T08:30:00",
    likes: 12,
    comments: 5,
  },
  {
    id: "post-002",
    author: "Administración",
    unit: "Administración",
    avatar: "AD",
    content:
      "Les informamos que el ascensor de la Torre A ya fue reparado y se encuentra en funcionamiento normal. Agradecemos su paciencia.",
    date: "2026-04-21T15:00:00",
    likes: 34,
    comments: 8,
  },
  {
    id: "post-003",
    author: "Pedro Ramírez",
    unit: "Apto 801 - Torre A",
    avatar: "PR",
    content:
      "Vecinos, encontré un gato gris en el parqueadero del sótano 2. Si alguien lo reconoce, por favor contácteme al 310-555-1234.",
    date: "2026-04-21T10:20:00",
    likes: 8,
    comments: 3,
  },
  {
    id: "post-004",
    author: "Laura Sánchez",
    unit: "Apto 503 - Torre C",
    avatar: "LS",
    content:
      "Quiero felicitar al personal de aseo por el excelente trabajo que están haciendo. Las zonas comunes siempre están impecables.",
    date: "2026-04-20T18:45:00",
    likes: 45,
    comments: 12,
  },
  {
    id: "post-005",
    author: "Andrés López",
    unit: "Local 3",
    avatar: "AL",
    content:
      "Desde mi tienda de abarrotes les ofrezco un 10% de descuento a todos los residentes del conjunto este fin de semana. ¡Los espero!",
    date: "2026-04-19T09:00:00",
    likes: 22,
    comments: 6,
  },
];

export const pqrsRequests: PQRSRequest[] = [
  {
    id: "PQRS-2026-042",
    subject: "Filtración en techo del parqueadero",
    description:
      "Hay una filtración de agua constante en la zona del parqueadero sótano 1, cerca del puesto 15. Está generando un charco que dificulta el tránsito.",
    category: "complaint",
    status: "in_progress",
    date: "2026-04-10",
    lastUpdate: "2026-04-18",
  },
  {
    id: "PQRS-2026-038",
    subject: "Solicitud de instalación de bicicletero",
    description:
      "Propongo que se instale un bicicletero con capacidad para al menos 20 bicicletas en la zona del sótano 2. Muchos residentes usamos bicicleta.",
    category: "petition",
    status: "pending",
    date: "2026-04-05",
    lastUpdate: "2026-04-05",
  },
  {
    id: "PQRS-2026-035",
    subject: "Ruido excesivo Apto 301 Torre B",
    description:
      "Reporto ruido excesivo y constante proveniente del apartamento 301 de la Torre B en horarios nocturnos (después de las 10 p.m.).",
    category: "complaint",
    status: "resolved",
    date: "2026-03-28",
    lastUpdate: "2026-04-12",
  },
  {
    id: "PQRS-2026-030",
    subject: "Mejora en iluminación zona verde",
    description:
      "Sugiero mejorar la iluminación de la zona verde principal. En las noches queda muy oscura y genera inseguridad.",
    category: "suggestion",
    status: "resolved",
    date: "2026-03-20",
    lastUpdate: "2026-04-08",
  },
];

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getPaymentStatusLabel(status: PaymentStatus): string {
  const labels: Record<PaymentStatus, string> = {
    paid: "Pagado",
    pending: "Pendiente",
    overdue: "Vencido",
  };
  return labels[status];
}

export function getPQRSCategoryLabel(
  category: PQRSRequest["category"]
): string {
  const labels: Record<PQRSRequest["category"], string> = {
    petition: "Petición",
    complaint: "Queja",
    claim: "Reclamo",
    suggestion: "Sugerencia",
  };
  return labels[category];
}

export function getPQRSStatusLabel(status: PQRSRequest["status"]): string {
  const labels: Record<PQRSRequest["status"], string> = {
    pending: "Pendiente",
    in_progress: "En curso",
    resolved: "Resuelto",
  };
  return labels[status];
}
