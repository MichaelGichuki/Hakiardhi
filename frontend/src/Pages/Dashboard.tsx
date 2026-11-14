import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Badge } from "../Components/Badge";
import { Card } from "../Components/Card";
import { PageHeading } from "../Components/PageHeading";
import { Stat } from "../Components/Stat";
import { ActivityRow } from "../Components/ActivityRow";
import type { Page } from "../types";
import { useNavigate } from "react-router";

export function Dashboard() {
  const navigate = useNavigate();
  const go = (next: Page) => {
    // setPage(next);
    navigate(`/${next}`);
  };

  return (
    <>
      <PageHeading
        title="Staff Command Center"
        subtitle="Land administration overview · Nairobi Registry"
        action={
          <button className="btn primary" onClick={() => go("workflow")}>
            ＋ Initiate transfer
          </button>
        }
      />
      <div className="stats-grid">
        <Stat
          label="Pending transfers"
          value="24"
          note="↑ 4 awaiting review"
          tone="warn"
        />
        <Stat
          label="Verified parcels"
          value="8,451"
          note="● Ledger verified"
          tone="good"
        />
        <Stat
          label="Awaiting owner consent"
          value="07"
          note="Across 3 registries"
        />
        <Stat
          label="Completed today"
          value="12"
          note="↑ 3 from yesterday"
          tone="good"
        />
      </div>
      <div className="two-col section-gap">
        <Card>
          <div className="card-heading">
            <h3>Transfer processing queue</h3>
            <Badge tone="amber">Action required</Badge>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Parcel</th>
                  <th>Stage</th>
                  <th>Priority</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>TR-2026-0841</td>
                  <td>KJD/LOI/4581</td>
                  <td>Owner consent</td>
                  <td>
                    <Badge tone="amber">High</Badge>
                  </td>
                </tr>
                <tr>
                  <td>TR-2026-0839</td>
                  <td>NAI/BLK/0912</td>
                  <td>Document review</td>
                  <td>
                    <Badge tone="blue">Normal</Badge>
                  </td>
                </tr>
                <tr>
                  <td>TR-2026-0836</td>
                  <td>KIAM/3321</td>
                  <td>Registrar</td>
                  <td>
                    <Badge tone="amber">High</Badge>
                  </td>
                </tr>
                <tr>
                  <td>TR-2026-0834</td>
                  <td>MAC/0918</td>
                  <td>Initiated</td>
                  <td>
                    <Badge tone="blue">Normal</Badge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <button className="btn" onClick={() => go("workflow")}>
            Open workflow <ArrowRight size={14} />
          </button>
        </Card>
        <Card>
          <div className="card-heading">
            <h3>Blockchain network health</h3>
            <Badge tone="green">Healthy</Badge>
          </div>
          <div className="health-score">99.98%</div>
          <p className="muted">Network availability · Hyperledger Fabric</p>
          <div className="progress">
            <span style={{ width: "100%" }} />
          </div>
          <div className="health-line">
            <CheckCircle2 size={15} /> All peers synchronized
          </div>
          <div className="detail-pair">
            <span>Peer</span>
            <b>peer0.org1.land.go.ke</b>
          </div>
          <div className="detail-pair">
            <span>Latest block</span>
            <b>#0084512</b>
          </div>
        </Card>
      </div>
      <Card className="section-gap">
        <h3>Recent system activity</h3>
        <ActivityRow
          title="Document hash anchored on ledger"
          meta="TR-2026-0841 · Land Officer · 10:42 AM"
          status="Success"
        />
        <ActivityRow
          title="Owner consent received"
          meta="TR-2026-0838 · Citizen Portal · 10:16 AM"
          status="Success"
        />
        <ActivityRow
          title="New parcel verification request"
          meta="KJD/LOI/4581 · 09:51 AM"
          status="New"
        />
      </Card>
    </>
  );
}
