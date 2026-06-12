interface IconProps {
  className?: string;
  filled?: boolean;
}

const base = "h-6 w-6";

export function HomeIcon({ className = base, filled }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={filled ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9.5Z" />
    </svg>
  );
}

export function TasksIcon({ className = base, filled }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={filled ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="17" rx="3" fill={filled ? "currentColor" : "none"} stroke={filled ? "none" : "currentColor"} />
      <path d="m8.5 12.5 2.5 2.5 4.5-5" stroke={filled ? "#0c0e16" : "currentColor"} />
    </svg>
  );
}

export function HabitsIcon({ className = base, filled }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={filled ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3c1 3-3 4.5-3 8a3 3 0 0 0 6 0c0-1-.5-2-.5-2s2.5 1.5 2.5 5a5 5 0 0 1-10 0C7 8.5 11 7 12 3Z" />
    </svg>
  );
}

export function TargetIcon({ className = base, filled }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={filled ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function MoreIcon({ className = base, filled }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
      <circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function BellIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6Z" />
      <path d="M10.3 19a2 2 0 0 0 3.4 0" />
    </svg>
  );
}

export function PlusIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function FlameIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 2c.8 3.5-3.5 5-3.5 9a3.5 3.5 0 0 0 7 0c0-.8-.3-1.6-.3-1.6s2.8 1.7 2.8 5.1a6 6 0 0 1-12 0C6 8.6 10.8 6.6 12 2Z" />
    </svg>
  );
}

export function CheckIcon({ className = "h-3.5 w-3.5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 13 4 4L19 7" />
    </svg>
  );
}

export function ChevronIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 6-6 6 6 6" />
    </svg>
  );
}

export function SparkleIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 2l1.9 5.7L19.5 9 13.9 11 12 17l-1.9-6L4.5 9l5.6-1.3L12 2Zm7 12 .9 2.6 2.6.9-2.6.9L19 21l-.9-2.6-2.6-.9 2.6-.9L19 14Z" />
    </svg>
  );
}
