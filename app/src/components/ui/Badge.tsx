"use client";

import { type ReactNode } from "react";

type BadgeVariant = "success" | "danger" | "warning" | "info" | "neutral";

const variantClasses: Record<BadgeVariant, string> = {
  success: "bg-primary-50 text-primary",
  danger: "bg-danger-50 text-danger",
  warning: "bg-accent-50 text-accent",
  info: "bg-secondary-50 text-secondary",
  neutral: "bg-surface-alt text-text-secondary",
};

interface BadgeProps {
  variant: BadgeVariant;
  children: ReactNode;
  dot?: boolean;
}

export function Badge({ variant, children, dot }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${variantClasses[variant]}`}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            variant === "success"
              ? "bg-primary"
              : variant === "danger"
              ? "bg-danger"
              : variant === "warning"
              ? "bg-accent"
              : variant === "info"
              ? "bg-secondary"
              : "bg-text-muted"
          }`}
        />
      )}
      {children}
    </span>
  );
}
