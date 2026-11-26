import { Search } from "lucide-react";
import { Card } from "../Components/Card";
import { PageHeading } from "../Components/PageHeading";
import { Stat } from "../Components/Stat";
import { Badge } from "../Components/Badge";
import { useEffect, useState } from "react";
import type { AuditDash, TransactionHistory } from "../types/parcels.type";
import { commandService } from "../service/commonService";
import { useDebounce } from "../app/hooks";

export function AuditPage() {

  const [auditQuery, setAuditQuery] = useState("");
  const [transactions, setTransactions] =  useState<TransactionHistory[]>([])
  const debouncedSearch = useDebounce(auditQuery, 100);


  const [details, setDetails] = useState<AuditDash>({
    currentBlock: 0,
    integrityIssues: 0,
    networkPeers: 0,
    ledgerTransactions: 0,
  })

  async function handleinfo(){
    const res = await commandService.auditTrailDash();
    setDetails(res.data)
  }

  async function handlerSearch(query: string){
    const res = await commandService.transactionHistory(query);
      setTransactions(res.data)
  }

  useEffect(() => {
    handleinfo();
  }, [])

    useEffect(() => {
    // if (!debouncedSearch.trim()) return;
    handlerSearch(debouncedSearch);
  }, [debouncedSearch]);


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
              {transactions.map((row, indx) => (
                <tr key={indx}>
                  <td>{row.timestamp.toString()}</td>
                  <td>{row.actor}</td>
                  <td>{row.action}</td>
                  <td>{row.reference}</td>
                  <td>{row.transactionsId}</td>
                  <td>
                    <Badge tone="green">Committed</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {transactions.length === 0 && (
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
