'use client';
import clsx from 'clsx';
import { AnimatePresence, motion, type HTMLMotionProps } from 'framer-motion';
import { X } from 'lucide-react';
import { createContext, forwardRef, useCallback, useContext, useState } from 'react';

export const cn = clsx;

type Variante = 'primary' | 'secondary' | 'danger' | 'community' | 'ghost' | 'outline';
const VARIANTES: Record<Variante, string> = {
  primary: 'bg-primary text-white hover:brightness-110 shadow-soft',
  secondary: 'bg-brand-blue text-white hover:brightness-110 shadow-soft',
  danger: 'bg-destructive text-white hover:brightness-110 shadow-soft',
  community: 'bg-brand-yellow text-ink-900 hover:brightness-105 shadow-soft',
  ghost: 'bg-transparent text-ink-700 hover:bg-ink-100',
  outline: 'bg-white text-ink-700 border border-ink-200 hover:border-brand-blue hover:text-brand-blue',
};
const TAMANOS = { sm: 'h-9 px-3 text-sm rounded-xl', md: 'h-11 px-5 text-sm rounded-xl', lg: 'h-12 px-6 text-base rounded-2xl' };

interface BotonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variante?: Variante;
  tamano?: keyof typeof TAMANOS;
  cargando?: boolean;
  icono?: React.ReactNode;
  children?: React.ReactNode;
}

export const Boton = forwardRef<HTMLButtonElement, BotonProps>(function Boton(
  { variante = 'primary', tamano = 'md', cargando, icono, className, children, disabled, ...props },
  ref,
) {
  const activo = !disabled && !cargando;
  return (
    <motion.button
      ref={ref}
      whileHover={activo ? { scale: 1.04 } : undefined}
      whileTap={activo ? { scale: 0.97 } : undefined}
      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
      disabled={!activo}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium select-none transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-blue',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        VARIANTES[variante],
        TAMANOS[tamano],
        className,
      )}
      {...props}
    >
      {cargando ? <span className="inline-block h-4 w-4 rounded-full border-2 border-current/30 border-t-current animate-spin" /> : icono}
      {children}
    </motion.button>
  );
});

export function Tarjeta({ className, interactiva, children, ...p }: React.HTMLAttributes<HTMLDivElement> & { interactiva?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-white border border-ink-200/70 shadow-card',
        interactiva && 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift cursor-pointer',
        className,
      )}
      {...p}
    >
      {children}
    </div>
  );
}

export const Campo = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { etiqueta?: string; ayuda?: string }>(
  function Campo({ etiqueta, ayuda, className, id, ...p }, ref) {
    const cid = id ?? p.name;
    return (
      <label className="block" htmlFor={cid}>
        {etiqueta && <span className="mb-1.5 block text-sm font-medium text-ink-700">{etiqueta}</span>}
        <input
          ref={ref}
          id={cid}
          className={cn(
            'w-full min-h-[44px] rounded-xl border border-ink-200 bg-white px-3.5 text-sm text-ink-900 placeholder:text-ink-400',
            'transition-all duration-200 focus:outline-none focus:border-brand-blue focus:shadow-glow',
            className,
          )}
          {...p}
        />
        {ayuda && <span className="mt-1 block text-xs text-ink-500">{ayuda}</span>}
      </label>
    );
  },
);

export function AreaTexto({ etiqueta, className, ...p }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { etiqueta?: string }) {
  return (
    <label className="block">
      {etiqueta && <span className="mb-1.5 block text-sm font-medium text-ink-700">{etiqueta}</span>}
      <textarea
        className={cn(
          'w-full min-h-[96px] rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm placeholder:text-ink-400',
          'transition-all duration-200 focus:outline-none focus:border-brand-blue focus:shadow-glow',
          className,
        )}
        {...p}
      />
    </label>
  );
}

export function Selector({ etiqueta, children, className, ...p }: React.SelectHTMLAttributes<HTMLSelectElement> & { etiqueta?: string }) {
  return (
    <label className="block">
      {etiqueta && <span className="mb-1.5 block text-sm font-medium text-ink-700">{etiqueta}</span>}
      <select
        className={cn(
          'w-full min-h-[44px] rounded-xl border border-ink-200 bg-white px-3 text-sm',
          'focus:outline-none focus:border-brand-blue focus:shadow-glow',
          className,
        )}
        {...p}
      >
        {children}
      </select>
    </label>
  );
}

