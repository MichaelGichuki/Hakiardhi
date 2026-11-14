import { Check } from "lucide-react";
import { Badge } from "./Badge";

export function ActivityRow({
  title,
  meta,
  status,
}: {
  title: string;
  meta: string;
  status: string;
}) {
  return (
    <div className="activity-row">
      <div className="activity-icon">
        <Check size={15} />
      </div>
      <div className="activity-copy">
        <b>{title}</b>
        <small>{meta}</small>
      </div>
      <Badge tone={status === "New" ? "blue" : "green"}>{status}</Badge>
    </div>
  );
}
