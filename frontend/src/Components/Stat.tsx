import { Card } from "./Card";

export function Stat({
  label,
  value,
  note,
  tone = "normal",
}: {
  label: string;
  value: string;
  note: string;
  tone?: "normal" | "good" | "warn";
}) {
  return (
    <Card>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className={`stat-note ${tone}`}>{note}</div>
    </Card>
  );
}
