"use client"

import { useToast } from "@/components/ui/use-toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <div className="fixed top-0 right-0 z-[100] p-4 space-y-2">
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <div
            key={id}
            className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm w-full"
            {...props}
          >
            <div className="flex justify-between items-start">
              <div>
                {title && <h4 className="font-semibold">{title}</h4>}
                {description && <p className="text-sm text-gray-600">{description}</p>}
              </div>
            </div>
            {action && <div className="mt-2">{action}</div>}
          </div>
        )
      })}
    </div>
  )
}