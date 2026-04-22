interface AvatarProps {
  initials: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

export function Avatar({ initials, size = "md" }: AvatarProps) {
  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-secondary-50 text-secondary font-semibold flex items-center justify-center shrink-0`}
    >
      {initials}
    </div>
  );
}
