import { Check, X } from "lucide-react";
import { Badge } from "../Components/Badge";
import { Card } from "../Components/Card";
import { PageHeading } from "../Components/PageHeading";
import { Stat } from "../Components/Stat";
import type { Page } from "../types";
import { useNavigate } from "react-router";

export function LandownerPage({
  decision,
  setDecision,
}: {
  decision: "approved" | "rejected" | null;
  setDecision: (v: "approved" | "rejected" | null) => void;
}) {

  const navigate = useNavigate();
  const go = (next: Page) => {
    navigate(`/${next}`);
  };

  return (
    <>
      <PageHeading
        title="Landowner Portal"
        subtitle="Your property. Your identity. Your authority."
      />
      <Card className="profile-card section-gap">
        <div className="profile-avatar">MW</div>
        <div className="profile-copy">
          <b>Mary Wanjiku Kamau</b>
          <small>National ID: 2XXXXXXX · Verified citizen</small>
        </div>
        <Badge tone="green">Identity verified</Badge>
      </Card>
      <div className="stats-grid">
        <Stat label="My properties" value="02" note="Registered parcels" />
        <Stat
          label="Incoming requests"
          value={decision ? "00" : "01"}
          note="Requires your action"
          tone="warn"
        />
        <Stat label="Completed transfers" value="00" note="This account" />
        <Stat
          label="Account status"
          value="Protected"
          note="Identity verified"
          tone="good"
        />
      </div>
      <Card className="section-gap">
        <h3>My registered properties</h3>
        <div className="property-row">
          <div>
            <b>KJD/LOI/4581</b>
            <small>Loitokitok · Kajiado · 0.045 Ha</small>
          </div>
          <Badge tone="green">Verified</Badge>
          <button className="btn" onClick={() => go("certificate")}>
            View title
          </button>
        </div>
        <div className="property-row">
          <div>
            <b>KJD/LOI/4590</b>
            <small>Loitokitok · Kajiado · 0.080 Ha</small>
          </div>
          <Badge tone="green">Verified</Badge>
          <button className="btn" onClick={() => go("parcels")}>
            View record
          </button>
        </div>
      </Card>
      <Card className="section-gap request-card">
        <div className="card-heading">
          <h3>Incoming transfer request</h3>
          <Badge
            tone={
              decision ? (decision === "approved" ? "green" : "red") : "amber"
            }
          >
            {decision
              ? decision === "approved"
                ? "Consent confirmed"
                : "Rejected"
              : "Action required"}
          </Badge>
        </div>
        <h2 className="record-title">TR-2026-0841</h2>
        <div className="record-grid">
          <div>
            <span>Parcel</span>
            <b>KJD/LOI/4581</b>
          </div>
          <div>
            <span>Proposed buyer</span>
            <b>Peter Mwangi Njoroge</b>
          </div>
          <div>
            <span>Transaction</span>
            <b>Sale / Transfer</b>
          </div>
          <div>
            <span>Application date</span>
            <b>02 Nov 2026</b>
          </div>
        </div>
        <p className="muted">
          Review this request carefully. Approving authorizes the transfer to
          continue; it does not bypass legal verification or registrar approval.
        </p>
        {decision ? (
          <div className={`decision-message ${decision}`}>
            {decision === "approved"
              ? "✓ Consent confirmed in this demo. The request can proceed to document verification."
              : "✕ Transfer rejected. The workflow is stopped; no title version can be minted."}
          </div>
        ) : (
          <div className="button-row">
            <button
              className="btn primary"
              onClick={() => setDecision("approved")}
            >
              <Check size={15} /> Confirm transfer
            </button>
            <button
              className="btn danger"
              onClick={() => setDecision("rejected")}
            >
              <X size={15} /> Reject transfer
            </button>
          </div>
        )}
      </Card>
    </>
  );
}