const TONOS = { success: 'pill-success', info: 'pill-info', danger: 'pill-danger', warning: 'pill-warning', neutral: 'pill-neutral' };
export type Tono = keyof typeof TONOS;
export function Insignia({ tono = 'neutral', punto, children }: { tono?: Tono; punto?: boolean; children: React.ReactNode }) {
  return (
    <span className={TONOS[tono]}>
      {punto && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export const ESTADOS: Record<string, { texto: string; tono: Tono }> = {
  PENDIENTE: { texto: 'Pendiente', tono: 'info' },
  PAGADO: { texto: 'Pagado', tono: 'success' },
  ANULADO: { texto: 'Anulado', tono: 'neutral' },
  CONFIRMADO: { texto: 'Confirmado', tono: 'success' },
  RECHAZADO: { texto: 'Rechazado', tono: 'danger' },
  RADICADA: { texto: 'Radicada', tono: 'info' },
  EN_PROCESO: { texto: 'En proceso', tono: 'warning' },
  RESUELTA: { texto: 'Resuelta', tono: 'success' },
  CERRADA: { texto: 'Cerrada', tono: 'neutral' },
  APROBADA: { texto: 'Aprobada', tono: 'success' },
  RECHAZADA: { texto: 'Rechazada', tono: 'danger' },
  CANCELADA: { texto: 'Cancelada', tono: 'neutral' },
  VENCIDO: { texto: 'En mora', tono: 'danger' },
};
export const Estado = ({ estado }: { estado: string }) => {
  const e = ESTADOS[estado] ?? { texto: estado, tono: 'neutral' as Tono };
  return <Insignia tono={e.tono} punto>{e.texto}</Insignia>;
};

const COLOR_DATO = {
  green: 'bg-brand-green-light text-brand-green-700',
  blue: 'bg-brand-blue-light text-brand-blue',
  red: 'bg-brand-red-light text-brand-red-700',
  yellow: 'bg-brand-yellow-light text-brand-yellow-800',
};
export function Dato({ titulo, valor, icono, color = 'blue', detalle }: { titulo: string; valor: React.ReactNode; icono?: React.ReactNode; color?: keyof typeof COLOR_DATO; detalle?: string }) {
  return (
    <Tarjeta className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-ink-500">{titulo}</p>
          <p className="mt-1 text-2xl font-bold text-brand-navy tabular-nums">{valor}</p>
          {detalle && <p className="mt-1 text-xs text-ink-500">{detalle}</p>}
        </div>
        {icono && <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', COLOR_DATO[color])}>{icono}</div>}
      </div>
    </Tarjeta>
  );
}

export function Vacio({ titulo, texto, accion }: { titulo: string; texto?: string; accion?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-white px-6 py-12 text-center">
      <p className="font-medium text-ink-800">{titulo}</p>
      {texto && <p className="mt-1 max-w-sm text-sm text-ink-500">{texto}</p>}
      {accion && <div className="mt-4">{accion}</div>}
    </div>
  );
}

export function Cargando({ filas = 3 }: { filas?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: filas }).map((_, i) => (
        <div key={i} className="skeleton h-16" />
      ))}
    </div>
  );
}

export function Encabezado({ titulo, subtitulo, acciones }: { titulo: string; subtitulo?: string; acciones?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1>{titulo}</h1>
        {subtitulo && <p className="mt-1 text-sm text-ink-500">{subtitulo}</p>}
      </div>
      {acciones && <div className="flex flex-wrap gap-2">{acciones}</div>}
    </div>
  );
}

export function Dialogo({ abierto, alCerrar, titulo, children, ancho = 'max-w-lg' }: { abierto: boolean; alCerrar: () => void; titulo: string; children: React.ReactNode; ancho?: string }) {
  return (
    <AnimatePresence>
      {abierto && (
        <motion.div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-ink-900/30 backdrop-blur-sm" onClick={alCerrar} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={titulo}
            className={cn('relative w-full rounded-t-3xl sm:rounded-3xl bg-white p-6 shadow-lift max-h-[90vh] overflow-y-auto', ancho)}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2>{titulo}</h2>
              <button onClick={alCerrar} className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100" aria-label="Cerrar">
                <X size={18} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---------- Avisos (toasts) ----------
type Aviso = { id: number; texto: string; tipo: 'ok' | 'error' };
const AvisoCtx = createContext<(texto: string, tipo?: 'ok' | 'error') => void>(() => {});
export const useAviso = () => useContext(AvisoCtx);

export function AvisosProvider({ children }: { children: React.ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const avisar = useCallback((texto: string, tipo: 'ok' | 'error' = 'ok') => {
    const id = Date.now() + Math.random();
    setAvisos((a) => [...a, { id, texto, tipo }]);
    setTimeout(() => setAvisos((a) => a.filter((x) => x.id !== id)), 4500);
  }, []);
  return (
    <AvisoCtx.Provider value={avisar}>
      {children}
      <div className="fixed right-4 top-4 z-[60] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2" aria-live="polite">
        <AnimatePresence>
          {avisos.map((a) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'rounded-xl border px-4 py-3 text-sm shadow-lift bg-white',
                a.tipo === 'ok' ? 'border-brand-green/30 text-brand-green-700' : 'border-brand-red/30 text-brand-red-700',
              )}
            >
              {a.texto}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </AvisoCtx.Provider>
  );
}

export function Logo({ variante = 'completo', className }: { variante?: 'completo' | 'nombre' | 'icono'; className?: string }) {
  const src = variante === 'completo' ? '/brand/logo.png' : variante === 'nombre' ? '/brand/name.png' : '/brand/logosolo.png';
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="Mi Conjunto" className={className} />;
}

export function Transicion({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}
