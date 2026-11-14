import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "../Components/Badge";
import { PageHeading } from "../Components/PageHeading";
import { Card } from "../Components/Card";


const originalRecord = {
  owner: "Mary Wanjiku Kamau",
  size: "0.045 Ha",
  county: "Kajiado",
};

export function TamperPage({
  record,
  setRecord,
  tampered,
}: {
  record: typeof originalRecord;
  setRecord: (r: typeof originalRecord) => void;
  tampered: boolean;
}) {
  const update = (key: keyof typeof originalRecord, value: string) =>
    setRecord({ ...record, [key]: value });
  return (
    <>
      <PageHeading
        title="Tamper Detection Security Tool"
        subtitle="Simulate unauthorized database modification and detect integrity violations."
      />
      <Card className="section-gap">
        <div className="card-heading">
          <h3>Live integrity comparison</h3>
          <Badge tone={tampered ? "red" : "green"}>
            {tampered ? "⚠ Mismatch detected" : "● Records match"}
          </Badge>
        </div>
        <div className="two-col">
          <div>
            <div className="card-heading">
              <h3>Database record</h3>
              <Badge tone="blue">Mutable</Badge>
            </div>
            <label className="field-label">Registered proprietor</label>
            <input
              className="text-input"
              value={record.owner}
              onChange={(e) => update("owner", e.target.value)}
            />
            <label className="field-label">Parcel size</label>
            <input
              className="text-input"
              value={record.size}
              onChange={(e) => update("size", e.target.value)}
            />
            <label className="field-label">County</label>
            <input
              className="text-input"
              value={record.county}
              onChange={(e) => update("county", e.target.value)}
            />
            <small className="muted">
              Edit any field to simulate unauthorized access.
            </small>
          </div>
          <div>
            <div className="card-heading">
              <h3>Blockchain anchor</h3>
              <Badge tone="green">Immutable reference</Badge>
            </div>
            {Object.entries({
              owner: "Expected proprietor",
              size: "Expected parcel size",
              county: "Expected county",
            }).map(([key, label]) => (
              <div className="anchor-field" key={key}>
                <small>{label}</small>
                <b>{originalRecord[key as keyof typeof originalRecord]}</b>
              </div>
            ))}
            <small className="muted">Stored SHA-256 digest</small>
            <div className="hash">7c2e9f8a1b6d4c3e5f0a7b9d2e1c8f6a</div>
          </div>
        </div>
        {tampered ? (
          <div className="tamper-alert">
            <div>
              <AlertTriangle size={26} /> TAMPER DETECTED
            </div>
            <b>CRITICAL INTEGRITY VIOLATION — DATABASE / LEDGER MISMATCH</b>
            <p>
              Unauthorized modification detected. Anchored reference no longer
              matches the database record. The transfer should be blocked
              pending investigation.
            </p>
          </div>
        ) : (
          <div className="confidence">
            <CheckCircle2 size={17} /> Integrity verified. Current record
            matches the anchored reference.
          </div>
        )}
        <div className="button-row">
          <button
            className="btn"
            onClick={() =>
              setRecord({
                ...originalRecord,
                owner: "John Kamau (UNAUTHORIZED)",
              })
            }
          >
            Simulate unauthorized edit
          </button>
          <button
            className="btn primary"
            onClick={() => setRecord(originalRecord)}
          >
            Restore original record
          </button>
        </div>
      </Card>
      <p className="muted small">
        Technical note: This demo compares input fields to a fixed expected
        record. Production should canonicalize the complete record, calculate
        SHA-256 independently and compare the digest with an authenticated
        ledger value.
      </p>
    </>
  );
}
