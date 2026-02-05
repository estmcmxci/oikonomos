interface Step {
  number: number
  label: string
}

interface ProgressIndicatorProps {
  steps: Step[]
  currentStep: number
}

export function ProgressIndicator({ steps, currentStep }: ProgressIndicatorProps) {
  return (
    <div className="flex items-center gap-2 py-5 opacity-0 animate-fade-down delay-200">
      {steps.map((step, index) => (
        <div key={step.number} className="contents">
          <div className="flex items-center gap-1.5">
            <div
              className={`progress-number ${
                step.number < currentStep
                  ? 'completed'
                  : step.number === currentStep
                  ? 'active'
                  : ''
              }`}
            >
              {step.number}
            </div>
            <span
              className={`font-mono text-[0.625rem] uppercase tracking-wider hidden md:inline ${
                step.number === currentStep ? 'text-text-secondary' : 'text-text-tertiary'
              }`}
            >
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`w-8 h-px ${
                step.number < currentStep ? 'bg-accent-cyan' : 'bg-border-subtle'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )
}

export const consumerSteps: Step[] = [
  { number: 1, label: 'Connect' },
  { number: 2, label: 'Analyze' },
  { number: 3, label: 'Discover' },
  { number: 4, label: 'Configure' },
  { number: 5, label: 'Authorize' },
]

export const providerSteps: Step[] = [
  { number: 1, label: 'Identity' },
  { number: 2, label: 'ENS' },
]
