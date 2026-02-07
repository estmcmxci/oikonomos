'use client'

import { useState, useEffect } from 'react'
import type { DistributionSchedule } from '@/lib/api'

interface DistributionSettingsProps {
  currentMode: 'auto' | 'manual'
  currentSchedule?: DistributionSchedule
  feeSplit: number
  onSave: (mode: 'auto' | 'manual', schedule?: DistributionSchedule) => Promise<void>
  saving: boolean
}

const SCHEDULE_OPTIONS: { label: string; value: DistributionSchedule['type'] }[] = [
  { label: 'Weekly', value: 'weekly' },
  { label: 'Biweekly', value: 'biweekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Custom', value: 'custom' },
]

export function DistributionSettings({
  currentMode,
  currentSchedule,
  feeSplit,
  onSave,
  saving,
}: DistributionSettingsProps) {
  const [mode, setMode] = useState<'auto' | 'manual'>(currentMode)
  const [scheduleType, setScheduleType] = useState<DistributionSchedule['type']>(
    currentSchedule?.type ?? 'weekly'
  )
  const [customDays, setCustomDays] = useState<number>(
    currentSchedule?.customDays ?? 10
  )
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    setMode(currentMode)
    setScheduleType(currentSchedule?.type ?? 'weekly')
    setCustomDays(currentSchedule?.customDays ?? 10)
    setDirty(false)
  }, [currentMode, currentSchedule])

  const handleModeChange = (newMode: 'auto' | 'manual') => {
    setMode(newMode)
    setDirty(true)
  }

  const handleScheduleChange = (type: DistributionSchedule['type']) => {
    setScheduleType(type)
    setDirty(true)
  }

  const handleSave = async () => {
    const schedule: DistributionSchedule | undefined =
      mode === 'auto'
        ? {
            type: scheduleType,
            ...(scheduleType === 'custom' && { customDays }),
          }
        : undefined

    await onSave(mode, schedule)
    setDirty(false)
  }

  return (
    <div className="space-y-5">
      {/* Mode toggle */}
      <div>
        <div className="font-mono text-[0.5625rem] font-medium text-text-tertiary uppercase tracking-widest mb-2">
          Distribution Mode
        </div>
        <div className="flex border border-border-subtle">
          <button
            onClick={() => handleModeChange('auto')}
            className={`flex-1 py-2 font-mono text-[0.75rem] font-medium transition-colors ${
              mode === 'auto'
                ? 'bg-accent-cyan/10 text-accent-cyan border-r border-border-subtle'
                : 'text-text-tertiary hover:text-text-secondary border-r border-border-subtle'
            }`}
          >
            AUTO
          </button>
          <button
            onClick={() => handleModeChange('manual')}
            className={`flex-1 py-2 font-mono text-[0.75rem] font-medium transition-colors ${
              mode === 'manual'
                ? 'bg-amber-400/10 text-amber-400'
                : 'text-text-tertiary hover:text-text-secondary'
            }`}
          >
            MANUAL
          </button>
        </div>
        <p className="font-mono text-[0.625rem] text-text-tertiary mt-1.5">
          {mode === 'auto'
            ? 'Fees are claimed and distributed automatically on schedule.'
            : 'Fees are claimed automatically but held until you manually distribute.'}
        </p>
      </div>

      {/* Schedule selector (auto mode only) */}
      {mode === 'auto' && (
        <div>
          <div className="font-mono text-[0.5625rem] font-medium text-text-tertiary uppercase tracking-widest mb-2">
            Schedule
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {SCHEDULE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleScheduleChange(opt.value)}
                className={`py-1.5 font-mono text-[0.6875rem] border transition-colors ${
                  scheduleType === opt.value
                    ? 'bg-accent-blue/10 text-accent-blue border-accent-blue/30'
                    : 'text-text-tertiary border-border-subtle hover:text-text-secondary'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {scheduleType === 'custom' && (
            <div className="mt-2 flex items-center gap-2">
              <span className="font-mono text-[0.6875rem] text-text-tertiary">Every</span>
              <input
                type="number"
                min={1}
                max={90}
                value={customDays}
                onChange={(e) => {
                  setCustomDays(Math.max(1, Math.min(90, parseInt(e.target.value) || 1)))
                  setDirty(true)
                }}
                className="w-16 bg-transparent border border-border-subtle px-2 py-1 font-mono text-[0.75rem] text-text-primary tabular-nums focus:outline-none focus:border-accent-blue/50"
              />
              <span className="font-mono text-[0.6875rem] text-text-tertiary">days</span>
            </div>
          )}
        </div>
      )}

      {/* Fee split (read-only) */}
      <div>
        <div className="font-mono text-[0.5625rem] font-medium text-text-tertiary uppercase tracking-widest mb-1.5">
          Fee Split
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-border-subtle/30 relative overflow-hidden">
            <div
              className="h-full bg-accent-cyan/60"
              style={{ width: `${feeSplit}%` }}
            />
          </div>
          <span className="font-mono text-[0.75rem] text-text-secondary tabular-nums min-w-[60px] text-right">
            {feeSplit}% / {100 - feeSplit}%
          </span>
        </div>
        <p className="font-mono text-[0.5625rem] text-text-tertiary mt-1">
          Deployer / Service fee
        </p>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={!dirty || saving}
        className={`w-full py-2 font-mono text-[0.75rem] font-medium border transition-colors ${
          dirty && !saving
            ? 'bg-accent-blue/10 border-accent-blue/30 text-accent-blue hover:bg-accent-blue/20'
            : 'border-border-subtle text-text-tertiary cursor-not-allowed opacity-50'
        }`}
      >
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  )
}
