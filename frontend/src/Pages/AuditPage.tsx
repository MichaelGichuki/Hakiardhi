import { Search } from "lucide-react";
import { Card } from "../Components/Card";
import { PageHeading } from "../Components/PageHeading";
import { Stat } from "../Components/Stat";
import { Badge } from "../Components/Badge";

export function AuditPage({
  query,
  setQuery,
  rows,
}: {
  query: string;
  setQuery: (v: string) => void;
  rows: string[][];
}) {
  return (
    <>
      <PageHeading
        title="Immutable Audit Trail"
        subtitle="Chronological record of ledger-anchored land registry events."
      />
      <div className="stats-grid">
        <Stat
          label="Ledger transactions"
          value="8,512"
          note="Committed records"
        />
        <Stat label="Current block" value="8,512" note="Fabric ledger" />
        <Stat
          label="Network peers"
          value="04"
          note="Synchronized"
          tone="good"
        />
        <Stat
          label="Integrity incidents"
          value="00"
          note="No incidents"
          tone="good"
        />
      </div>
      <Card className="section-gap">
        <div className="card-heading">
          <h3>Transaction history</h3>
          <div className="search-mini">
            <Search size={14} />
            <input
              placeholder="Search reference / actor..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Reference</th>
                <th>Transaction ID</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row[4]}>
                  {row.map((cell, i) => (
                    <td key={i}>{cell}</td>
                  ))}
                  <td>
                    <Badge tone="green">Committed</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && (
            <div className="empty-state">No matching transactions found.</div>
          )}
        </div>
        <small className="muted">
          Transaction IDs are shortened display values for this mockup. Full
          cryptographic identifiers are stored in the ledger.
        </small>
      </Card>
    </>
  );
}
