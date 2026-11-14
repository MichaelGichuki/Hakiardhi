import { CheckCircle2 } from "lucide-react";
import { Badge } from "./Badge";

export function VerifyRow({
  label,
  result,
}: {
  label: string;
  result: string;
}) {
  return (
    <div className="verify-row">
      <CheckCircle2 size={16} />
      <span>{label}</span>
      <Badge tone="green">{result}</Badge>
    </div>
  );
}
