import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-2xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-primary text-white shadow hover:bg-primary/90": variant === "default",
            "bg-gradient-to-r from-primary to-secondary text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all": variant === "primary",
            "bg-purple-200 text-purple-800 shadow hover:bg-purple-300": variant === "secondary",
            "border border-input bg-background shadow-sm hover:bg-purple-50 hover:text-purple-600": variant === "outline",
            "hover:bg-purple-50 hover:text-purple-600": variant === "ghost",
          },
          {
            "h-9 px-3": size === "default",
            "h-8 rounded-md px-3 text-xs": size === "sm",
            "h-10 rounded-2xl px-8": size === "lg",
            "h-9 w-9": size === "icon",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }