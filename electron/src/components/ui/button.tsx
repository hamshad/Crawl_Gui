import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'ghost'
  size?: 'default' | 'sm' | 'icon'
  children: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className = '', variant = 'default', size = 'default', disabled, children, ...props },
    ref
  ) => {
    const variantClasses: Record<string, string> = {
      default: 'bg-primary text-primary-foreground hover:opacity-90',
      destructive: 'bg-destructive text-destructive-foreground hover:opacity-90',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
    }

    const sizeClasses: Record<string, string> = {
      default: 'h-10 px-4 py-2',
      sm: 'h-9 px-3',
      icon: 'h-10 w-10',
    }

    const baseClasses =
      'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50'

    return (
      <button
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
