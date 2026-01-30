'use client';

interface AllocationSliderProps {
  symbol: string;
  percentage: number;
  onChange: (value: number) => void;
}

export function AllocationSlider({ symbol, percentage, onChange }: AllocationSliderProps) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-[var(--color-text-primary)]">{symbol}</span>
        <span className="text-sm font-mono tabular-nums text-[var(--color-text-tertiary)]">{percentage}%</span>
      </div>
      <div className="relative">
        <input
          type="range"
          min="0"
          max="100"
          value={percentage}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 bg-[var(--color-bg-overlay)] rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, var(--color-brand-blue) 0%, var(--color-brand-blue) ${percentage}%, var(--color-bg-overlay) ${percentage}%, var(--color-bg-overlay) 100%)`,
          }}
        />
      </div>
    </div>
  );
}
