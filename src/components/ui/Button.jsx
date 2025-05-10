import { forwardRef } from "react"

const Button = forwardRef(
  (
    { className = "", variant = "default", size = "default", children, disabled = false, type = "button", ...props },
    ref,
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"

    const variants = {
      default: "bg-slate-700 text-white hover:bg-slate-800",
      destructive: "bg-red-500 text-white hover:bg-red-600",
      outline: "border border-slate-200 bg-background hover:bg-slate-100 hover:text-slate-900",
      secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
      ghost: "hover:bg-slate-100 hover:text-slate-900",
      link: "text-slate-900 underline-offset-4 hover:underline",
    }

    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-md px-3 text-xs",
      lg: "h-11 rounded-md px-8 text-base",
      icon: "h-10 w-10",
    }

    const variantStyle = variants[variant] || variants.default
    const sizeStyle = sizes[size] || sizes.default

    return (
      <button
        ref={ref}
        type={type}
        className={`${baseStyles} ${variantStyle} ${sizeStyle} ${className}`}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    )
  },
)

Button.displayName = "Button"

export default Button
