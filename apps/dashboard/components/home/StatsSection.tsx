export function StatsSection() {
  const stats = [
    { value: '47', highlight: true, label: 'Active Agents' },
    { value: '12.4', suffix: 'K', label: 'Executions' },
    { value: '$8.2', suffix: 'M', label: 'Total Volume' },
    { value: '5.2', suffix: 'bps', label: 'Avg Slippage' },
  ]

  return (
    <section className="py-16 border-t border-b border-border-subtle opacity-0 animate-fade-up delay-700">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border-subtle">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="font-mono text-4xl font-bold text-text-primary leading-none mb-2">
              {stat.highlight ? (
                <span className="text-accent-blue">{stat.value}</span>
              ) : (
                <>
                  {stat.value}
                  {stat.suffix && <span className="text-accent-blue">{stat.suffix}</span>}
                </>
              )}
            </div>
            <div className="font-mono text-[0.6875rem] font-normal text-text-tertiary uppercase tracking-widest">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
