import { useToast } from "@/hooks/use-toast"
import { CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

const getToastIcon = (variant?: string) => {
  switch (variant) {
    case "destructive":
      return <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
    case "success":
      return <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
    case "warning":
      return <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
    default:
      return <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
  }
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        const variant = (props as any).variant;
        return (
          <Toast key={id} variant={variant} {...props} className="p-4 mb-3">
            {getToastIcon(variant)}
            <div className="grid gap-1 flex-1">
              {title && <ToastTitle className="text-sm font-semibold leading-tight">{title}</ToastTitle>}
              {description && (
                <ToastDescription className="text-sm opacity-90 leading-relaxed">{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose className="right-2 top-2" />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
