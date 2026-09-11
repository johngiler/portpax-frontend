import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";

type NoticeVariant = "error" | "warning" | "success";

type NoticeAlertProps = {
  variant: NoticeVariant;
  messages: string[];
  className?: string;
};

const NOTICE_STYLES: Record<
  NoticeVariant,
  { container: string; icon: string; Icon: typeof AlertCircle }
> = {
  error: {
    container:
      "border-red-200/90 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300",
    icon: "text-red-600 dark:text-red-400",
    Icon: AlertCircle,
  },
  warning: {
    container:
      "border-amber-200/90 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/25 dark:text-amber-300",
    icon: "text-amber-600 dark:text-amber-400",
    Icon: AlertTriangle,
  },
  success: {
    container:
      "border-emerald-200/90 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/25 dark:text-emerald-300",
    icon: "text-emerald-600 dark:text-emerald-400",
    Icon: CheckCircle2,
  },
};

export default function NoticeAlert({
  variant,
  messages,
  className = "",
}: NoticeAlertProps) {
  if (messages.length === 0) return null;

  const { container, icon, Icon } = NOTICE_STYLES[variant];
  const role = variant === "error" ? "alert" : "status";

  return (
    <div className={`flex flex-col gap-3 ${className}`.trim()}>
      {messages.map((message, index) => (
        <div
          key={`${index}-${message.slice(0, 64)}`}
          className={`flex gap-3 rounded-xl border px-4 py-3 ${container}`}
          role={role}
        >
          <Icon
            className={`mt-0.5 h-5 w-5 shrink-0 ${icon}`}
            strokeWidth={2}
            aria-hidden
          />
          <p className="min-w-0 text-sm leading-snug">{message}</p>
        </div>
      ))}
    </div>
  );
}
