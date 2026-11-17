import { Search } from "lucide-react";
import { Card } from "../Components/Card";
import { PageHeading } from "../Components/PageHeading";
import { Badge } from "../Components/Badge";
import { VerifyRow } from "../Components/VerifyRow";

export function ParcelPage({
  query,
  setQuery,
  searched,
  setSearched,
}: {
  query: string;
  setQuery: (v: string) => void;
  searched: boolean;
  setSearched: (v: boolean) => void;
}) {

   

  const handlerSearch = async () => {

  }

  return (
    <>
      <PageHeading
        title="Parcel Search & Record View"
        subtitle="Search the land register and verify ledger integrity."
      />
      <Card className="section-gap">
        <label className="field-label">Parcel number / title reference</label>
        <div className="search-row">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setSearched(true)}
            placeholder="e.g. KJD/LOI/4581"
          />
          <button className="btn primary" onClick={() => setSearched(true)}>
            <Search size={15} /> Search
          </button>
        </div>
        <small className="muted">
          Example: KJD/LOI/4581 · Synthetic demonstration data
        </small>
      </Card>
      {searched && query.trim().toUpperCase() === "KJD/LOI/4581" ? (
        <div className="two-col section-gap">
          <Card>
            <div className="eyebrow">REGISTERED PARCEL</div>
            <h2 className="record-title">KJD/LOI/4581</h2>
            <div className="record-field">
              <span>Registered proprietor</span>
              <b>Mary Wanjiku Kamau</b>
            </div>
            <div className="record-grid">
              <div>
                <span>Land size</span>
                <b>0.045 Ha</b>
              </div>
              <div>
                <span>County</span>
                <b>Kajiado</b>
              </div>
              <div>
                <span>Registration date</span>
                <b>14 Mar 2018</b>
              </div>
              <div>
                <span>Tenure</span>
                <b>Freehold</b>
              </div>
            </div>
            <div className="tag-row">
              <Badge tone="green">Registered</Badge>
              <Badge tone="blue">Version 1</Badge>
            </div>
          </Card>
          <Card>
            <h3>Cryptographic Confidence</h3>
            <p className="muted">Record integrity verification checklist</p>
            <VerifyRow label="Database record available" result="Match" />
            <VerifyRow label="SHA-256 digest matches" result="Match" />
            <VerifyRow
              label="Blockchain transaction confirmed"
              result="Confirmed"
            />
            <VerifyRow label="Title version consistent" result="Match" />
            <div className="confidence">
              ✓ HIGH CONFIDENCE — No mismatch detected
            </div>
          </Card>
          <Card className="full-span">
            <h3>Ledger reference</h3>
            <div className="hash">
              SHA-256:
              7c2e9f8a1b6d4c3e5f0a7b9d2e1c8f6a4b3d9e0f2a5c7b1d8e6f4a9c3b2d1e0f
            </div>
          </Card>
        </div>
      ) : (
        searched && (
          <Card className="section-gap">
            <b>No matching synthetic record found</b>
            <p className="muted">Try KJD/LOI/4581.</p>
          </Card>
        )
      )}
    </>
  );
}
