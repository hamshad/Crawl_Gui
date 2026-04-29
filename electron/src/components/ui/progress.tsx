import React from 'react'

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number | null
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className = '', value = null, ...props }, ref) => {
    const hasValue = value != null && value > 0

    return (
      <div
        ref={ref}
        className={`h-2 w-full overflow-hidden rounded-full bg-secondary ${className}`}
        {...props}
      >
        <div
          className={`h-full bg-primary transition-all ${!hasValue ? 'animate-pulse' : ''}`}
          style={{ width: hasValue ? `${value}%` : '30%' }}
        />
      </div>
    )
  }
)

Progress.displayName = 'Progress'

export default Progress
