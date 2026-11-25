import { Search } from "lucide-react";
import { Card } from "../Components/Card";
import { PageHeading } from "../Components/PageHeading";
import { Stat } from "../Components/Stat";
import { Badge } from "../Components/Badge";
import { useMemo, useState } from "react";
import type { AuditDash } from "../types/parcels.type";

export function AuditPage() {

  const [auditQuery, setAuditQuery] = useState("");
  const auditRows = [
    [
      "02 Nov 2026 10:42",
      "Land Officer",
      "Transfer initiated",
      "TR-2026-0841",
      "0x7a31...b90e",
    ],
    [
      "02 Nov 2026 10:16",
      "Citizen Portal",
      "Owner consent recorded",
      "TR-2026-0838",
      "0x3b92...e12a",
    ],
    [
      "02 Nov 2026 09:51",
      "Verification Officer",
      "Document hash anchored",
      "TR-2026-0841",
      "0x81c2...a63f",
    ],
    [
      "02 Nov 2026 09:14",
      "Registrar",
      "Title version approved",
      "KJD/LOI/4581",
      "0x4f8b...2c10",
    ],
    [
      "01 Nov 2026 16:28",
      "Land Officer",
      "Parcel record verified",
      "KJD/LOI/4590",
      "0x92d0...3e61",
    ],
    [
      "01 Nov 2026 14:03",
      "Verification Officer",
      "Legal document review",
      "TR-2026-0836",
      "0xc7a1...f04b",
    ],
  ];
  const rows = useMemo(
    () =>
      auditRows.filter((row) =>
        row.join(" ").toLowerCase().includes(auditQuery.toLowerCase()),
      ),
    [auditQuery],
  );

  const [details, setDetails] = useState<AuditDash>({
    currentBlock: 0,
    integrityIssues: 0,
    networkPeers: 0,
    ledgerTransactions: 0,
    transactionsHistory: []
  })


  return (
    <>
      <PageHeading
        title="Immutable Audit Trail"
        subtitle="Chronological record of ledger-anchored land registry events."
      />
      <div className="stats-grid">
        <Stat
          label="Ledger transactions"
          value={`${details.ledgerTransactions}`}
          note="Committed records"
        />
        <Stat label="Current block" value={`${details.currentBlock}`} note="Fabric ledger" />
        <Stat
          label="Network peers"
          value={`${details.networkPeers}`}
          note="Synchronized"
          tone="good"
        />
        <Stat
          label="Integrity incidents"
          value={`${details.integrityIssues}`}
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
              value={auditQuery}
              onChange={(e) => setAuditQuery(e.target.value)}
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
