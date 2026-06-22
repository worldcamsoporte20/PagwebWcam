type MetricProps = {
  label: string;
  value: string;
  tone?: "mint" | "amber" | "coral";
};

const toneClass = {
  mint: "text-mint",
  amber: "text-amber",
  coral: "text-coral",
};

export function Metric({ label, value, tone = "mint" }: MetricProps) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-4 shadow-soft">
      <div className="text-sm text-steel">{label}</div>
      <div className={`mt-2 text-2xl font-semibold ${toneClass[tone]}`}>
        {value}
      </div>
    </div>
  );
}
