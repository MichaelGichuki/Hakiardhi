export function Badge({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: "green" | "amber" | "red" | "blue" | "slate";
}) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
